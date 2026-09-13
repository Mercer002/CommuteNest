output "lambda_function_arn" {
  description = "ARN of the ingestion worker Lambda function."
  value       = aws_lambda_function.ingestion_worker.arn
}

output "lambda_function_name" {
  description = "Name of the ingestion worker Lambda function."
  value       = aws_lambda_function.ingestion_worker.function_name
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for the ingestion worker."
  value       = aws_cloudwatch_log_group.ingestion_worker.name
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge schedule rule."
  value       = aws_cloudwatch_event_rule.ingestion_schedule.arn
}

