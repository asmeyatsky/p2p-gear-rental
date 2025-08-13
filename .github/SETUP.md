# GitHub Actions Setup Guide

This document explains how to configure the GitHub Actions workflows for automatic deployment and syncing.

## Required GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add these secrets:

### Development/Testing Secrets
```
NEXT_PUBLIC_SUPABASE_URL=https://gietfsryjwphwxfvwbnd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_f83Nr0PARh5fRJ8DeO_S90_UldsvZDy
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/test_db
```

### Google Cloud Production Secrets
```
GCP_PROJECT_ID_PRODUCTION=p2p-gear-rental-prod
GCP_SA_KEY_PRODUCTION=[Your service account JSON key]
CLOUD_SQL_CONNECTION_NAME=p2p-gear-rental-prod:us-central1:gear-rental-db
```

### Google Cloud Staging Secrets (Optional)
```
GCP_PROJECT_ID_STAGING=p2p-gear-rental-staging
GCP_SA_KEY_STAGING=[Your staging service account JSON key]
```

### Stripe Secrets
```
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
STRIPE_SECRET_KEY_TEST=sk_test_YOUR_TEST_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_YOUR_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
STRIPE_WEBHOOK_SECRET_TEST=whsec_YOUR_TEST_WEBHOOK_SECRET
```

## Service Account Setup

### 1. Create Google Cloud Service Account
```bash
# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions \
  --description="Service account for GitHub Actions deployments" \
  --display-name="GitHub Actions"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 2. Add Service Account Key to GitHub Secrets
1. Copy the contents of `github-actions-key.json`
2. Add it as `GCP_SA_KEY_PRODUCTION` secret in GitHub
3. Delete the local key file for security

## Workflow Triggers

### CI/CD Pipeline (`ci-cd.yml`)
- **Triggers**: Push to `main` or `develop`, Pull Requests to `main`
- **Actions**: Test → Build → Deploy to staging (develop) or production (main)
- **Features**: Type checking, linting, unit tests, E2E tests, security scanning

### Auto Sync (`auto-sync.yml`)
- **Triggers**: Push to any branch
- **Actions**: Automatically ensures all commits are synced to remote
- **Features**: Verifies sync status, handles conflicts

### Backup & Maintenance (`backup.yml`)
- **Triggers**: Weekly schedule (Sundays 2 AM UTC), Manual trigger
- **Actions**: Creates repository backups, dependency checks, security audits
- **Features**: Automated cleanup of old workflow runs

## Environment Setup

### Production Environment
- **Branch**: `main`
- **Cloud Run Service**: `gear-rental-service`
- **Resources**: 2 CPU, 4GB RAM, 1-100 instances
- **Features**: Full production configuration with monitoring

### Staging Environment (Optional)
- **Branch**: `develop`
- **Cloud Run Service**: `gear-rental-staging`
- **Resources**: 1 CPU, 2GB RAM, 0-10 instances
- **Features**: Testing environment with reduced resources

## Security Features

### 1. Branch Protection
Set up branch protection rules for `main`:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to matching branches

### 2. Environment Protection
For production environment:
- Required reviewers
- Wait timer (optional)
- Deployment branches rule

### 3. Dependency Scanning
- Automated security scans on PRs
- Weekly dependency update reports
- npm audit integration

## Monitoring & Alerts

### Workflow Notifications
- Success/failure notifications
- Deployment status updates
- Security scan results

### Repository Health
- Weekly backup creation
- Dependency update reports
- Security vulnerability alerts
- Repository statistics

## Manual Operations

### Force Sync to Remote
```bash
# If automatic sync fails, manually run:
git push origin main --force-with-lease
```

### Manual Deployment
```bash
# Trigger deployment manually via GitHub UI:
# Actions → CI/CD Pipeline → Run workflow
```

### Emergency Rollback
```bash
# Use Google Cloud Console or CLI:
gcloud run services update-traffic gear-rental-service \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1
```

## Troubleshooting

### Common Issues

#### 1. Deployment Failures
- Check GitHub Actions logs
- Verify all secrets are set correctly
- Ensure Google Cloud services are enabled
- Check service account permissions

#### 2. Sync Issues
- Verify repository permissions
- Check for merge conflicts
- Ensure GitHub token has proper scopes

#### 3. Test Failures
- Review test logs in Actions tab
- Check if environment variables are set
- Verify Supabase and other external services are accessible

### Getting Help
1. Check GitHub Actions logs for detailed error messages
2. Review Google Cloud Console for deployment issues
3. Check Supabase dashboard for authentication issues
4. Consult the main DEPLOYMENT.md for infrastructure setup

## Next Steps

1. **Set up all required secrets** in GitHub repository settings
2. **Create Google Cloud service account** and add key to secrets
3. **Configure branch protection rules** for main branch
4. **Test the workflow** by making a small commit
5. **Monitor first deployment** to ensure everything works correctly

The workflows will automatically handle:
- ✅ Code quality checks (linting, type checking)
- ✅ Automated testing (unit + E2E)
- ✅ Security scanning
- ✅ Automatic deployment to staging/production
- ✅ Repository syncing and backup
- ✅ Dependency monitoring