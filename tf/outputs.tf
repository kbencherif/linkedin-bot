output "aws_region" {
  value = var.aws_region
}

output "linkedin_email" {
  value = var.bot_email
}

output "linkedin_password" {
  value     = var.bot_password
  sensitive = true
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.cookies_table.name
}

output "s3_bucket" {
  value = var.s3_bucket_name
}
