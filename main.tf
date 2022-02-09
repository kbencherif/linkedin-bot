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
  source_dir  = "${path.module}/bot/login/"
  excludes    = ["${path.module}/bot/login.zip"]
  output_path = "${path.module}/bot/login/login.zip"
}

resource "aws_lambda_function" "get_cookies_lambda" {
  filename         = "${path.module}/bot/login/login.zip"
  role             = aws_iam_role.iam_for_lambda.arn
  function_name    = "get_cookies"
  runtime          = "nodejs14.x"
  handler          = "index.handler"
  source_code_hash = filebase64sha256(data.archive_file.zip_login.output_path)
  layers           = ["arn:aws:lambda:eu-west-1:764866452798:layer:chrome-aws-lambda:25"]
  timeout          = 30
  memory_size      = 600

  environment {
    variables = {
      BOT_EMAIL    = var.bot_email
      BOT_PASSWORD = var.bot_password
    }
  }
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_api_gateway_rest_api" "api" {
  name = "api"
}

resource "aws_api_gateway_resource" "auth_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_method" "login_method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.auth_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.auth_resource.id
  http_method             = aws_api_gateway_method.login_method.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "GET"
  uri                     = aws_lambda_function.get_cookies_lambda.invoke_arn
}
