variable "name_prefix" {
  description = "Normalized name prefix for API resources."
  type        = string
}

variable "function_name" {
  description = "Name of the preferences API Lambda function."
  type        = string
}

variable "lambda_role_arn" {
  description = "ARN of the IAM role for the preferences API Lambda."
  type        = string
}

variable "lambda_zip_path" {
  description = "Local path to the packaged preferences API Lambda zip file."
  type        = string
}

variable "user_preferences_table_name" {
  description = "Name of the DynamoDB user preferences table."
  type        = string
}

variable "log_retention_in_days" {
  description = "Number of days to retain CloudWatch logs (keeps storage in Free Tier)."
  type        = number
  default     = 7
}

variable "memory_size" {
  description = "Memory in MB for the Lambda function."
  type        = number
  default     = 256
}

variable "timeout_seconds" {
  description = "Timeout in seconds for the Lambda function."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags applied to API resources."
  type        = map(string)
  default     = {}
}

