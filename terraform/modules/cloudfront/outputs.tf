output "distribution_id" {
  value = aws_cloudfront_distribution.gallery.id
}

output "distribution_arn" {
  value = aws_cloudfront_distribution.gallery.arn
}

output "domain_name" {
  value = aws_cloudfront_distribution.gallery.domain_name
}
