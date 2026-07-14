variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "attestor_name" {
  description = "Binary Authorization attestor name"
  type        = string
  default     = "build-attestor"
}

variable "note_name" {
  description = "Container Analysis note name"
  type        = string
  default     = "build-attestor-note"
}

variable "kms_keyring_id" {
  description = "Cloud KMS keyring ID"
  type        = string
}

variable "kms_key_id" {
  description = "Cloud KMS key ID"
  type        = string
}

variable "enforcement_mode" {
  description = "Enforcement mode. Start with DRY_RUN_AUDIT_LOG_ONLY and switch to ENFORCED_BLOCK_AND_AUDIT_LOG once the first signed release is validated."
  type        = string
  default     = "DRY_RUN_AUDIT_LOG_ONLY"
}

variable "allowed_registries" {
  description = "List of allowed registry patterns"
  type        = list(string)
  default = [
    "us-docker.pkg.dev/yggdrasil-prod/docker/*",
  ]
}
