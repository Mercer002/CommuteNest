locals {
  ingestion_worker_log_group_arn       = "arn:${var.aws_partition}:logs:${var.aws_region}:${var.aws_account_id}:log-group:${var.ingestion_worker_log_group_name}"
  preferences_api_lambda_log_group_arn = "arn:${var.aws_partition}:logs:${var.aws_region}:${var.aws_account_id}:log-group:${var.preferences_api_lambda_log_group_name}"
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    sid     = "AllowLambdaServiceAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ingestion_worker" {
  statement {
    sid    = "ReadWriteSeenListings"
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem"
    ]

    resources = [var.seen_listings_table_arn]
  }

  statement {
    sid       = "ReadUserPreferences"
    effect    = "Allow"
    actions   = ["dynamodb:GetItem"]
    resources = [var.user_preferences_table_arn]
  }

  statement {
    sid       = "PublishHousingAlerts"
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = [var.alerts_topic_arn]
  }

  statement {
    sid    = "WriteIngestionWorkerLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["${local.ingestion_worker_log_group_arn}:*"]
  }
}

data "aws_iam_policy_document" "preferences_api_lambda" {
  statement {
    sid    = "ManageUserPreferences"
    effect = "Allow"

    actions = [
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem"
    ]

    resources = [var.user_preferences_table_arn]
  }

  statement {
    sid    = "WritePreferencesApiLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["${local.preferences_api_lambda_log_group_arn}:*"]
  }
}

resource "aws_iam_role" "ingestion_worker" {
  name                 = "${var.name_prefix}-ingestion-worker-role"
  description          = "Execution role for the CommuteNest scheduled ingestion Lambda."
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  max_session_duration = 3600

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ingestion-worker-role"
  })
}

resource "aws_iam_role_policy" "ingestion_worker" {
  name   = "${var.name_prefix}-ingestion-worker-policy"
  role   = aws_iam_role.ingestion_worker.id
  policy = data.aws_iam_policy_document.ingestion_worker.json
}

resource "aws_iam_role" "preferences_api_lambda" {
  name                 = "${var.name_prefix}-preferences-api-role"
  description          = "Execution role for the CommuteNest user preferences API Lambda."
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  max_session_duration = 3600

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-preferences-api-role"
  })
}

resource "aws_iam_role_policy" "preferences_api_lambda" {
  name   = "${var.name_prefix}-preferences-api-policy"
  role   = aws_iam_role.preferences_api_lambda.id
  policy = data.aws_iam_policy_document.preferences_api_lambda.json
}
