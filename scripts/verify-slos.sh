#!/bin/bash
set -euo pipefail

# =============================================================================
# SLO Verification Script
# =============================================================================
# Usage: ./scripts/verify-slos.sh <environment>
# =============================================================================

ENVIRONMENT="${1:-prod}"
REGION="us-central1"
SERVICE_NAME="yggdrasil-web"

if [ "$ENVIRONMENT" = "dev" ]; then
  PROJECT_ID="yggdrasil-dev"
elif [ "$ENVIRONMENT" = "prod" ]; then
  PROJECT_ID="yggdrasil-prod"
else
  echo "ERROR: Invalid environment. Use 'dev' or 'prod'"
  exit 1
fi

echo "============================================="
echo "  SLO Verification for ${ENVIRONMENT}"
echo "============================================="

# Check if authenticated
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q .; then
  echo "ERROR: Not authenticated to Google Cloud"
  exit 1
fi

# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Check 5xx error rate
echo "Checking 5xx error rate..."
ERROR_RATE=$(curl -s "https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/timeSeries?filter=metric.type%3D%22run.googleapis.com%2Frequest_count%22%20AND%20metric.label.response_code_class%3D%225xx%22%20AND%20resource.label.service_name%3D%22${SERVICE_NAME}%22&interval.startTime=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)&interval.endTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)&aggregation.alignmentPeriod=60s&aggregation.crossSeriesReducer=REDUCE_SUM&aggregation.perSeriesAligner=ALIGN_RATE" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq -r '.timeSeries[0].points[0].value.doubleValue // 0' 2>/dev/null || echo "0")

echo "5xx Error Rate: ${ERROR_RATE}"

if (( $(echo "$ERROR_RATE > 0.01" | bc -l 2>/dev/null || echo 0) )); then
  echo "WARNING: Error rate ${ERROR_RATE} exceeds 1% threshold"
  exit 1
fi

# Check P99 latency
echo "Checking P99 latency..."
LATENCY_P99=$(curl -s "https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/timeSeries?filter=metric.type%3D%22run.googleapis.com%2Frequest_latencies%22%20AND%20resource.label.service_name%3D%22${SERVICE_NAME}%22&interval.startTime=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)&interval.endTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)&aggregation.alignmentPeriod=60s&aggregation.crossSeriesReducer=REDUCE_PERCENTILE_99&aggregation.perSeriesAligner=ALIGN_PERCENTILE_99" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq -r '.timeSeries[0].points[0].value.doubleValue // 0' 2>/dev/null || echo "0")

echo "P99 Latency: ${LATENCY_P99}ms"

if (( $(echo "$LATENCY_P99 > 2000" | bc -l 2>/dev/null || echo 0) )); then
  echo "WARNING: P99 latency ${LATENCY_P99}ms exceeds 2000ms threshold"
  exit 1
fi

echo "============================================="
echo "  SLO Verification Passed"
echo "  Error Rate: ${ERROR_RATE}"
echo "  P99 Latency: ${LATENCY_P99}ms"
echo "============================================="
