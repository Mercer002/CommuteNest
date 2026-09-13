output "ingestion_worker_role_name" {
  description = "Name of the ingestion worker Lambda role."
  value       = aws_iam_role.ingestion_worker.name
}

output "ingestion_worker_role_arn" {
  description = "ARN of the ingestion worker Lambda role."
  value       = aws_iam_role.ingestion_worker.arn
}

output "preferences_api_lambda_role_name" {
  description = "Name of the preferences API Lambda role."
  value       = aws_iam_role.preferences_api_lambda.name
}

output "preferences_api_lambda_role_arn" {
  description = "ARN of the preferences API Lambda role."
  value       = aws_iam_role.preferences_api_lambda.arn
}

output "ingestion_worker_log_group_name" {
  description = "Expected log group name for the future ingestion worker Lambda."
  value       = var.ingestion_worker_log_group_name
}

output "preferences_api_lambda_log_group_name" {
  description = "Expected log group name for the future preferences API Lambda."
  value       = var.preferences_api_lambda_log_group_name
}
