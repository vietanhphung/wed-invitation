variable "function_name" {
  type = string
}

variable "package_dir" {
  description = "Directory produced by lambda/image-processor/build.sh."
  type        = string
}

variable "role_arn" {
  type = string
}

variable "log_group_name" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "bucket_arn" {
  type = string
}

variable "account_id" {
  type = string
}

variable "original_prefix" {
  type = string
}

variable "gallery_prefix" {
  type = string
}

variable "memory_size" {
  description = "MB. sharp is CPU-bound and Lambda CPU scales with memory."
  type        = number
}

variable "timeout" {
  description = "Seconds."
  type        = number
}

variable "max_image_dimension" {
  type = number
}

variable "webp_quality" {
  type = number
}

variable "max_upload_mb" {
  type = number
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "thumb_dimension" {
  description = "Shortest side of grid/carousel thumbnails, px."
  type        = number
  default     = 480
}

variable "thumb_quality" {
  type    = number
  default = 70
}
