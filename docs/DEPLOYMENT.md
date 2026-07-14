# Yggdrasil GCP Deployment Guide

> **Authoritative reference:** [ARCHITECTURE.md](ARCHITECTURE.md) reflects the current 2-project
> model (`yggdrasil-dev` + `yggdrasil-prod`, no separate `shared` project — CI services live in prod).
> This guide is kept for historical context; defer to ARCHITECTURE.md where they differ.

## Architecture Overview

```
GitHub Actions (OIDC) → Cloud Build → Artifact Registry → Cloud Run (dev | prod)
                              ↓
                         Cloud KMS (signing) → Binary Authorization (DRYRUN)
```

## GCP Projects

| Project | Purpose |
|---------|---------|
| `yggdrasil-dev` | Development (Cloud Run, Functions, Firestore, Storage, Secrets) |
| `yggdrasil-prod` | Production (same app services) + CI control plane (Artifact Registry, Cloud Build, Cloud Deploy, KMS, Binary Authz, WIF, Terraform state) |

## Prerequisites

1. GCP Organization (optional but recommended)
2. Billing account linked to all projects
3. GitHub repository with Actions enabled
4. `gcloud` CLI installed and authenticated

## Initial Setup

### 1. Authenticate to Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
```

### 2. Create GCP Projects

```bash
# Create projects (if not using the console)
gcloud projects create yggdrasil-dev --name="Yggdrasil Dev"
gcloud projects create yggdrasil-prod --name="Yggdrasil Prod"

# Link billing account
gcloud billing projects link yggdrasil-dev --billing-account=YOUR_BILLING_ACCOUNT_ID
gcloud billing projects link yggdrasil-prod --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### 3. Run Terraform Setup

```bash
chmod +x scripts/setup-terraform.sh
./scripts/setup-terraform.sh
```

### 4. Configure GitHub Secrets

Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret

**Required secrets:**

| Secret | Value |
|--------|-------|
| `WIF_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider` |
| `GITHUB_DEPLOYER_SA` | `github-deployer@yggdrasil-prod.iam.gserviceaccount.com` |
| `TERRAFORM_SA` | `github-deployer@yggdrasil-prod.iam.gserviceaccount.com` |
| `SLACK_WEBHOOK` | Slack incoming webhook URL (optional) |

### 5. Create GitHub Environments

Go to GitHub repo → Settings → Environments → New environment

**Dev environment:**
- Name: `dev`
- Protection rules: None (auto-deploy)

**Production environment:**
- Name: `production`
- Protection rules:
  - ✅ Required reviewers (add yourself)
  - ✅ Wait timer: 5 minutes
  - ✅ Deployment branches: `main` only

## Deployment Flow

### Development (Auto-deploy)

```
1. Push to `develop` branch
2. CI runs: lint, test, security scan
3. Cloud Build builds container → pushes to Artifact Registry
4. Cosign signs container (Cloud KMS)
5. Binary Authorization creates attestation
6. Cloud Deploy creates release → deploys to dev target
7. Smoke tests run automatically
```

### Production (Manual deploy)

```
1. Go to GitHub Actions → Deploy to Production → Run workflow
2. Enter commit SHA (8 chars from CI build)
3. Click "Run workflow"
4. GitHub Environment protection kicks in:
   - Required reviewer approves
   - 5-minute wait timer
5. Cloud Deploy creates release → canary deployment:
   - 5% traffic (verify)
   - 25% traffic (verify)
   - 50% traffic (verify)
   - 100% traffic
6. SLO verification at each phase
7. Auto-rollback if SLO breach
8. Slack notification on success/failure
```

## Manual Deployment

### Deploy to Dev

```bash
./scripts/deploy-dev.sh <commit_sha>
```

### Deploy to Production

```bash
./scripts/deploy-prod.sh <commit_sha>
./scripts/deploy-prod.sh <commit_sha> --skip-canary  # Emergency
```

