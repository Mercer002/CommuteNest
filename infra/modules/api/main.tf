resource "aws_cloudwatch_log_group" "preferences_api" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_in_days

  tags = merge(var.tags, {
    Name = "/aws/lambda/${var.function_name}"
  })
}

resource "aws_lambda_function" "preferences_api" {
  function_name    = var.function_name
  role             = var.lambda_role_arn
  handler          = "lambda.handler"
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  memory_size      = var.memory_size
  timeout          = var.timeout_seconds
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      USER_PREFERENCES_TABLE_NAME = var.user_preferences_table_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.preferences_api
  ]

  tags = merge(var.tags, {
    Name = var.function_name
  })
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.name_prefix}-http-api"
  protocol_type = "HTTP"
  description   = "HTTP API Gateway for CommuteNest services"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-http-api"
  })
}

resource "aws_apigatewayv2_integration" "preferences_lambda" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.preferences_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.preferences_lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-http-api-stage"
  })
}

resource "aws_lambda_permission" "allow_apigateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.preferences_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

