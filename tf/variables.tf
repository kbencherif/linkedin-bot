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

variable "s3_bucket_name" {
  description = "Profiles screenshot stockage"
  type        = string
  default     = "linkedinbotscreenshotprofile"
}

variable "research_string" {
  description = "String to type in the research bar, it can be a person, a position (DevOps Lyon for exemple)"
  type        = string
}
