variable "aws_region" {
  description = "AWS region where CommuteNest resources will be created."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short project name used in resource names and tags."
  type        = string
  default     = "commutenest"

  validation {
    condition     = can(regex("^[A-Za-z][A-Za-z0-9-]{1,30}$", var.project_name))
    error_message = "project_name must start with a letter and contain only letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Deployment environment name, such as dev, staging, or prod."
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^[A-Za-z][A-Za-z0-9-]{1,20}$", var.environment))
    error_message = "environment must start with a letter and contain only letters, numbers, and hyphens."
  }
}

variable "tags" {
  description = "Additional tags applied to all supported resources."
  type        = map(string)
  default     = {}
}

variable "dynamodb_table_class" {
  description = "DynamoDB table class for the listings and preferences tables."
  type        = string
  default     = "STANDARD"

  validation {
    condition     = contains(["STANDARD", "STANDARD_INFREQUENT_ACCESS"], var.dynamodb_table_class)
    error_message = "dynamodb_table_class must be STANDARD or STANDARD_INFREQUENT_ACCESS."
  }
}

variable "listings_ttl_attribute_name" {
  description = "DynamoDB attribute that Lambda will set to expire old seen-listing records."
  type        = string
  default     = "expires_at"
}

variable "enable_dynamodb_deletion_protection" {
  description = "Whether DynamoDB deletion protection should be enabled."
  type        = bool
  default     = false
}

variable "enable_dynamodb_point_in_time_recovery" {
  description = "Whether DynamoDB point-in-time recovery should be enabled."
  type        = bool
  default     = false
}

variable "budget_alert_email" {
  description = "Email address for AWS Budgets cost alerts. If provided, creates a $1.00 monthly cost budget with email notifications."
  type        = string
  default     = ""
}

variable "sns_kms_master_key_id" {
  description = "KMS key ID or alias used by the SNS alerts topic."
  type        = string
  default     = "alias/aws/sns"
}

variable "sms_subscriber_numbers" {
  description = "Optional E.164 phone numbers subscribed to the SNS topic. Values are stored in Terraform state."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for number in var.sms_subscriber_numbers : can(regex("^\\+[1-9][0-9]{7,14}$", number))
    ])
    error_message = "Each sms_subscriber_numbers value must be an E.164 phone number, for example +14155552671."
  }
}

variable "alert_emails" {
  description = "Optional email addresses subscribed to the SNS housing alerts topic (Free Tier eligible)."
  type        = set(string)
  default     = []
}

variable "schedule_expression" {
  description = "Rate or cron expression for the ingestion EventBridge trigger (e.g. rate(30 minutes))."
  type        = string
  default     = "rate(30 minutes)"
}

variable "enable_ingestion_schedule" {
  description = "Whether the EventBridge schedule rule is actively invoking the Lambda."
  type        = bool
  default     = true
}

variable "distance_provider" {
  description = "Commute calculation provider: 'mock' (free) or 'google'."
  type        = string
  default     = "mock"
}

variable "listing_source_url" {
  description = "URL for the housing RSS feed."
  type        = string
  default     = "https://toronto.craigslist.org/search/apa?format=rss"
}

variable "target_destination" {
  description = "Commute target destination address."
  type        = string
  default     = "Union Station, Toronto, ON"
}

variable "max_rent_usd" {
  description = "Maximum monthly rent budget in USD."
  type        = string
  default     = "1800"
}

variable "max_commute_minutes" {
  description = "Maximum acceptable commute time in minutes."
  type        = string
  default     = "35"
}

variable "transit_mode" {
  description = "Transit mode for commute calculation: transit, driving, walking, bicycling."
  type        = string
  default     = "transit"
}

variable "active_user_id" {
  description = "Active user ID whose preferences will be fetched from DynamoDB by the ingestion worker."
  type        = string
  default     = "mercer"
}


