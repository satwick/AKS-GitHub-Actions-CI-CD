# GitHub Actions Workflow Documentation

## Overview

This workflow automates the CI/CD pipeline for deploying a containerized application to Azure Kubernetes Service (AKS) across multiple environments.

## Workflow Triggers

- **Push to branches**: `main`, `develop`, `staging`
- **Pull requests**: to `main` branch
- **Manual dispatch**: with environment selection

## Environment Mapping

| Branch | Environment | AKS Cluster | Namespace |
|--------|------------|-------------|-----------|
| `main` | Production | `aks-prod-cluster` | `production` |
| `staging` | Staging | `aks-staging-cluster` | `staging` |
| `develop` | Development | `aks-dev-cluster` | `dev` |

## Required Secrets

Configure these secrets in your GitHub repository settings:

### Azure Container Registry (ACR)
- `ACR_USERNAME`: Service principal or admin username for ACR
- `ACR_PASSWORD`: Service principal password or admin password

### Azure Credentials
- `AZURE_CREDENTIALS`: Azure service principal credentials in JSON format

To create Azure credentials:
```bash
az ad sp create-for-rbac \
  --name "github-actions-aks" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

## Workflow Jobs

### 1. Build Job
- Checks out code
- Determines target environment
- Builds Docker image with BuildKit
- Pushes to Azure Container Registry
- Runs Trivy security scan
- Uploads scan results to GitHub Security

### 2. Deploy Job
- Depends on successful build
- Logs into Azure
- Sets AKS context
- Creates namespace and secrets
- Deploys using Kustomize
- Verifies deployment rollout
- Displays deployment status

## Environment Variables

Update these in the workflow file:
- `ACR_NAME`: Your Azure Container Registry name
- `APP_NAME`: Your application name

Update these in each environment's kustomization:
- Cluster names and resource groups
- Namespaces
- Replica counts
- Resource limits

## Security Features

- **Trivy scanning**: Scans container images for vulnerabilities
- **SARIF upload**: Results visible in GitHub Security tab
- **Non-root containers**: Runs with security contexts
- **Image pull secrets**: Automatically created in each namespace
- **RBAC**: Uses Azure service principal with minimal permissions

## Manual Deployment

To manually trigger a deployment:
1. Go to Actions tab
2. Select "AKS CI/CD Pipeline"
3. Click "Run workflow"
4. Select target environment
5. Click "Run workflow"

## Troubleshooting

### Build Failures
- Check ACR credentials are correct
- Verify Dockerfile exists and is valid
- Check Docker build logs

### Deployment Failures
- Verify Azure credentials have AKS permissions
- Check cluster name and resource group
- Verify namespace exists or can be created
- Check Kustomize manifests are valid

### Image Pull Errors
- Verify ACR secret is created correctly
- Check ACR credentials
- Ensure AKS has network access to ACR
