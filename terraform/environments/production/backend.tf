# Remote state in S3 with native lock files (Terraform >= 1.10). The bucket is created once by
# terraform/bootstrap; its name and region are passed at init time so no account-specific
# value is committed:
#
#   terraform init -backend-config=backend.hcl      (copy backend.hcl.example -> backend.hcl)
#
# scripts/terraform.sh does this for you.
terraform {
  backend "s3" {
    key          = "wedding-gallery/production/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}
