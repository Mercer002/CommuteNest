variable "name_prefix" {
  description = "Normalized name prefix for notification resources."
  type        = string
}

variable "project_name" {
  description = "Human-readable project name."
  type        = string
}

variable "kms_master_key_id" {
  description = "KMS key ID or alias used to encrypt the SNS topic."
  type        = string
}

variable "sms_subscriber_numbers" {
  description = "Optional E.164 phone numbers subscribed to the SNS topic."
  type        = set(string)
}

variable "email_subscriber_addresses" {
  description = "Optional email addresses subscribed to the SNS topic (Free Tier eligible)."
  type        = set(string)
  default     = []
}

variable "tags" {
  description = "Tags applied to notification resources."
  type        = map(string)
}
