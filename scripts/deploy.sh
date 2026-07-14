#!/bin/bash
set -euo pipefail

# =============================================================================
# Yggdrasil manual deploy — triggers Cloud Build for a given environment.
# Usage: ./scripts/deploy.sh <dev|prod> [short_sha]
# =============================================================================

ENV="${1:-}"
case "${ENV}" in
  dev|prod) ;;
  *) echo "Usage: $0 <dev|prod> [short_sha]"; exit 1 ;;
esac

SHA="${2:-$(git rev-parse --short HEAD)}"
REGION="us-central1"
PROD_PROJECT="yggdrasil-prod"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================="
echo "  Yggdrasil deploy"
echo "  Environment: ${ENV}"
echo "  Commit SHA:  ${SHA}"
echo "============================================="

if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q .; then
  echo "ERROR: Not authenticated to Google Cloud — run: gcloud auth login"
  exit 1
fi

cd "${SCRIPT_DIR}/.."
gcloud builds submit . \
  --config=cloudbuild.yaml \
  --project="${PROD_PROJECT}" \
  --region="${REGION}" \
  --substitutions=_ENV="${ENV}",_SHORT_SHA="${SHA}" \
  --timeout=1800s

echo "============================================="
echo "  Deploy submitted to Cloud Build (env=${ENV})"
echo "  Image: us-docker.pkg.dev/${PROD_PROJECT}/docker/yggdrasil-web:${ENV}-${SHA}"
echo "============================================="
