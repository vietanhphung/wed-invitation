# All values below are identifiers the browser needs anyway; none are secrets.

output "aws_region" {
  value = var.aws_region
}

output "photo_bucket_name" {
  value = module.photo_storage.bucket_name
}

output "photo_bucket_arn" {
  value = module.photo_storage.bucket_arn
}

output "cloudfront_distribution_id" {
  value = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  value = module.cloudfront.domain_name
}

output "lambda_function_name" {
  value = module.image_processor.function_name
}

output "lambda_log_group" {
  value = module.monitoring.lambda_log_group_name
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  value = module.cognito.user_pool_client_id
}

output "cognito_identity_pool_id" {
  value = module.cognito.identity_pool_id
}

output "cognito_hosted_ui_domain" {
  value = module.cognito.hosted_ui_domain
}

output "gallery_url" {
  value = local.gallery_url
}

output "original_prefix" {
  value = var.original_prefix
}

output "photo_prefix" {
  value = var.photo_prefix
}

output "max_upload_mb" {
  value = var.max_upload_mb
}
