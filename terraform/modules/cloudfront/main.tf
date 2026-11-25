# Serves gallery/ (optimized WebP + index.json) from the private bucket over HTTPS on the
# default *.cloudfront.net domain. The website itself stays on GitHub Pages — this
# distribution never serves vietanhphung.com and needs no DNS change.

resource "aws_cloudfront_origin_access_control" "photos" {
  name                              = "${var.name_prefix}-photos"
  description                       = "Gallery distribution -> private photo bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# AWS managed policies (stable IDs, see AWS docs "Use managed cache policies").
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized" # honours the objects' Cache-Control: immutable images, 10 s manifest
}

resource "aws_cloudfront_response_headers_policy" "gallery" {
  name    = "${var.name_prefix}-gallery"
  comment = "CORS for the gallery page + security headers"

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD"]
    }
    access_control_allow_origins {
      items = var.allowed_origins
    }
    access_control_max_age_sec = 3600
    origin_override            = true
  }

  security_headers_config {
    content_type_options {
      override = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = false
      override                   = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }
}

#trivy:ignore:AVD-AWS-0010 Access logs would need another bucket; CloudFront metrics suffice here.
#trivy:ignore:AVD-AWS-0011 WAF ($5+/month) is out of proportion for a private wedding gallery.
#trivy:ignore:AVD-AWS-0013 Default *.cloudfront.net certificate: TLS policy is managed by AWS.
resource "aws_cloudfront_distribution" "gallery" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.name_prefix} wedding gallery images"
  price_class     = var.price_class
  http_version    = "http2and3"

  origin {
    origin_id                = "photos"
    domain_name              = var.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.photos.id
  }

  default_cache_behavior {
    target_origin_id           = "photos"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true # index.json; WebP is already compressed
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.gallery.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = var.tags
}
