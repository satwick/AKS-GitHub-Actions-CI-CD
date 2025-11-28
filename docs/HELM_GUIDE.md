# Helm Usage Guide

## Overview

This repository uses a **hybrid approach** combining Kustomize and Helm:
- **Kustomize** generates environment-specific manifests
- **Helm** manages deployments with rollback capabilities

## Architecture

```
┌─────────────────┐
│ Kustomize       │
│ (base+overlays) │
└────────┬────────┘
         │ kustomize build
         ▼
┌─────────────────┐
│ Generated       │
│ Manifests       │
└────────┬────────┘
         │ helm upgrade --set-file
         ▼
┌─────────────────┐
│ Helm Release    │
│ (with history)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AKS Cluster     │
└─────────────────┘
```

## Deployment Commands

### Deploy to Development

```bash
# Generate Kustomize manifests
cd k8s/overlays/dev
kustomize build . > /tmp/dev-manifests.yaml

# Deploy with Helm
helm upgrade --install demo-api-dev ./helm-chart \
  --namespace dev \
  --create-namespace \
  --values ./helm-chart/values-dev.yaml \
  --set-file kustomizeManifests=/tmp/dev-manifests.yaml \
  --wait \
  --timeout 5m
```

### Deploy to Staging

```bash
# Generate Kustomize manifests
cd k8s/overlays/staging
kustomize build . > /tmp/staging-manifests.yaml

# Deploy with Helm
helm upgrade --install demo-api-staging ./helm-chart \
  --namespace staging \
  --create-namespace \
  --values ./helm-chart/values-staging.yaml \
  --set-file kustomizeManifests=/tmp/staging-manifests.yaml \
  --wait \
  --timeout 5m
```

### Deploy to Production

```bash
# Generate Kustomize manifests
cd k8s/overlays/prod
kustomize build . > /tmp/prod-manifests.yaml

# Deploy with Helm (with atomic rollback on failure)
helm upgrade --install demo-api-prod ./helm-chart \
  --namespace production \
  --create-namespace \
  --values ./helm-chart/values-prod.yaml \
  --set-file kustomizeManifests=/tmp/prod-manifests.yaml \
  --wait \
  --timeout 5m \
  --atomic \
  --cleanup-on-fail
```

## Rollback Procedures

### View Release History

```bash
# List all releases in a namespace
helm list --namespace dev

# View release history
helm history demo-api-dev --namespace dev
```

**Example output:**
```
REVISION  UPDATED                   STATUS      CHART           APP VERSION  DESCRIPTION
1         Mon Nov 28 10:00:00 2025  superseded  demo-api-1.0.0  1.0.0        Install complete
2         Mon Nov 28 11:00:00 2025  superseded  demo-api-1.0.0  1.0.0        Upgrade complete
3         Mon Nov 28 12:00:00 2025  deployed    demo-api-1.0.0  1.0.0        Upgrade complete
```

### Rollback to Previous Version

```bash
# Rollback to the previous revision
helm rollback demo-api-dev --namespace dev

# Verify rollback
helm status demo-api-dev --namespace dev
kubectl get pods -n dev
```

### Rollback to Specific Revision

```bash
# Rollback to revision 2
helm rollback demo-api-dev 2 --namespace dev --wait

# Check rollout status
kubectl rollout status deployment/dev-demo-api -n dev
```

### Automatic Rollback

The `--atomic` flag enables automatic rollback on failure:

```bash
helm upgrade --install demo-api-prod ./helm-chart \
  --namespace production \
  --values ./helm-chart/values-prod.yaml \
  --set-file kustomizeManifests=/tmp/prod-manifests.yaml \
  --atomic \
  --wait \
  --timeout 5m
```

If the deployment fails, Helm automatically rolls back to the previous working version.

## Release Management

### Check Release Status

```bash
# Get current release status
helm status demo-api-dev --namespace dev

# Get release values
helm get values demo-api-dev --namespace dev

# Get release manifest
helm get manifest demo-api-dev --namespace dev
```

### Uninstall Release

