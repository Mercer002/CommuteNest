resource "aws_cloudwatch_log_group" "ingestion_worker" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_in_days

  tags = merge(var.tags, {
    Name = "/aws/lambda/${var.function_name}"
  })
}

resource "aws_lambda_function" "ingestion_worker" {
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
    variables = var.environment_variables
  }

  depends_on = [
    aws_cloudwatch_log_group.ingestion_worker
  ]

  tags = merge(var.tags, {
    Name = var.function_name
  })
}

resource "aws_cloudwatch_event_rule" "ingestion_schedule" {
  name                = "${var.function_name}-schedule"
  description         = "Trigger CommuteNest ingestion worker on a recurring schedule."
  schedule_expression = var.schedule_expression
  state               = var.enable_schedule ? "ENABLED" : "DISABLED"

  tags = merge(var.tags, {
    Name = "${var.function_name}-schedule"
  })
}

resource "aws_cloudwatch_event_target" "ingestion_lambda" {
  rule      = aws_cloudwatch_event_rule.ingestion_schedule.name
  target_id = "CommuteNestIngestionWorker"
  arn       = aws_lambda_function.ingestion_worker.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingestion_worker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ingestion_schedule.arn
}

