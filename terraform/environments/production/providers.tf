terraform {
  # >= 1.10 for S3 native state locking (use_lockfile).
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
  }
}

# Credentials come from the normal AWS chain (AWS_PROFILE / SSO / env vars / IAM role).
# Nothing is hard-coded here.
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.tags
  }
}
