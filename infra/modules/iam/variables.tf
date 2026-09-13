variable "name_prefix" {
  description = "Normalized name prefix for IAM resources."
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID used to scope log group ARNs."
  type        = string
}

variable "aws_partition" {
  description = "AWS partition, such as aws, aws-us-gov, or aws-cn."
  type        = string
}

variable "aws_region" {
  description = "AWS region used to scope log group ARNs."
  type        = string
}

variable "seen_listings_table_arn" {
  description = "ARN of the DynamoDB table used for listing deduplication."
  type        = string
}

variable "user_preferences_table_arn" {
  description = "ARN of the DynamoDB table used for user preferences."
  type        = string
}

variable "alerts_topic_arn" {
  description = "ARN of the SNS topic used for housing alerts."
  type        = string
}

variable "ingestion_worker_log_group_name" {
  description = "Expected log group name for the future ingestion worker Lambda."
  type        = string
}

variable "preferences_api_lambda_log_group_name" {
  description = "Expected log group name for the future preferences API Lambda."
  type        = string
}

variable "tags" {
  description = "Tags applied to IAM resources."
  type        = map(string)
}
