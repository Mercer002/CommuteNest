output "seen_listings_table_name" {
  description = "Name of the DynamoDB table that stores listing dedupe state."
  value       = module.database.seen_listings_table_name
}

output "seen_listings_table_arn" {
  description = "ARN of the DynamoDB table that stores listing dedupe state."
  value       = module.database.seen_listings_table_arn
}

output "user_preferences_table_name" {
  description = "Name of the DynamoDB table that stores user commute and budget preferences."
  value       = module.database.user_preferences_table_name
}

output "user_preferences_table_arn" {
  description = "ARN of the DynamoDB table that stores user commute and budget preferences."
  value       = module.database.user_preferences_table_arn
}

output "listings_ttl_attribute_name" {
  description = "Attribute name the ingestion worker should set for DynamoDB TTL."
  value       = module.database.listings_ttl_attribute_name
}

output "alerts_topic_arn" {
  description = "ARN of the SNS topic used for housing alerts."
  value       = module.notifications.alerts_topic_arn
}

output "ingestion_worker_role_arn" {
  description = "Least-privilege IAM role ARN for the future scheduled ingestion Lambda."
  value       = module.iam.ingestion_worker_role_arn
}

output "preferences_api_lambda_role_arn" {
  description = "Least-privilege IAM role ARN for the future preferences API Lambda."
  value       = module.iam.preferences_api_lambda_role_arn
}

output "ingestion_worker_log_group_name" {
  description = "Expected CloudWatch log group name for the future ingestion Lambda."
  value       = module.iam.ingestion_worker_log_group_name
}

output "preferences_api_lambda_log_group_name" {
  description = "Expected CloudWatch log group name for the future preferences API Lambda."
  value       = module.iam.preferences_api_lambda_log_group_name
}

output "ingestion_worker_lambda_arn" {
  description = "ARN of the deployed ingestion worker Lambda function."
  value       = module.compute.lambda_function_arn
}

output "ingestion_worker_lambda_name" {
  description = "Name of the deployed ingestion worker Lambda function."
  value       = module.compute.lambda_function_name
}

output "eventbridge_schedule_rule_arn" {
  description = "ARN of the EventBridge recurring trigger rule."
  value       = module.compute.eventbridge_rule_arn
}

output "api_endpoint_url" {
  description = "Public invocation URL for the HTTP API Gateway."
  value       = module.api.api_endpoint_url
}

output "api_id" {
  description = "ID of the HTTP API Gateway."
  value       = module.api.api_id
}

output "preferences_api_lambda_arn" {
  description = "ARN of the preferences API Lambda function."
  value       = module.api.lambda_function_arn
}

output "frontend_website_url" {
  description = "HTTPS public URL for the CommuteNest web frontend on CloudFront."
  value       = module.frontend.website_url
}

output "frontend_s3_bucket_name" {
  description = "Name of the S3 bucket hosting frontend assets."
  value       = module.frontend.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution."
  value       = module.frontend.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution."
  value       = module.frontend.cloudfront_domain_name
}



