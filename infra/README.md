# Phase 2: IaC & Cloud Foundation

This Terraform layer creates the foundational AWS resources for CommuteNest:

- DynamoDB table for seen housing listings with TTL and point-in-time recovery
- DynamoDB table for user budget and commute preferences
- Encrypted SNS topic for future SMS alerts
- Least-privilege IAM execution roles for the later ingestion and preferences Lambda functions

## Prerequisites

- Terraform `>= 1.6.0`
- AWS CLI credentials for your target account

## Usage

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt -recursive
terraform validate
terraform plan
terraform apply
```

Do not commit `terraform.tfvars` if you add real phone numbers. SNS SMS subscription endpoints are stored in Terraform state, so production usage should pair this with an encrypted remote backend and restricted state access.

## Design Notes

- Tables use `PAY_PER_REQUEST` billing for low-traffic serverless workloads.
- DynamoDB table attributes are limited to key attributes to avoid unnecessary provider drift.
- The Lambda roles do not include `logs:CreateLogGroup`; Phase 3 should create CloudWatch log groups with Terraform before Lambda invocation.
- The ingestion role can read/write only listing state, read only preferences, and publish only to the alerts topic.
- The preferences API role can mutate only the preferences table and cannot publish alerts or touch listing state.