```bash
# Uninstall but keep history
helm uninstall demo-api-dev --namespace dev --keep-history

# Uninstall completely
helm uninstall demo-api-dev --namespace dev
```

## CI/CD Integration

The GitHub Actions workflow automatically:

1. **Builds** Kustomize manifests for the target environment
2. **Deploys** using Helm with atomic rollback enabled
3. **Verifies** deployment success
4. **Rolls back** automatically if deployment fails

### Workflow Features

- ✅ **Atomic deployments** - Auto-rollback on failure
- ✅ **Release tracking** - Full history of all deployments
- ✅ **Environment isolation** - Separate releases per environment
- ✅ **Automatic rollback job** - Triggers on deployment failure

### Manual Rollback via GitHub Actions

If you need to rollback manually:

1. Go to **Actions** tab in GitHub
2. Select the failed workflow run
3. The rollback job will have run automatically
4. Or trigger a new deployment from a previous commit

## Testing Locally

### Validate Helm Chart

```bash
# Lint the Helm chart
helm lint helm-chart/

# Dry-run installation
helm install demo-api-dev helm-chart/ \
  --namespace dev \
  --values helm-chart/values-dev.yaml \
  --set-file kustomizeManifests=/tmp/dev-manifests.yaml \
  --dry-run \
  --debug
```

### Template Rendering

```bash
# Preview what will be deployed
helm template demo-api-dev helm-chart/ \
  --namespace dev \
  --values helm-chart/values-dev.yaml \
  --set-file kustomizeManifests=/tmp/dev-manifests.yaml
```

## Troubleshooting

### Release is in Failed State

```bash
# Check release status
helm status demo-api-dev --namespace dev

# View release history
helm history demo-api-dev --namespace dev

# Rollback to last working version
helm rollback demo-api-dev --namespace dev
```

### Deployment Stuck

```bash
# Check pod status
kubectl get pods -n dev

# View pod logs
kubectl logs -l app=demo-api -n dev

# Check deployment events
kubectl describe deployment dev-demo-api -n dev

# Force rollback
helm rollback demo-api-dev --namespace dev --force --wait
```

### Clean Slate Deployment

```bash
# Uninstall current release
helm uninstall demo-api-dev --namespace dev

# Redeploy from scratch
kustomize build k8s/overlays/dev/ > /tmp/dev-manifests.yaml
helm install demo-api-dev ./helm-chart \
  --namespace dev \
  --create-namespace \
  --values ./helm-chart/values-dev.yaml \
  --set-file kustomizeManifests=/tmp/dev-manifests.yaml \
  --wait
```

## Best Practices

### 1. Always Use `--wait`
Ensures Helm waits for resources to be ready before marking deployment as successful.

### 2. Use `--atomic` for Production
Automatically rolls back on failure, preventing broken deployments.

### 3. Set Appropriate Timeouts
```bash
--timeout 5m  # Adjust based on your application startup time
```

### 4. Keep Release History
```bash
# Don't use --keep-history=false unless necessary
helm uninstall demo-api-dev --namespace dev --keep-history
```

### 5. Monitor Release History
```bash
# Regularly check release history
helm history demo-api-prod --namespace production --max 10
```

## Comparison: Before vs After

### Before (Pure Kustomize)
```bash
kubectl apply -k k8s/overlays/dev/
# ❌ No release tracking
# ❌ Manual rollback with kubectl
# ❌ No atomic deployments
```

### After (Helm + Kustomize)
```bash
helm upgrade --install demo-api-dev ./helm-chart \
  --values helm-chart/values-dev.yaml \
  --set-file kustomizeManifests=/tmp/dev-manifests.yaml \
  --atomic --wait
# ✅ Full release history
# ✅ One-command rollback
# ✅ Automatic rollback on failure
```

## Additional Resources

- [Helm Documentation](https://helm.sh/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [Helm Rollback Guide](https://helm.sh/docs/helm/helm_rollback/)
- [GitHub Actions Workflow](.github/workflows/aks-cicd.yml)
