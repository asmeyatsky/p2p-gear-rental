# Deploying to Google Cloud

This guide provides instructions for deploying the P2P Gear Rental application to Google Cloud Platform (GCP). The setup uses the following services:

*   **Google Cloud Run**: For hosting the Next.js application.
*   **Google Cloud SQL**: For the PostgreSQL database.
*   **Google Artifact Registry**: To store the Docker container image.
*   **Google Secret Manager**: To securely store secrets like API keys and database credentials.
*   **Terraform**: To automate the provisioning of the cloud infrastructure.

## Prerequisites

1.  **Google Cloud SDK (`gcloud`)**: Make sure you have the `gcloud` CLI installed and authenticated.
2.  **Terraform**: Install Terraform on your local machine.
3.  **Docker**: Docker is required to build and push the container image.

## Deployment Steps

### 1. Configure GCP Project

1.  **Create or select a GCP project.**
2.  **Enable the required APIs**:
    ```bash
    gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
    ```
3.  **Authenticate Docker with Artifact Registry**:
    ```bash
    gcloud auth configure-docker gcr.io
    ```

### 2. Build and Push the Docker Image

1.  **Build the Docker image**:
    ```bash
    docker build -t gcr.io/YOUR_PROJECT_ID/p2p-gear-rental:latest .
    ```
    Replace `YOUR_PROJECT_ID` with your GCP project ID.

2.  **Push the image to Artifact Registry**:
    ```bash
    docker push gcr.io/YOUR_PROJECT_ID/p2p-gear-rental:latest
    ```

### 3. Provision Infrastructure with Terraform

The `terraform/` directory contains the scripts to provision the necessary infrastructure on GCP.

1.  **Navigate to the `terraform` directory**:
    ```bash
    cd terraform
    ```

2.  **Initialize Terraform**:
    ```bash
    terraform init
    ```

3.  **Review the plan**:
    ```bash
    terraform plan
    ```
    This will show you the resources that will be created.

4.  **Apply the changes**:
    ```bash
    terraform apply
    ```
    You will be prompted to confirm the creation of the resources.

### 4. Post-Deployment

After the Terraform scripts have been successfully applied, the following resources will be available:

*   A **Cloud Run service** running the application. The URL of the service will be an output of the Terraform script.
*   A **Cloud SQL for PostgreSQL** instance.
*   An **Artifact Registry** repository for your Docker images.
*   **Secrets** stored in Secret Manager.

You can now access your application at the URL provided by Cloud Run.
