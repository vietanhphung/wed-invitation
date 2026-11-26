# Lambda (Node 22, arm64, sharp) triggered by:
#   ObjectCreated  original/*        -> convert to gallery/<id>.webp, delete original
#   ObjectRemoved  gallery/*.webp    -> rebuild gallery/index.json after an admin delete
# The package is built by lambda/image-processor/build.sh (scripts/terraform.sh runs it).

data "archive_file" "package" {
  type        = "zip"
  source_dir  = var.package_dir
  output_path = "${path.root}/.build/${var.function_name}.zip"
}

resource "aws_lambda_function" "processor" {
  function_name    = var.function_name
  description      = "Wedding gallery: originals -> resized WebP"
  role             = var.role_arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"] # sharp is packaged for linux-arm64 (glibc)
  handler          = "index.handler"
  filename         = data.archive_file.package.output_path
  source_code_hash = data.archive_file.package.output_base64sha256
  memory_size      = var.memory_size
  timeout          = var.timeout

  logging_config {
    log_format = "Text" # the handler already logs one JSON object per line
    log_group  = var.log_group_name
  }

  environment {
    variables = {
      ORIGINAL_PREFIX  = var.original_prefix
      GALLERY_PREFIX   = var.gallery_prefix
      THUMB_PREFIX     = "${var.gallery_prefix}thumb/"
      THUMB_DIMENSION  = tostring(var.thumb_dimension)
      THUMB_QUALITY    = tostring(var.thumb_quality)
      MANIFEST_KEY     = "${var.gallery_prefix}index.json"
      MAX_DIMENSION    = tostring(var.max_image_dimension)
      WEBP_QUALITY     = tostring(var.webp_quality)
      MAX_UPLOAD_BYTES = tostring(var.max_upload_mb * 1024 * 1024)
      MANIFEST_MAX_AGE = "10"
    }
  }

  tags = var.tags
}

# S3 invokes asynchronously; failed attempts are retried twice, then dropped
# (the original stays in original/ and the error alarm fires).
resource "aws_lambda_function_event_invoke_config" "processor" {
  function_name                = aws_lambda_function.processor.function_name
  maximum_retry_attempts       = 2
  maximum_event_age_in_seconds = 3600
}

resource "aws_lambda_permission" "s3" {
  statement_id   = "AllowPhotoBucketInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.processor.function_name
  principal      = "s3.amazonaws.com"
  source_arn     = var.bucket_arn
  source_account = var.account_id
}

resource "aws_s3_bucket_notification" "photos" {
  bucket = var.bucket_name

  lambda_function {
    id                  = "process-originals"
    lambda_function_arn = aws_lambda_function.processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = var.original_prefix
  }

  lambda_function {
    id                  = "refresh-manifest-on-delete"
    lambda_function_arn = aws_lambda_function.processor.arn
    events              = ["s3:ObjectRemoved:*"]
    filter_prefix       = var.gallery_prefix
    filter_suffix       = ".webp"
  }

  depends_on = [aws_lambda_permission.s3]
}
