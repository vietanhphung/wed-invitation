variable "bucket_name" {
  description = "Globally unique name of the private photo bucket."
  type        = string
}

variable "original_prefix" {
  description = "Prefix guests upload to (must end with /)."
  type        = string
}

variable "gallery_prefix" {
  description = "Prefix holding optimized images and the manifest (must end with /)."
  type        = string
}

variable "allowed_origins" {
  description = "Exact browser origins allowed by S3 CORS (no wildcards)."
  type        = list(string)
}

variable "original_retention_days" {
  description = "Days before an unprocessed original expires."
  type        = number
}

variable "deleted_photo_retention_days" {
  description = "Days a deleted gallery photo stays restorable (noncurrent version)."
  type        = number
}

variable "cloudfront_distribution_arn" {
  description = "Distribution allowed to read gallery/ via Origin Access Control."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
