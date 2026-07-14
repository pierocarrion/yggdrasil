variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "yggdrasil-web"
}

variable "container_image" {
  description = "Container image URL"
  type        = string
}

variable "port" {
  description = "Container port"
  type        = number
  default     = 8080
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 100
}

variable "cpu" {
  description = "CPU allocation"
  type        = string
  default     = "2000m"
}

variable "memory" {
  description = "Memory allocation"
  type        = string
  default     = "2Gi"
}

variable "service_account_email" {
  description = "Service account email for Cloud Run"
  type        = string
}

variable "env_vars" {
  description = "Environment variables"
  type        = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secret_volumes" {
  description = "Secret Manager volume mounts (deprecated — prefer secret_env_vars)"
  type        = list(object({
    secret_name = string
    mount_path  = string
  }))
  default = []
}

variable "secret_env_vars" {
  description = "Secrets injected as environment variables (read by the app via process.env.<env_name>)"
  type = list(object({
    env_name    = string
    secret_name = string
    version     = string
  }))
  default = []
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated invocations"
  type        = bool
  default     = true
}

variable "custom_domains" {
  description = "Custom domains for the service"
  type        = list(string)
  default     = []
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default     = {}
}
