variable "name_prefix" {
  type = string
}

variable "lambda_function_name" {
  type = string
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "alarm_email" {
  description = "Optional address for alarm emails (\"\" = no notifications)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
