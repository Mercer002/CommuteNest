output "api_endpoint_url" {
  description = "Base invocation URL for the HTTP API Gateway."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "api_id" {
  description = "ID of the HTTP API Gateway."
  value       = aws_apigatewayv2_api.http_api.id
}

output "lambda_function_arn" {
  description = "ARN of the preferences API Lambda function."
  value       = aws_lambda_function.preferences_api.arn
}

output "lambda_function_name" {
  description = "Name of the preferences API Lambda function."
  value       = aws_lambda_function.preferences_api.function_name
}

