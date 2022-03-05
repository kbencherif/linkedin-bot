variable "bot_email" {
  description = "bot email"
  type        = string
}

variable "bot_password" {
  description = "bot password"
  type        = string
  sensitive   = true
}

variable "cookies_table" {
  description = "Cookie's table name"
  type        = string
  default     = "cookies_table"
}

variable "aws_region" {
  description = "Resources region"
  type        = string
  default     = "eu-west-1"
}
