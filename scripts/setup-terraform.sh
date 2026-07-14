#!/bin/bash
set -euo pipefail

# =============================================================================
# Yggdrasil Terraform bootstrap
# =============================================================================
# Creates the Terraform state bucket + applies the control-plane layer (terraform/shared)
# which lives in the yggdrasil-prod project (Artifact Registry, Cloud Build, KMS,
# Binary Authorization, Workload Identity Federation, CI service accounts).
# =============================================================================

REGION="us-central1"
PROD_PROJECT="yggdrasil-prod"
STATE_BUCKET="yggdrasil-prod-tf-state"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================="
echo "  Yggdrasil Terraform bootstrap"
echo "  Control-plane project: ${PROD_PROJECT}"
echo "============================================="

if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q .; then
  echo "ERROR: Not authenticated to Google Cloud — run: gcloud auth login && gcloud auth application-default login"
  exit 1
fi

# Create state bucket if it doesn't exist
echo "Checking state bucket..."
if ! gsutil ls -b "gs://${STATE_BUCKET}" >/dev/null 2>&1; then
  echo "Creating state bucket: ${STATE_BUCKET}"
  gsutil mb -p "${PROD_PROJECT}" -l "${REGION}" -b on "gs://${STATE_BUCKET}"
  gsutil versioning set on "gs://${STATE_BUCKET}"
else
  echo "State bucket already exists."
fi

# Apply control-plane (shared) layer
echo "Applying control-plane infrastructure (terraform/shared)..."
cd "${SCRIPT_DIR}/../terraform/shared"
terraform init
terraform apply -auto-approve

WIF_PROVIDER=$(terraform output -raw wif_provider_full 2>/dev/null || echo "")
DEPLOYER_SA=$(terraform output -json service_account_emails 2>/dev/null | jq -r '.["github-deployer"]' 2>/dev/null || echo "")

cat <<EOF

=============================================
  Control plane applied!

  GitHub secrets to set (Settings → Secrets → Actions):
    WIF_PROVIDER       = ${WIF_PROVIDER}
    GITHUB_DEPLOYER_SA = ${DEPLOYER_SA}
    TERRAFORM_SA       = ${DEPLOYER_SA}

  Next steps:
    1. Apply dev environment:    cd terraform/environments/dev  && terraform init && terraform apply
    2. Apply prod environment:   cd terraform/environments/prod && terraform init && terraform apply
    3. Load runtime secrets into Secret Manager (see docs/ARCHITECTURE.md §5/§8.6)
    4. Create the two Firebase projects (see docs/ARCHITECTURE.md §8.4)
=============================================
EOF
