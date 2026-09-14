locals {
  normalized_project_name = lower(replace(var.project_name, "/[^a-zA-Z0-9-]/", "-"))
  normalized_environment  = lower(replace(var.environment, "/[^a-zA-Z0-9-]/", "-"))
  name_prefix             = substr("${local.normalized_project_name}-${local.normalized_environment}", 0, 38)

  ingestion_worker_function_name = "${local.name_prefix}-ingestion-worker"
  preferences_api_function_name  = "${local.name_prefix}-preferences-api"

  common_tags = merge(
    {
      Application = "CommuteNest"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = var.project_name
    },
    var.tags,
  )
}

module "database" {
  source = "./modules/database"

  name_prefix                   = local.name_prefix
  table_class                   = var.dynamodb_table_class
  listings_ttl_attribute_name   = var.listings_ttl_attribute_name
  enable_deletion_protection    = var.enable_dynamodb_deletion_protection
  enable_point_in_time_recovery = var.enable_dynamodb_point_in_time_recovery
  tags                          = local.common_tags
}

module "notifications" {
  source = "./modules/notifications"

  name_prefix                = local.name_prefix
  project_name               = var.project_name
  kms_master_key_id          = var.sns_kms_master_key_id
  sms_subscriber_numbers     = var.sms_subscriber_numbers
  email_subscriber_addresses = var.alert_emails
  tags                       = local.common_tags
}

module "iam" {
  source = "./modules/iam"

  name_prefix                           = local.name_prefix
  aws_account_id                        = data.aws_caller_identity.current.account_id
  aws_partition                         = data.aws_partition.current.partition
  aws_region                            = data.aws_region.current.region
  seen_listings_table_arn               = module.database.seen_listings_table_arn
  user_preferences_table_arn            = module.database.user_preferences_table_arn
  alerts_topic_arn                      = module.notifications.alerts_topic_arn
  ingestion_worker_log_group_name       = "/aws/lambda/${local.ingestion_worker_function_name}"
  preferences_api_lambda_log_group_name = "/aws/lambda/${local.preferences_api_function_name}"
  tags                                  = local.common_tags
}

module "compute" {
  source = "./modules/compute"

  function_name         = local.ingestion_worker_function_name
  lambda_role_arn       = module.iam.ingestion_worker_role_arn
  lambda_zip_path       = "${path.module}/../services/ingestion-worker/dist/lambda.zip"
  log_retention_in_days = 7
  schedule_expression   = var.schedule_expression
  enable_schedule       = var.enable_ingestion_schedule

  environment_variables = {
    STATE_STORE_TYPE            = "dynamodb"
    SEEN_LISTINGS_TABLE_NAME    = module.database.seen_listings_table_name
    ALERT_SINK_TYPE             = "sns"
    ALERTS_TOPIC_ARN            = module.notifications.alerts_topic_arn
    DISTANCE_PROVIDER           = var.distance_provider
    LISTING_SOURCE_URL          = var.listing_source_url
    TARGET_DESTINATION          = var.target_destination
    MAX_RENT_USD                = var.max_rent_usd
    MAX_COMMUTE_MINUTES         = var.max_commute_minutes
    TRANSIT_MODE                = var.transit_mode
    DRY_RUN_ALERTS              = "false"
    STATE_STORE_TYPE            = "dynamodb"
    SEEN_LISTINGS_TABLE_NAME    = module.database.seen_listings_table_name
    ALERT_SINK_TYPE             = "sns"
    ALERTS_TOPIC_ARN            = module.notifications.alerts_topic_arn
    DISTANCE_PROVIDER           = var.distance_provider
    LISTING_SOURCE_URL          = var.listing_source_url
    TARGET_DESTINATION          = var.target_destination
    MAX_RENT_USD                = var.max_rent_usd
    MAX_COMMUTE_MINUTES         = var.max_commute_minutes
    TRANSIT_MODE                = var.transit_mode
    DRY_RUN_ALERTS              = "false"
    STATE_STORE_TYPE            = "dynamodb"
    SEEN_LISTINGS_TABLE_NAME    = module.database.seen_listings_table_name
    USER_PREFERENCES_TABLE_NAME = module.database.user_preferences_table_name
    ACTIVE_USER_ID              = var.active_user_id
    ALERT_SINK_TYPE             = "sns"
    ALERTS_TOPIC_ARN            = module.notifications.alerts_topic_arn
    DISTANCE_PROVIDER           = var.distance_provider
    LISTING_SOURCE_URL          = var.listing_source_url
    TARGET_DESTINATION          = var.target_destination
    MAX_RENT_USD                = var.max_rent_usd
    MAX_COMMUTE_MINUTES         = var.max_commute_minutes
    TRANSIT_MODE                = var.transit_mode
    DRY_RUN_ALERTS              = "false"
  }

  tags = local.common_tags
}

module "api" {
  source = "./modules/api"

  name_prefix                 = local.name_prefix
  function_name               = local.preferences_api_function_name
  lambda_role_arn             = module.iam.preferences_api_lambda_role_arn
  lambda_zip_path             = "${path.module}/../services/preferences-api/dist/lambda.zip"
  user_preferences_table_name = module.database.user_preferences_table_name
  alerts_topic_arn            = module.notifications.alerts_topic_arn
  log_retention_in_days       = 7
  tags                        = local.common_tags
}

module "frontend" {
  source = "./modules/frontend"

  name_prefix = local.name_prefix
  tags        = local.common_tags
}

# Cost Guardrail: Alert if forecasted to exceed $1.00 or if actual spend crosses $0.80
resource "aws_budgets_budget" "cost_guardrail" {
  count = var.budget_alert_email != "" ? 1 : 0

  name         = "${local.name_prefix}-monthly-cost-guardrail"
  budget_type  = "COST"
  limit_amount = "1.0"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}
