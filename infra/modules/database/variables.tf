variable "name_prefix" {
  description = "Normalized name prefix for all database resources."
  type        = string
}

variable "table_class" {
  description = "DynamoDB table class."
  type        = string
}

variable "listings_ttl_attribute_name" {
  description = "TTL attribute name for seen listing records."
  type        = string
}

variable "enable_deletion_protection" {
  description = "Whether DynamoDB deletion protection is enabled."
  type        = bool
}

variable "enable_point_in_time_recovery" {
  description = "Whether DynamoDB point-in-time recovery is enabled."
  type        = bool
}

variable "tags" {
  description = "Tags applied to database resources."
  type        = map(string)
}
