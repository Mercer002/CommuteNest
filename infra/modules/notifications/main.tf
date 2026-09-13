resource "aws_sns_topic" "alerts" {
  name              = "${var.name_prefix}-housing-alerts"
  display_name      = substr("${var.project_name} housing alerts", 0, 100)
  kms_master_key_id = var.kms_master_key_id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-housing-alerts"
  })
}

resource "aws_sns_topic_subscription" "sms" {
  for_each = var.sms_subscriber_numbers

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "sms"
  endpoint  = each.value
}

resource "aws_sns_topic_subscription" "email" {
  for_each = var.email_subscriber_addresses

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

