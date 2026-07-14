resource "google_kms_key_ring" "attestor" {
  name     = var.kms_keyring_id
  location = "global"
  project  = var.project_id
}

resource "google_kms_crypto_key" "attestor" {
  name     = var.kms_key_id
  key_ring = google_kms_key_ring.attestor.id
  purpose  = "ASYMMETRIC_SIGNING"

  version_template {
    algorithm        = "EC_SIGN_P256_SHA256"
    protection_level = "SOFTWARE"
  }
}

resource "google_container_analysis_note" "attestor" {
  name    = var.note_name
  project = var.project_id

  attestation_authority {
    hint {
      human_readable_name = "Build Pipeline Attestor"
    }
  }
}

# Current KMS key version (created implicitly with the crypto key)
data "google_kms_crypto_key_version" "current" {
  crypto_key = google_kms_crypto_key.attestor.id
}

# Fetch the public key PEM via gcloud (requires an authenticated gcloud at plan/apply time).
# This is the documented pattern for wiring KMS-backed keys into a Binary Authorization attestor.
data "external" "kms_public_key" {
  program = [
    "sh", "-c",
    "gcloud kms keys get-public-key ${google_kms_crypto_key.attestor.id} --version=${data.google_kms_crypto_key_version.current.name} --location=global | jq -R '{pem: .}'",
  ]
}

resource "google_binary_authorization_attestor" "default" {
  name    = var.attestor_name
  project = var.project_id

  attestation_authority_note {
    note_reference = google_container_analysis_note.attestor.name

    public_keys {
      id = "kms-ecdsa-p256"
      pkix_public_key {
        public_key_pem      = data.external.kms_public_key.result.pem
        signature_algorithm = "ECDSA_P256_SHA256"
      }
    }
  }
}

resource "google_binary_authorization_policy" "default" {
  project = var.project_id

  dynamic "admission_whitelist_patterns" {
    for_each = var.allowed_registries
    content {
      name_pattern = admission_whitelist_patterns.value
    }
  }

  default_admission_rule {
    evaluation_mode        = "REQUIRE_ATTESTATION"
    enforcement_mode       = var.enforcement_mode
    require_attestations_by = [
      google_binary_authorization_attestor.default.name,
    ]
  }
}

output "attestor_name" {
  value = google_binary_authorization_attestor.default.name
}

output "policy_id" {
  value = google_binary_authorization_policy.default.id
}

output "kms_key_id" {
  value = google_kms_crypto_key.attestor.id
}
