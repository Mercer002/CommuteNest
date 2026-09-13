resource "aws_dynamodb_table" "seen_listings" {
  name                        = "${var.name_prefix}-seen-listings"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "listing_id"
  deletion_protection_enabled = var.enable_deletion_protection
  table_class                 = var.table_class

  attribute {
    name = "listing_id"
    type = "S"
  }

  ttl {
    attribute_name = var.listings_ttl_attribute_name
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-seen-listings"
  })
}

resource "aws_dynamodb_table" "user_preferences" {
  name                        = "${var.name_prefix}-user-preferences"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "user_id"
  deletion_protection_enabled = var.enable_deletion_protection
  table_class                 = var.table_class

  attribute {
    name = "user_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-user-preferences"
  })
}
