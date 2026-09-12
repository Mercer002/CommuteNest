# CommuteNest
```markdown
# CommuteNest | Serverless Transit-Optimized Housing Alert Engine

An event-driven, serverless pipeline that monitors real-time housing and sublet listings, computes multi-modal commute times via the Google Maps Distance Matrix API, and dispatches real-time SMS alerts to users when listings meet strict budget and travel constraints.

Provisioned entirely via **Terraform** and deployed through automated **GitHub Actions CI/CD pipelines**.

---

## System Architecture

```text
               +-------------------------------------------------------+
               |                  EVENT-DRIVEN BACKEND                 |
               +-------------------------------------------------------+
                                           |
[EventBridge Cron]                        v
       |               +---------------------------------------+
       +-------------->|      Scraper & Ingestion Worker       |
                       |             (AWS Lambda)              |
                       +---------------------------------------+
                                    |              |
           [Scrapes New Listings]   |              |  [Transit Time Query]
                                    v              v
                       +----------------+      +-----------------------+
                       | Housing Market |      |    Google Maps API    |
                       |    Endpoints   |      |   (Distance Matrix)   |
                       +----------------+      +-----------------------+
                                    |
                                    v
                       +---------------------------------------+
                       |      Listing Filter & Deduplication   |
                       |             (AWS Lambda)              |
                       +---------------------------------------+
                                    |              |
                 [PutItem / Conditional Check]     | [Trigger Alert if Match]
                                    v              v
                       +----------------+      +-----------------------+
                       | Amazon DynamoDB|      |       Amazon SNS      |
                       | (State & TTL)  |      |   (SMS / Email Push)  |
                       +----------------+      +-----------------------+

               +-------------------------------------------------------+
               |                   FRONTEND & CONTROL PLANE            |
               +-------------------------------------------------------+

[End User] <---> [CloudFront CDN] <---> [S3 Bucket: React + Vite SPA]
                       |
                       v
             [Amazon API Gateway]
                       |
                       v
      [User Preference Lambda (CRUD)] <---> [Amazon DynamoDB]

```

---

## Key Technical Highlights

* **Event-Driven Microservices:** Zero-idle-cost infrastructure utilizing AWS EventBridge scheduled expressions to orchestrate scraping and validation tasks via AWS Lambda.
* **Idempotent Ingestion & Deduplication:** Leverages DynamoDB conditional writes (`attribute_not_exists`) and TTL (Time-To-Live) expiration to ensure duplicate listings are discarded before executing downstream calculations.
* **Cost & Latency Optimization:** Batches geographic coordinates and caches distance queries to minimize billable hits against the Google Maps Distance Matrix API.
* **Least-Privilege Cloud Security:** IAM execution roles scoped strictly to granular resource ARNs with dedicated policies for DynamoDB read/writes, SNS publish events, and CloudWatch log groups.
* **Declarative IaC:** 100% of cloud resources (networking, compute, storage, DNS, permissions) are defined and versioned in modular Terraform configurations.

---

## Tech Stack

| Domain | Technologies |
| --- | --- |
| **Cloud Platform** | AWS (Lambda, EventBridge, DynamoDB, SNS, API Gateway, S3, CloudFront, IAM) |
| **Infrastructure as Code** | Terraform (`>= 1.5.0`), AWS CLI |
| **CI/CD** | GitHub Actions (Terraform plan/apply, Vitest, automated S3 deployment) |
| **Backend Runtime** | Node.js 20.x / TypeScript, AWS SDK v3 |
| **Frontend Client** | React 18, TypeScript, Vite, TailwindCSS |
| **External APIs** | Google Maps Distance Matrix API (Transit routing) |

---

## Project Structure

```text
├── .github/
│   └── workflows/
│       ├── terraform-deploy.yml    # Lint, plan, and apply IaC on main branch push
│       └── frontend-deploy.yml     # Build Vite app and sync to S3 with CDN invalidation
├── infra/
│   ├── modules/
│   │   ├── compute/                # Lambda functions & EventBridge triggers
│   │   ├── database/               # DynamoDB table definitions & TTL configuration
│   │   ├── notifications/          # SNS topics and subscriptions
│   │   └── web/                    # S3 static bucket, CloudFront distribution, OAI
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── services/
│   ├── ingestion-worker/           # Scraper, distance matrix client, alert logic
│   └── preferences-api/            # REST API for user commute/budget settings
├── web/                            # React + Vite dashboard
└── README.md

```

---

## Infrastructure & DevOps Practices

### 1. Zero-Trust IAM Scoping

The Lambda execution role avoids broad wildcard (`*`) access. DynamoDB access is restricted strictly to table-level operations:

```hcl
statement {
  effect    = "Allow"
  actions   = ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem"]
  resources = [aws_dynamodb_table.listings.arn]
}

```

### 2. Automated CI/CD Lifecycle

* **Pull Requests:** Runs `terraform fmt -check`, `tflint`, and generates automated `terraform plan` output in PR comments.
* **Merge to Main:** Executes `terraform apply -auto-approve` via OpenID Connect (OIDC) authentication, eliminating persistent AWS secret keys in GitHub Secrets.

---

## Local Development Setup

### Prerequisites

* [Node.js](https://nodejs.org/) `>= 20.0.0`
* [Terraform](https://www.terraform.io/) `>= 1.5.0`
* [AWS CLI](https://aws.amazon.com/cli/) configured with local credentials
* Google Maps API Key with **Distance Matrix API** enabled

### 1. Clone & Install Dependencies

```bash
git clone [https://github.com/your-username/commute-nest.git](https://github.com/your-username/commute-nest.git)
cd commute-nest

# Install root & service dependencies
npm install --prefix services/ingestion-worker
npm install --prefix web

```

### 2. Configure Environment Variables

Create a `.env` file in `services/ingestion-worker`:

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
MAX_COMMUTE_MINUTES=35
TARGET_DESTINATION_LAT_LNG="45.5048,-73.5772"
DYNAMODB_TABLE_NAME=CommuteNest-Listings-dev
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:CommuteNest-Alerts-dev

```

### 3. Deploy Cloud Infrastructure

```bash
cd infra
terraform init
terraform plan -var="environment=dev"
terraform apply -var="environment=dev"

```

### 4. Run the Client Locally

```bash
cd ../web
npm run dev

```

---

## Key Architectural Decisions

* **Why DynamoDB over PostgreSQL (RDS)?**
Workloads are primarily key-value lookups (`listing_id`) and single-record writes. DynamoDB offers sub-10ms performance, native TTL auto-purging for expired listings, and zero server maintenance overhead at fractional cost.
* **Why EventBridge + Lambda over an EC2/ECS Long-Running Daemon?**
Scraping runs on scheduled 15-minute bursts. Running an EC2 instance 24/7 incurs continuous billing for idle compute; serverless invocation scales compute costs strictly to seconds of active execution.

```

<FollowUp label="Want to add system architecture diagrams using Mermaid syntax to this README?" query="Update this README with an embedded Mermaid.js architecture diagram and data flow sequence."/>

```
