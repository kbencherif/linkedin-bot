terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region                  = "eu-west-1"
  shared_credentials_file = "~/.aws/credentials"
}

resource "aws_iam_role" "iam_for_lambda" {
  name               = "lambda_role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

data "archive_file" "zip_login" {
  type        = "zip"
  source_file = "${path.module}/bot/login/login.js"
  output_path = "${path.module}/bot/login/login.zip"
}

resource "aws_lambda_function" "run_bot_lambda" {
  filename      = "${path.module}/bot/login/login.zip"
  role          = aws_iam_role.iam_for_lambda.arn
  function_name = "run_bot"
  runtime       = "nodejs14.x"
  handler       = "run_bot.handler"

  #source_code_hash = filebase64sha256("login.zip")

  environment {
    variables = {
      BOT_EMAIL    = var.bot_email
      BOT_PASSWORD = var.bot_password
    }
  }
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "turboflex"
  acl    = "private"

  tags = {
    Name        = "turboflexplus"
    Environment = "Dev"
  }
}

resource "aws_s3_bucket_object" "lambda_bucket_login" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "login.zip"
  source = data.archive_file.zip_login.output_path
  etag   = filemd5(data.archive_file.zip_login.output_path)
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
