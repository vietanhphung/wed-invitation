output "guest_role_arn" {
  value = aws_iam_role.guest.arn
}

output "admin_role_arn" {
  value = aws_iam_role.admin.arn
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda.arn
}
