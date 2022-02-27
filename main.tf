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

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

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

data "archive_file" "zip_orchestrator" {
  type        = "zip"
  source_dir  = "${path.module}/lambdas/orchestrator/"
  excludes    = ["${path.module}/lambdas/orchestrator/orchestrator.zip"]
  output_path = "${path.module}/lambdas/orchestrator/orchestrator.zip"
}

data "archive_file" "zip_get_cookies" {
  type        = "zip"
  source_dir  = "${path.module}/lambdas/get_cookies/"
  excludes    = ["${path.module}/lambdas/get_cookies/get_cookies.zip"]
  output_path = "${path.module}/lambdas/get_cookies/get_cookies.zip"
}

resource "aws_lambda_function" "orchestrator" {
  filename         = "${path.module}/lambdas/orchestrator/orchestrator.zip"
  role             = aws_iam_role.iam_for_lambda.arn
  function_name    = "orchestrator"
  runtime          = "nodejs14.x"
  handler          = "index.handler"
  source_code_hash = filebase64sha256(data.archive_file.zip_orchestrator.output_path)
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

resource "aws_lambda_function" "get_cookies" {
  filename         = "${path.module}/lambdas/get_cookies/get_cookies.zip"
  role             = aws_iam_role.iam_for_lambda.arn
  function_name    = "get_cookies"
  runtime          = "nodejs14.x"
  handler          = "index.handler"
  source_code_hash = filebase64sha256(data.archive_file.zip_get_cookies.output_path)
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
  name = "linkedin_bot_api"
}

resource "aws_api_gateway_resource" "api_resource" {
  path_part   = "resource"
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  rest_api_id = aws_api_gateway_rest_api.api.id
}

resource "aws_api_gateway_method" "lambda_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.api_resource.id
  http_method = aws_api_gateway_method.lambda_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_cookies.invoke_arn
}

resource "aws_lambda_permission" "event_bridge_lambda" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_cookies.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.bot_start_rule.arn
}

resource "aws_api_gateway_deployment" "bot_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  depends_on = [
    aws_api_gateway_integration.integration
  ]

  triggers = {
    redeployement = sha1(jsonencode(aws_api_gateway_integration.integration))
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_cookies.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_cloudwatch_event_rule" "bot_start_rule" {
  name = "start_bot"
  #schedule_expression = "cron(0 9 ? * 1-5 *)"
  schedule_expression = "cron(0/2 * * * ? *)"
}

resource "aws_cloudwatch_event_target" "apigw_target" {
  rule = aws_cloudwatch_event_rule.bot_start_rule.id
  arn  = aws_lambda_function.get_cookies.arn
}

resource "aws_sns_topic" "cookies_topic" {
  name = "cookies_topic"
}

resource "aws_sns_topic_policy" "topic_policy" {
  arn    = aws_sns_topic.cookies_topic.arn
  policy = data.aws_iam_policy_document.sns_topic_policy_document.json
}

data "aws_iam_policy_document" "sns_topic_policy_document" {
  statement {
    actions = [
      "SNS:Subscribe",
      "SNS:SetTopicAttributes",
      "SNS:RemovePermission",
      "SNS:Receive",
      "SNS:Publish",
      "SNS:ListSubscriptionsByTopic",
      "SNS:GetTopicAttributes",
      "SNS:DeleteTopic",
      "SNS:AddPermission",
    ]
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    resources = [
      aws_sns_topic.cookies_topic.arn,
    ]
    sid = ""
  }
}

