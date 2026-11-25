variable "name_prefix" {
  type = string
}

variable "hosted_ui_domain_prefix" {
  description = "Globally unique prefix for <prefix>.auth.<region>.amazoncognito.com."
  type        = string
}

variable "callback_urls" {
  description = "Exact URLs the admin login may return to (gallery page; http://localhost allowed for dev)."
  type        = list(string)
}

variable "guest_role_arn" {
  type = string
}

variable "admin_role_arn" {
  type = string
}

# Not marked sensitive: Terraform cannot for_each over sensitive values. Keep the real
# addresses in terraform.tfvars, which is gitignored.
variable "admin_emails" {
  description = "Admin logins to create; each receives a temporary password by email."
  type        = list(string)
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
