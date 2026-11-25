# Three separate roles, each with only what its flow needs:
#   guest  (Cognito unauthenticated) : PutObject original/*            — nothing else
#   admin  (Cognito authenticated)   : read/list photos, delete gallery/*
#   lambda (image processor)         : read+delete original/*, write gallery/*, list gallery/, logs

locals {
  bucket_arn   = var.bucket_arn
  original_arn = "${var.bucket_arn}/${var.original_prefix}*"
  gallery_arn  = "${var.bucket_arn}/${var.gallery_prefix}*"
}

# ---------- Guest (unauthenticated identities) ----------

data "aws_iam_policy_document" "guest_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [var.identity_pool_id]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["unauthenticated"]
    }
  }
}

resource "aws_iam_role" "guest" {
  name                 = "${var.name_prefix}-gallery-guest"
  description          = "Wedding gallery guests: upload originals only."
  assume_role_policy   = data.aws_iam_policy_document.guest_trust.json
  max_session_duration = 3600
  tags                 = var.tags
}

data "aws_iam_policy_document" "guest" {
  statement {
    sid       = "UploadOriginalsOnly"
    actions   = ["s3:PutObject"]
    resources = [local.original_arn]
  }
}

resource "aws_iam_role_policy" "guest" {
  name   = "upload-originals"
  role   = aws_iam_role.guest.id
  policy = data.aws_iam_policy_document.guest.json
}

# ---------- Admin (authenticated identities from the admin user pool) ----------

data "aws_iam_policy_document" "admin_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [var.identity_pool_id]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

resource "aws_iam_role" "admin" {
  name                 = "${var.name_prefix}-gallery-admin"
  description          = "Wedding gallery admin: review and delete gallery photos."
  assume_role_policy   = data.aws_iam_policy_document.admin_trust.json
  max_session_duration = 3600
  tags                 = var.tags
}

data "aws_iam_policy_document" "admin" {
  statement {
    sid       = "ListPhotoPrefixes"
    actions   = ["s3:ListBucket"]
    resources = [local.bucket_arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["${var.original_prefix}*", "${var.gallery_prefix}*"]
    }
  }
  statement {
    sid       = "ReadPhotos"
    actions   = ["s3:GetObject"]
    resources = [local.original_arn, local.gallery_arn]
  }
  statement {
    sid       = "DeleteGalleryPhotos"
    actions   = ["s3:DeleteObject"]
    resources = ["${var.bucket_arn}/${var.gallery_prefix}*.webp"]
  }
}

resource "aws_iam_role_policy" "admin" {
  name   = "manage-gallery"
  role   = aws_iam_role.admin.id
  policy = data.aws_iam_policy_document.admin.json
}

# ---------- Lambda image processor ----------

data "aws_iam_policy_document" "lambda_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name_prefix}-image-processor"
  description        = "Wedding gallery image processor."
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
  tags               = var.tags
}

data "aws_iam_policy_document" "lambda" {
  statement {
    sid       = "ReadAndRemoveOriginals"
    actions   = ["s3:GetObject", "s3:DeleteObject"]
    resources = [local.original_arn]
  }
  statement {
    sid       = "WriteAndVerifyGallery"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = [local.gallery_arn]
  }
  # Unconditioned on purpose: without bucket-level ListBucket, S3 answers HEAD on a missing
  # key (the first manifest, a duplicate event's already-deleted original) with 403, not 404.
  # The bucket holds only this gallery's photos.
  statement {
    sid       = "ListPhotoBucket"
    actions   = ["s3:ListBucket"]
    resources = [local.bucket_arn]
  }
  statement {
    sid       = "WriteOwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${var.lambda_log_group_arn}:*"]
  }
}

resource "aws_iam_role_policy" "lambda" {
  name   = "process-images"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda.json
}
