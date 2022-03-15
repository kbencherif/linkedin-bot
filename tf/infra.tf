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

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "orchestrator" {
  filename         = "${path.module}/../lambdas/orchestrator/orchestrator.zip"
  role             = aws_iam_role.iam_for_lambda.arn
  function_name    = "orchestrator"
  runtime          = "nodejs14.x"
  handler          = "index.handler"
  source_code_hash = filebase64sha256(data.archive_file.zip_orchestrator.output_path)
  timeout          = 30
  memory_size      = 600

  environment {
    variables = {
      BOT_EMAIL     = var.bot_email
      BOT_PASSWORD  = var.bot_password
      QUEUE_URL     = aws_sqs_queue.q.id
      SNS_TOPIC     = aws_sns_topic.cookies_topic.arn
      COOKIES_TABLE = var.cookies_table
      REGION        = var.aws_region
    }
  }
}

resource "aws_lambda_function" "get_cookies" {
  filename         = "${path.module}/../lambdas/get_cookies/get_cookies.zip"
  role             = aws_iam_role.iam_for_lambda.arn
  function_name    = "get_cookies"
  runtime          = "nodejs14.x"
  handler          = "index.handler"
  source_code_hash = filebase64sha256(data.archive_file.zip_get_cookies.output_path)
  layers           = ["arn:aws:lambda:eu-west-1:764866452798:layer:chrome-aws-lambda:25"]
  timeout          = 80
  memory_size      = 900

  environment {
    variables = {
      QUEUE_URL     = aws_sqs_queue.q.id
      COOKIES_TABLE = var.cookies_table
      REGION        = var.aws_region
    }
  }
}

resource "aws_lambda_function" "run_bot" {
  filename         = "${path.module}/../lambdas/run_bot/run_bot.zip"
  role             = aws_iam_role.iam_for_lambda.arn
  function_name    = "run_bot"
  runtime          = "nodejs14.x"
  handler          = "index.handler"
  source_code_hash = filebase64sha256(data.archive_file.zip_run_bot.output_path)
  layers           = ["arn:aws:lambda:eu-west-1:764866452798:layer:chrome-aws-lambda:25"]
  timeout          = 60
  memory_size      = 600

  environment {
    variables = {
      COOKIES_TABLE   = var.cookies_table
      REGION          = var.aws_region
      BUCKET_NAME     = var.s3_bucket_name
      RESEARCH_STRING = var.research_string
    }
  }
}

data "archive_file" "zip_orchestrator" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/orchestrator/"
  excludes    = ["${path.module}/../lambdas/orchestrator/orchestrator.zip"]
  output_path = "${path.module}/../lambdas/orchestrator/orchestrator.zip"
}

data "archive_file" "zip_get_cookies" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/get_cookies/"
  excludes    = ["${path.module}/../lambdas/get_cookies/get_cookies.zip"]
  output_path = "${path.module}/../lambdas/get_cookies/get_cookies.zip"
}

data "archive_file" "zip_run_bot" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/run_bot/"
  excludes    = ["${path.module}/../lambdas/run_bot/run_bot.zip"]
  output_path = "${path.module}/../lambdas/run_bot/run_bot.zip"
}

resource "aws_lambda_permission" "sqs_lambda_permission" {
  statement_id  = "AllowExecutionFromSQS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.run_bot.arn
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.q.arn
}

resource "aws_lambda_permission" "sns_lambda_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_cookies.arn
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.cookies_topic.arn
}

resource "aws_cloudwatch_event_rule" "bot_start_rule" {
  name                = "start_bot"
  schedule_expression = "cron(0 9 ? * 1-5 *)"
  #schedule_expression = "cron(0/2 * * * ? *)"
}

resource "aws_lambda_permission" "event_bridge_lambda" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orchestrator.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.bot_start_rule.arn
}

resource "aws_cloudwatch_event_target" "apigw_target" {
  rule = aws_cloudwatch_event_rule.bot_start_rule.id
  arn  = aws_lambda_function.orchestrator.arn
}

resource "aws_sqs_queue" "q" {
  name                       = "q"
  message_retention_seconds  = 86400
  delay_seconds              = 90
  receive_wait_time_seconds  = 0
  visibility_timeout_seconds = 90
}

resource "aws_iam_role_policy" "lambda_policy_sqs" {
  name = "lambda_sqs_access"
  role = aws_iam_role.iam_for_lambda.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Effect": "Allow",
          "Action": [
              "sqs:ReceiveMessage",
              "sqs:SendMessage",
              "sqs:DeleteMessage",
              "sqs:GetQueueAttributes"
          ],
          "Resource": "*"
      }
  ]
}
EOF
}

resource "aws_lambda_event_source_mapping" "event_source_mapping" {
  function_name    = aws_lambda_function.run_bot.arn
  batch_size       = 1
  enabled          = true
  event_source_arn = aws_sqs_queue.q.arn
}

resource "aws_sns_topic" "run_bot_topic" {
  name = "run_bot_topic"
}

resource "aws_sns_topic" "cookies_topic" {
  name = "cookies_topic"
}

resource "aws_sns_topic_subscription" "get_cookies_subscription" {
  topic_arn = aws_sns_topic.cookies_topic.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.get_cookies.arn
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
      "SNS:AddPermission"
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

resource "aws_dynamodb_table" "cookies_table" {
  name           = var.cookies_table
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "email"

  attribute {
    name = "email"
    type = "S"
  }
}

resource "aws_iam_role_policy" "lambda_policy_dynamodb" {
  name = "lambda_dynamo_access"
  role = aws_iam_role.iam_for_lambda.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Effect": "Allow",
          "Action": [
              "dynamodb:PutItem",
              "dynamodb:GetItem",
              "dynamodb:BatchWriteItem",
              "dynamodb:Scan",
              "dynamodb:ListTables"
          ],
          "Resource": "*"
      }
  ]
}
EOF
}

resource "aws_s3_bucket" "bucket" {
  bucket        = var.s3_bucket_name
  acl           = "private"
  force_destroy = true
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy" "lambda_policy_s3" {
  name = "lambda_s3_access"
  role = aws_iam_role.iam_for_lambda.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ExampleStmt",
      "Action": [
        "s3:PutObject"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}
