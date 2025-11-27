# Cleanup Recommendations

## Old Files to Remove

The following original files are now superseded by the new organized structure and can be safely deleted:

```bash
# Navigate to repository root
cd /Users/satwickcherukuri/kubernetes_githubactions/AKS-GitHub-Actions-CI-CD

# Remove old manifest files (now in k8s/ directory)
rm deployment.yml
rm certsdeployment.yml
rm service.yml
rm ingress.yml
rm pdb.yml
rm values.yml
```

## Why These Can Be Removed

| File | Reason | Replacement |
|------|--------|-------------|
| `deployment.yml` | Had placeholders, port mismatches, corporate data | `k8s/base/deployment.yaml` |
| `certsdeployment.yml` | Duplicate deployment variant | Consolidated into base deployment |
| `service.yml` | Label mismatch, incorrect port | `k8s/base/service.yaml` |
| `ingress.yml` | Placeholders, Azure-specific without docs | `k8s/base/ingress.yaml` |
| `pdb.yml` | Label mismatch | `k8s/base/pdb.yaml` |
| `values.yml` | Incomplete, no environment separation | `k8s/overlays/*/kustomization.yaml` |

## Verification Before Deletion

Before removing the old files, verify the new structure works:

```bash
# Validate new manifests
kubectl apply --dry-run=client -k k8s/base/
kubectl apply --dry-run=client -k k8s/overlays/dev/
kubectl apply --dry-run=client -k k8s/overlays/staging/
kubectl apply --dry-run=client -k k8s/overlays/prod/

# Preview Kustomize output
kustomize build k8s/overlays/dev/
```

## Safe Deletion Command

```bash
# Create backup first (optional but recommended)
mkdir -p ../backup-old-manifests
cp *.yml ../backup-old-manifests/

# Remove old files
rm deployment.yml certsdeployment.yml service.yml ingress.yml pdb.yml values.yml

# Verify they're gone
ls -la *.yml 2>&1 | grep "No such file"
```

## After Cleanup

Your repository root should only contain:
- `.github/` - GitHub Actions workflows
- `k8s/` - Kubernetes manifests
- `app/` - Application code
- `docs/` - Documentation
- `Dockerfile` - Container build
- `README.md` - Main documentation
- `LICENSE` - License file
- `.gitignore` - Git ignore rules
- `.git/` - Git repository data

## Commit the Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Refactor: Reorganize repository for portfolio

- Restructure Kubernetes manifests with Kustomize
- Add multi-environment support (dev/staging/prod)
- Create sample Node.js application
- Add comprehensive documentation
- Clean up GitHub Actions workflow
- Remove old manifest files
- Add security scanning with Trivy"

# Push to repository
git push origin main  # or your default branch
```
