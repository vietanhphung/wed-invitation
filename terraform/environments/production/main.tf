# Wedding photo gallery — production.
#
# Adds ONLY new, gallery-specific AWS resources. The website (GitHub Pages), the domain and
# its DNS (Namecheap) are not managed or touched here; no Route 53.

data "aws_caller_identity" "current" {}

locals {
  name_prefix  = "${var.project_name}-${var.environment}"
  account_id   = data.aws_caller_identity.current.account_id
  site_origin  = "https://${var.domain_name}"
  origins      = distinct(concat([local.site_origin], var.extra_allowed_origins))
  gallery_url  = "${local.site_origin}${var.gallery_path}"
  local_pages  = [for o in var.extra_allowed_origins : "${o}${var.gallery_path}" if startswith(o, "http://localhost")]
  function     = "${local.name_prefix}-image-processor"
  bucket_name  = "${local.name_prefix}-gallery-photos-${local.account_id}"
  cognito_slug = var.cognito_domain_prefix != "" ? var.cognito_domain_prefix : "${local.name_prefix}-gallery-${local.account_id}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Component   = "photo-gallery"
    ManagedBy   = "terraform"
  }
}

module "monitoring" {
  source               = "../../modules/monitoring"
  name_prefix          = local.name_prefix
  lambda_function_name = local.function
  log_retention_days   = var.log_retention_days
  alarm_email          = var.alarm_email
}

module "photo_storage" {
  source                       = "../../modules/photo-storage"
  bucket_name                  = local.bucket_name
  original_prefix              = var.original_prefix
  gallery_prefix               = var.photo_prefix
  allowed_origins              = local.origins
  original_retention_days      = var.original_retention_days
  deleted_photo_retention_days = var.deleted_photo_retention_days
  cloudfront_distribution_arn  = module.cloudfront.distribution_arn
}

module "cloudfront" {
  source                      = "../../modules/cloudfront"
  name_prefix                 = local.name_prefix
  bucket_regional_domain_name = module.photo_storage.bucket_regional_domain_name
  allowed_origins             = local.origins
  price_class                 = var.cloudfront_price_class
}

module "cognito" {
  source                  = "../../modules/cognito"
  name_prefix             = local.name_prefix
  hosted_ui_domain_prefix = local.cognito_slug
  callback_urls           = concat([local.gallery_url], local.local_pages)
  guest_role_arn          = module.iam.guest_role_arn
  admin_role_arn          = module.iam.admin_role_arn
  admin_emails            = var.admin_emails
}

module "iam" {
  source               = "../../modules/iam"
  name_prefix          = local.name_prefix
  bucket_arn           = module.photo_storage.bucket_arn
  original_prefix      = var.original_prefix
  gallery_prefix       = var.photo_prefix
  identity_pool_id     = module.cognito.identity_pool_id
  lambda_log_group_arn = module.monitoring.lambda_log_group_arn
}

module "image_processor" {
  source              = "../../modules/image-processor"
  function_name       = local.function
  package_dir         = "${path.root}/../../../lambda/image-processor/build"
  role_arn            = module.iam.lambda_role_arn
  log_group_name      = module.monitoring.lambda_log_group_name
  bucket_name         = module.photo_storage.bucket_name
  bucket_arn          = module.photo_storage.bucket_arn
  account_id          = local.account_id
  original_prefix     = var.original_prefix
  gallery_prefix      = var.photo_prefix
  memory_size         = var.lambda_memory
  timeout             = var.lambda_timeout
  max_image_dimension = var.max_image_dimension
  webp_quality        = var.webp_quality
  thumb_dimension     = var.thumb_dimension
  thumb_quality       = var.thumb_quality
  max_upload_mb       = var.max_upload_mb
}
