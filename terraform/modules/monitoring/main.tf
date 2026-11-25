# Log group created before the function so retention is ours, plus alarms on failures.
# Alarm notifications are optional (alarm_email); without it the alarms still show in the console.

locals {
  notify = nonsensitive(var.alarm_email != "") # only "is it set" is used for count
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

# Not KMS-encrypted on purpose: CloudWatch alarms cannot publish to a topic encrypted with the
# AWS-managed aws/sns key, and a customer-managed key ($1/month) is overkill for alarm text.
#trivy:ignore:AVD-AWS-0095
resource "aws_sns_topic" "alarms" {
  count = local.notify ? 1 : 0
  name  = "${var.name_prefix}-gallery-alarms"
  tags  = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = local.notify ? 1 : 0
  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

locals {
  alarm_actions = local.notify ? [aws_sns_topic.alarms[0].arn] : []
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.name_prefix}-image-processor-errors"
  alarm_description   = "Image processor threw (after S3 retries the original stays in original/)."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = var.lambda_function_name }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  tags                = var.tags
}

# Uploads the processor rejected (not an image / too large) — logged as level "warn".
resource "aws_cloudwatch_log_metric_filter" "rejected" {
  name           = "${var.name_prefix}-rejected-uploads"
  log_group_name = aws_cloudwatch_log_group.lambda.name
  pattern        = "{ $.level = \"warn\" }"
  metric_transformation {
    name          = "RejectedUploads"
    namespace     = "WeddingGallery/${var.name_prefix}"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "rejected" {
  alarm_name          = "${var.name_prefix}-rejected-uploads"
  alarm_description   = "Several uploads were rejected in 15 minutes: check the processor logs."
  namespace           = "WeddingGallery/${var.name_prefix}"
  metric_name         = "RejectedUploads"
  statistic           = "Sum"
  period              = 900
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  tags                = var.tags
}
