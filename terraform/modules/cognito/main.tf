# Guests: identity pool, unauthenticated identities -> temporary, upload-only credentials.
# Admin:  user pool (admin-created users only) + hosted login page -> authenticated identity
#         in the same identity pool -> admin role.

resource "aws_cognito_user_pool" "admin" {
  name                = "${var.name_prefix}-gallery-admin"
  deletion_protection = "ACTIVE"
  mfa_configuration   = "OPTIONAL"

  # No self sign-up: only users created by you (see README) can log in.
  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  software_token_mfa_configuration {
    enabled = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = var.tags
}

# Hosted login page on an AWS-owned domain (<prefix>.auth.<region>.amazoncognito.com):
# no DNS change on vietanhphung.com, no certificate.
resource "aws_cognito_user_pool_domain" "admin" {
  domain       = var.hosted_ui_domain_prefix
  user_pool_id = aws_cognito_user_pool.admin.id
}

# Public SPA client: authorization code + PKCE, no client secret (it would be visible in the page).
resource "aws_cognito_user_pool_client" "admin_web" {
  name         = "${var.name_prefix}-gallery-admin-web"
  user_pool_id = aws_cognito_user_pool.admin.id

  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.callback_urls
  explicit_auth_flows                  = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true

  id_token_validity      = 60
  access_token_validity  = 60
  refresh_token_validity = 1
  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_identity_pool" "gallery" {
  identity_pool_name               = replace("${var.name_prefix} gallery", "-", " ")
  allow_unauthenticated_identities = true  # guests upload without logging in
  allow_classic_flow               = false # enhanced flow only

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.admin_web.id
    provider_name           = aws_cognito_user_pool.admin.endpoint
    server_side_token_check = true
  }

  tags = var.tags
}

resource "aws_cognito_identity_pool_roles_attachment" "gallery" {
  identity_pool_id = aws_cognito_identity_pool.gallery.id
  roles = {
    unauthenticated = var.guest_role_arn
    authenticated   = var.admin_role_arn
  }
}

# Optional: create the admin login. Cognito emails a temporary password to this address,
# so no password ever passes through Terraform or its state.
resource "aws_cognito_user" "admin" {
  for_each     = toset(var.admin_emails)
  user_pool_id = aws_cognito_user_pool.admin.id
  username     = each.value

  attributes = {
    email          = each.value
    email_verified = "true"
  }
  desired_delivery_mediums = ["EMAIL"]

  lifecycle {
    ignore_changes = [attributes]
  }
}
