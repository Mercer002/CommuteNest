output "seen_listings_table_name" {
  description = "Name of the seen listings table."
  value       = aws_dynamodb_table.seen_listings.name
}

output "seen_listings_table_arn" {
  description = "ARN of the seen listings table."
  value       = aws_dynamodb_table.seen_listings.arn
}

output "user_preferences_table_name" {
  description = "Name of the user preferences table."
  value       = aws_dynamodb_table.user_preferences.name
}

output "user_preferences_table_arn" {
  description = "ARN of the user preferences table."
  value       = aws_dynamodb_table.user_preferences.arn
}

output "listings_ttl_attribute_name" {
  description = "TTL attribute name for seen listing records."
  value       = var.listings_ttl_attribute_name
}
