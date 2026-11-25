variable "name_prefix" {
  description = "Prefix for role names, e.g. wedding-production."
  type        = string
}

variable "bucket_arn" {
  type = string
}

variable "original_prefix" {
  type = string
}

variable "gallery_prefix" {
  type = string
}

variable "identity_pool_id" {
  description = "Cognito identity pool whose identities may assume the guest/admin roles."
  type        = string
}

variable "lambda_log_group_arn" {
  description = "Log group the processor writes to (created by the monitoring module)."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
