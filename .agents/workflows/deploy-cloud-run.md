# Workflow: Deploy to Cloud Run

1. Ensure all env vars are set in GCP Secret Manager (see `.env.production.example`).
2. Run `npm run build` locally and confirm it succeeds.
3. Build Docker image: `docker build -t yggdrasil .`
4. Tag: `docker tag yggdrasil gcr.io/$GCP_PROJECT_ID/yggdrasil:latest`
5. Push: `docker push gcr.io/$GCP_PROJECT_ID/yggdrasil:latest`
6. Deploy: `gcloud run deploy yggdrasil --image gcr.io/$GCP_PROJECT_ID/yggdrasil:latest --region us-central1 --platform managed`
7. Verify the health check endpoint: `curl https://<service-url>/api/health`
8. Check Cloud Run logs for startup errors.
