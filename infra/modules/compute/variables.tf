variable "function_name" {
  description = "Name of the ingestion Lambda function."
  type        = string
}

variable "lambda_role_arn" {
  description = "ARN of the IAM role for the ingestion Lambda."
  type        = string
}

variable "lambda_zip_path" {
  description = "Local path to the packaged Lambda zip file."
  type        = string
}

variable "log_retention_in_days" {
  description = "Number of days to retain Lambda CloudWatch logs (keeps storage in Free Tier)."
  type        = number
  default     = 7
}

variable "memory_size" {
  description = "Amount of memory in MB allocated to the Lambda function."
  type        = number
  default     = 256
}

variable "timeout_seconds" {
  description = "Timeout in seconds for the Lambda function."
  type        = number
  default     = 60
}

variable "schedule_expression" {
  description = "Rate or cron expression for the EventBridge trigger."
  type        = string
  default     = "rate(30 minutes)"
}

variable "enable_schedule" {
  description = "Whether the EventBridge schedule rule is enabled."
  type        = bool
  default     = true
}

variable "environment_variables" {
  description = "Environment variables passed to the Lambda function."
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags applied to compute resources."
  type        = map(string)
  default     = {}
}

