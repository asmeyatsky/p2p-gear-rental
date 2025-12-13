# GitHub Actions Deployment Setup

This document explains how to set up GitHub Actions for deploying to Google Cloud Run.

## Prerequisites

- Google Cloud Project with billing enabled
- Artifact Registry repository created
- Cloud Run API enabled
- Cloud SQL instance (if using managed database)

## Required GitHub Secrets

Add these secrets in your GitHub repository settings (Settings > Secrets and variables > Actions):

### Google Cloud Authentication

| Secret | Description | Example |
|--------|-------------|---------|
| `GCP_PROJECT_ID` | Your Google Cloud project ID | `p2pgear` |
| `WIF_PROVIDER` | Workload Identity Federation provider | `projects/123456789/locations/global/workloadIdentityPools/github/providers/github` |
| `WIF_SERVICE_ACCOUNT` | Service account email for WIF | `github-actions@p2pgear.iam.gserviceaccount.com` |

### Database

| Secret | Description | Example |
|--------|-------------|---------|
| `CLOUD_SQL_CONNECTION_NAME` | Cloud SQL connection name | `p2pgear:europe-west2:p2p-gear-db` |
| `DATABASE_URL_FOR_MIGRATIONS` | Database URL for migrations | `postgresql://postgres:PASSWORD@localhost:5432/p2pgear` |

## Setting Up Workload Identity Federation (Recommended)

Workload Identity Federation is more secure than using service account keys. Here's how to set it up:

### 1. Create a Workload Identity Pool

```bash
gcloud iam workload-identity-pools create "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### 2. Create a Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create-oidc "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### 3. Create a Service Account

```bash
gcloud iam service-accounts create "github-actions" \
  --project="${PROJECT_ID}" \
  --display-name="GitHub Actions"
```

### 4. Grant Required Permissions

```bash
# Artifact Registry Writer (to push Docker images)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Cloud Run Admin (to deploy services)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Service Account User (to act as the Cloud Run service account)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Cloud SQL Client (for migrations)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### 5. Allow GitHub to Impersonate the Service Account

Replace `YOUR_GITHUB_ORG` and `YOUR_REPO` with your actual values:

```bash
gcloud iam service-accounts add-iam-policy-binding "github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/YOUR_GITHUB_ORG/YOUR_REPO"
```

### 6. Get the WIF Provider Value

```bash
gcloud iam workload-identity-pools providers describe "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --format="value(name)"
```

Use this output as your `WIF_PROVIDER` secret.

## Alternative: Using Service Account Key (Less Secure)

If you prefer to use a service account key instead of Workload Identity Federation:

1. Create and download a service account key:
```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com
```

2. Add the key as a GitHub secret named `GCP_SA_KEY` (base64 encoded content of key.json)

3. Update the deploy workflow to use the key:
```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}
```

## Workflow Overview

### CI Workflow (`ci.yml`)

Runs on every push and pull request:
- **Lint**: ESLint checks
- **Type Check**: TypeScript compilation
- **Test**: Jest unit tests
- **Build**: Next.js production build
- **Security**: npm audit

### Deploy Workflow (`deploy.yml`)

Runs on push to `main` branch:
1. Authenticates to Google Cloud using Workload Identity Federation
2. Builds Docker image
3. Pushes to Artifact Registry
4. Deploys to Cloud Run
5. Runs health check
6. Optionally runs database migrations

## Manual Deployment

You can trigger a manual deployment from the Actions tab:
1. Go to Actions > Deploy to Cloud Run
2. Click "Run workflow"
3. Select the environment (production/staging)
4. Click "Run workflow"

## Troubleshooting

### Build Fails with Database Errors

Ensure `SKIP_DB_DURING_BUILD=true` is set in the Dockerfile. The build should not require database access.

### Authentication Fails

1. Verify WIF is set up correctly
2. Check that the GitHub repository is allowed to impersonate the service account
3. Ensure all required permissions are granted

### Deployment Fails

1. Check Cloud Run logs: `gcloud run services logs read p2p-gear-rental --region=europe-west2`
2. Verify the image exists in Artifact Registry
3. Check that environment variables are set correctly in terraform

### Health Check Fails

1. Verify the `/api/health/liveness` endpoint works locally
2. Check Cloud Run logs for startup errors
3. Ensure the container starts within the timeout period