## GCP Services Used

| Service | Purpose | Project |
|---------|---------|---------|
| Cloud Run | Web app hosting | dev/prod |
| Cloud Functions (2nd Gen) | Backend functions | dev/prod |
| Firestore | Database | dev/prod |
| Cloud Storage | Assets & backups | dev/prod |
| Secret Manager | API keys & secrets | shared |
| Artifact Registry | Container images | shared |
| Cloud Build | Container builds | shared |
| Cloud Deploy | Progressive delivery | shared |
| Cloud KMS | Signing keys | shared |
| Binary Authorization | Supply chain security | shared |
| Cloud Monitoring | SLOs & alerts | dev/prod |
| Cloud Logging | Log aggregation | dev/prod |
| Workload Identity Federation | GitHub Actions auth | shared |

## Monitoring & Observability

### SLOs

| Metric | Dev Target | Prod Target |
|--------|------------|-------------|
| Availability | 99.0% | 99.9% |
| Latency P99 | < 3s | < 2s |
| Error Rate | < 1% | < 0.1% |

### Uptime Checks

- 3-region uptime checks (US, Europe, Asia Pacific)
- 60-second intervals
- Health endpoint: `/api/health`

### Alerting

- Fast burn rate (2% error budget in 1h)
- Slow burn rate (5% error budget in 6h)
- Error rate > 1%
- Email notifications (configure `alert_email` in terraform.tfvars)

## Rollback

### Automatic Rollback

Cloud Deploy automatically rolls back if:
- SLO breach during canary
- Health check failure
- Pre-deploy verification fails

### Manual Rollback

```bash
# List recent releases
gcloud deploy releases list \
  --delivery-pipeline=yggdrasil-pipeline \
  --region=us-central1

# Promote previous release
gcloud deploy releases promote \
  --delivery-pipeline=yggdrasil-pipeline \
  --release=RELEASE_NAME \
  --region=us-central1 \
  --to-target=prod
```

## Security

### Supply Chain Security

1. **Cloud Build SLSA Provenance**: Automatic provenance generation
2. **Cosign Signing**: Container images signed with Cloud KMS
3. **Binary Authorization**: Only signed, attested images can deploy
4. **Workload Identity Federation**: No service account keys in GitHub

### Secret Management

All secrets are stored in Secret Manager with:
- 90-day auto-rotation
- Versioning enabled
- Audit logging

### IAM

- Least privilege access
- Service accounts for each service
- Conditional bindings where possible

## Cost Optimization

### Dev Environment

- Cloud Run: min 0 instances (scales to zero)
- Firestore: single region
- Storage: standard class

### Production Environment

- Cloud Run: min 2 instances (always warm)
- Firestore: multi-region with PITR
- Storage: lifecycle rules (Standard → Nearline → Coldline → Archive)

## Troubleshooting

### Deployment Failed

```bash
# Check Cloud Deploy rollout status
gcloud deploy rollouts list \
  --delivery-pipeline=yggdrasil-pipeline \
  --region=us-central1

# Check rollout details
gcloud deploy rollouts describe ROLLOUT_NAME --region=us-central1
```

### Container Build Failed

```bash
# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds logs BUILD_ID
```

### Cloud Run Issues

```bash
# Check Cloud Run service status
gcloud run services describe yggdrasil-web --region=us-central1

# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=yggdrasil-web" --limit=50
```

## Next Steps

1. **Set up Firebase Functions**: Migrate existing functions to Cloud Functions 2nd Gen
2. **Configure custom domains**: Map `dev.yggdrasil.app` and `yggdrasil.app` to Cloud Run
3. **Set up Cloud Armor**: Add WAF rules for production
4. **Enable VPC Service Controls**: Add data perimeter for sensitive resources
5. **Set up Cloud Trace**: Distributed tracing for performance monitoring
6. **Configure Cloud CDN**: Add caching layer for static assets
