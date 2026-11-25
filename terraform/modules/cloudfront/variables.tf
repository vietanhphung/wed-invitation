variable "name_prefix" {
  type = string
}

variable "bucket_regional_domain_name" {
  type = string
}

variable "allowed_origins" {
  description = "Origins allowed to fetch gallery/index.json from the browser."
  type        = list(string)
}

variable "price_class" {
  description = "PriceClass_200 includes Asian edge locations (guests in Vietnam)."
  type        = string
  default     = "PriceClass_200"
}

variable "tags" {
  type    = map(string)
  default = {}
}
