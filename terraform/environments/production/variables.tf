variable "aws_region" {
  description = "Region for the bucket, Lambda and Cognito (CloudFront is global). The account's AWS free-plan guardrail (SCP) only allows us-east-2."
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "project_name" {
  description = "Short name used in resource names."
  type        = string
  default     = "wedding"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.project_name))
    error_message = "Lowercase letters, digits and dashes, max 21 chars."
  }
}

variable "domain_name" {
  description = "Existing website domain (DNS is NOT managed here)."
  type        = string
  default     = "vietanhphung.com"
}

variable "gallery_path" {
  description = "Path of the gallery page on the existing site."
  type        = string
  default     = "/wed-invitation/intimate/gallery/"
}

variable "extra_allowed_origins" {
  description = "Extra exact origins for local testing, e.g. [\"http://localhost:8000\"]."
  type        = list(string)
  default     = []
}

variable "original_prefix" {
  description = "S3 prefix for guest uploads."
  type        = string
  default     = "original/"
}

variable "photo_prefix" {
  description = "S3 prefix for optimized gallery photos (served by CloudFront)."
  type        = string
  default     = "gallery/"
}

variable "lambda_memory" {
  description = "MB for the image processor (CPU scales with memory)."
  type        = number
  default     = 1536
}

variable "lambda_timeout" {
  description = "Seconds per image."
  type        = number
  default     = 60
}

variable "max_image_dimension" {
  description = "Longest side of gallery images, px."
  type        = number
  default     = 1600
}

variable "webp_quality" {
  type    = number
  default = 80

  validation {
    condition     = var.webp_quality >= 1 && var.webp_quality <= 100
    error_message = "1-100."
  }
}

variable "max_upload_mb" {
  description = "Uploads larger than this are rejected by the processor."
  type        = number
  default     = 30
}

variable "original_retention_days" {
  description = "Unprocessed originals are kept this long for investigation, then expire."
  type        = number
  default     = 14
}

variable "deleted_photo_retention_days" {
  description = "Admin-deleted photos stay restorable this long."
  type        = number
  default     = 30
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "cloudfront_price_class" {
  type    = string
  default = "PriceClass_200"
}

variable "cognito_domain_prefix" {
  description = "Prefix for the admin login page <prefix>.auth.<region>.amazoncognito.com (globally unique). Empty = derived from project/env/account."
  type        = string
  default     = ""
}

variable "admin_emails" {
  description = "Admin logins to create (temporary password is emailed by Cognito). Keep in terraform.tfvars, not in git."
  type        = list(string)
  default     = []
}

variable "alarm_email" {
  description = "Optional address for CloudWatch alarm emails."
  type        = string
  default     = ""
  sensitive   = true
}
