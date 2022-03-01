variable "bot_email" {
  description = "bot email"
  type        = string
  sensitive   = true
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
