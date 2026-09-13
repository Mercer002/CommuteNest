import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import mime from "mime-types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");
const infraDir = path.resolve(rootDir, "../../infra");

if (!fs.existsSync(distDir)) {
  console.error("Error: dist/ directory not found. Run 'npm run build' first.");
  process.exit(1);
}

// Get Terraform outputs
let bucketName = process.env.FRONTEND_S3_BUCKET;
let distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;

if (!bucketName || !distributionId) {
  try {
    const rawOutputs = execSync(
      "AWS_PROFILE=commutenest-dev /Users/MineNow/.local/bin/terraform output -json",
      { cwd: infraDir, encoding: "utf-8" },
    );
    const outputs = JSON.parse(rawOutputs);
    bucketName = bucketName || outputs.frontend_s3_bucket_name?.value;
    distributionId = distributionId || outputs.cloudfront_distribution_id?.value;
  } catch (err) {
    console.warn("Could not read terraform output:", err.message);
  }
}

if (!bucketName) {
  console.error("Error: FRONTEND_S3_BUCKET not found in environment or terraform output.");
  process.exit(1);
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const cfClient = new CloudFrontClient({
  region: "us-east-1",
});

async function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

async function uploadFile(filePath) {
  const relativePath = path.relative(distDir, filePath).replace(/\\/g, "/");
  const fileContent = fs.readFileSync(filePath);
  const contentType = mime.lookup(filePath) || "application/octet-stream";

  const isHtml = relativePath === "index.html";
  const cacheControl = isHtml
    ? "public, max-age=0, must-revalidate"
    : "public, max-age=31536000, immutable";

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: relativePath,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );

  console.log(`  Uploaded ${relativePath} (${contentType})`);
}

async function main() {
  console.log(`Deploying web-frontend assets to S3 bucket: ${bucketName}...`);
  const files = await getAllFiles(distDir);
  console.log(`Found ${files.length} files in dist/ to upload.`);

  for (const file of files) {
    await uploadFile(file);
  }

  console.log("All assets uploaded successfully.");

  if (distributionId) {
    console.log(`Invalidating CloudFront cache for distribution: ${distributionId}...`);
    const invalidation = await cfClient.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `deploy-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: ["/*"],
          },
        },
      }),
    );
    console.log(`Invalidation submitted. ID: ${invalidation.Invalidation?.Id}`);
  }

  console.log("Deployment complete!");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});

