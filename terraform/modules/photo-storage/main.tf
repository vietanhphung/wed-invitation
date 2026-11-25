# Private photo bucket:
#   original/  guest uploads (write-only for guests), deleted by the processor after success
#   gallery/   optimized WebP + index.json, read through CloudFront only

resource "aws_s3_bucket" "photos" {
  bucket        = var.bucket_name
  force_destroy = false # never let terraform wipe guests' photos
  tags          = var.tags
}

resource "aws_s3_bucket_ownership_controls" "photos" {
  bucket = aws_s3_bucket.photos.id
  rule {
    object_ownership = "BucketOwnerEnforced" # ACLs disabled
  }
}

resource "aws_s3_bucket_public_access_block" "photos" {
  bucket                  = aws_s3_bucket.photos.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# SSE-S3 instead of a customer-managed KMS key: no $1/month key, and guests, the processor and
# CloudFront OAC need no KMS grants. Data is still encrypted at rest.
#trivy:ignore:AVD-AWS-0132
resource "aws_s3_bucket_server_side_encryption_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256" # SSE-S3: free, and CloudFront OAC can read it without KMS grants
    }
    bucket_key_enabled = true
  }
}

# Versioning turns an admin delete into a recoverable delete marker for
# var.deleted_photo_retention_days (see lifecycle below).
resource "aws_s3_bucket_versioning" "photos" {
  bucket = aws_s3_bucket.photos.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "photos" {
  bucket     = aws_s3_bucket.photos.id
  depends_on = [aws_s3_bucket_versioning.photos]

  # Safety net for originals the processor rejected or failed on: kept long enough to
  # investigate / re-run, then expired. Successful uploads are deleted right after processing.
  rule {
    id     = "expire-abandoned-originals"
    status = "Enabled"
    filter {
      prefix = var.original_prefix
    }
    expiration {
      days = var.original_retention_days
    }
    noncurrent_version_expiration {
      noncurrent_days = 1
    }
  }

  # Deleted / overwritten gallery photos stay restorable for a while, then go.
  rule {
    id     = "expire-deleted-gallery-versions"
    status = "Enabled"
    filter {
      prefix = var.gallery_prefix
    }
    noncurrent_version_expiration {
      noncurrent_days = var.deleted_photo_retention_days
    }
    expiration {
      expired_object_delete_marker = true
    }
  }

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# Browser access: guests PUT into original/, the admin DELETEs from gallery/.
# Reads go through CloudFront (which sends its own CORS headers), not S3 directly.
resource "aws_s3_bucket_cors_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id
  cors_rule {
    allowed_origins = var.allowed_origins
    allowed_methods = ["PUT", "DELETE", "HEAD"]
    allowed_headers = [
      "authorization", "content-type", "x-amz-date",
      "x-amz-content-sha256", "x-amz-security-token", "x-amz-user-agent"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

data "aws_iam_policy_document" "bucket" {
  # TLS only
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.photos.arn,
      "${aws_s3_bucket.photos.arn}/*",
    ]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # CloudFront (this distribution only) may read gallery/ — nothing else.
  statement {
    sid       = "AllowCloudFrontReadGallery"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.photos.arn}/${var.gallery_prefix}*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [var.cloudfront_distribution_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "photos" {
  bucket     = aws_s3_bucket.photos.id
  policy     = data.aws_iam_policy_document.bucket.json
  depends_on = [aws_s3_bucket_public_access_block.photos]
}
