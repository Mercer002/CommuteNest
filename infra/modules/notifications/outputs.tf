output "alerts_topic_arn" {
  description = "ARN of the housing alerts SNS topic."
  value       = aws_sns_topic.alerts.arn
}

output "alerts_topic_name" {
  description = "Name of the housing alerts SNS topic."
  value       = aws_sns_topic.alerts.name
}
