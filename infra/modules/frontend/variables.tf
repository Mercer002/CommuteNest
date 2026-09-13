variable "name_prefix" {
  description = "Normalized name prefix for frontend resources."
  type        = string
}

variable "tags" {
  description = "Tags applied to frontend resources."
  type        = map(string)
  default     = {}
}

