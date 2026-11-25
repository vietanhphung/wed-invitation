output "user_pool_id" {
  value = aws_cognito_user_pool.admin.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.admin_web.id
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.gallery.id
}

output "hosted_ui_domain" {
  value = "${aws_cognito_user_pool_domain.admin.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

data "aws_region" "current" {}
