# AKS GitHub Actions CI/CD Pipeline

> **A production-ready Kubernetes deployment pipeline showcasing DevOps best practices with Azure Kubernetes Service (AKS) and GitHub Actions**

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-AKS-326CE5?logo=kubernetes&logoColor=white)](https://azure.microsoft.com/en-us/services/kubernetes-service/)
[![Docker](https://img.shields.io/badge/Docker-ACR-2496ED?logo=docker&logoColor=white)](https://azure.microsoft.com/en-us/services/container-registry/)

## 📋 Overview

This repository demonstrates a complete CI/CD pipeline for deploying containerized applications to Azure Kubernetes Service (AKS) using GitHub Actions. It showcases modern DevOps practices including infrastructure as code, automated testing, security scanning, and multi-environment deployments.

### Key Features

✅ **Automated CI/CD** - GitHub Actions workflow with build, test, and deploy stages  
✅ **Multi-Environment** - Separate configurations for dev, staging, and production  
✅ **Security First** - Container vulnerability scanning with Trivy  
✅ **Infrastructure as Code** - Kubernetes manifests managed with Kustomize  
✅ **High Availability** - Pod anti-affinity, PodDisruptionBudget, and health checks  
✅ **Production Ready** - Resource limits, security contexts, and monitoring hooks  

## 🏗️ Architecture

![Architecture Diagram](docs/images/architecture.png)

The pipeline follows a GitOps approach where infrastructure and application code are version-controlled together. Each push triggers an automated workflow that builds, scans, and deploys to the appropriate environment.

**[📖 Detailed Architecture Documentation](docs/architecture.md)**

## 🚀 Quick Start

### Prerequisites

- Azure subscription with AKS cluster
- Azure Container Registry (ACR)
- GitHub repository with Actions enabled
- `kubectl` and `kustomize` installed locally (for testing)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/AKS-GitHub-Actions-CI-CD.git
cd AKS-GitHub-Actions-CI-CD
```

### 2. Configure Azure Resources

Create an Azure service principal for GitHub Actions:

```bash
az ad sp create-for-rbac \
  --name "github-actions-aks" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

### 3. Set GitHub Secrets

Configure the following secrets in your GitHub repository settings:

| Secret Name | Description |
|------------|-------------|
| `AZURE_CREDENTIALS` | Azure service principal credentials (JSON output from above) |
| `ACR_USERNAME` | Azure Container Registry username |
| `ACR_PASSWORD` | Azure Container Registry password |

### 4. Update Configuration

Edit `.github/workflows/aks-cicd.yml` and update:
- `ACR_NAME`: Your Azure Container Registry name
- Cluster names and resource groups for each environment

Edit `k8s/overlays/*/kustomization.yaml` files to match your environment names and configurations.

### 5. Deploy

Push to the appropriate branch to trigger deployment:

```bash
git checkout -b develop
git push origin develop  # Deploys to dev environment
```

## 📁 Repository Structure

```
.
├── .github/
│   └── workflows/
│       ├── aks-cicd.yml          # Main CI/CD workflow
│       └── README.md             # Workflow documentation
├── k8s/
│   ├── base/                     # Base Kubernetes manifests
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   ├── pdb.yaml
│   │   └── kustomization.yaml
│   └── overlays/                 # Environment-specific overlays
│       ├── dev/
│       ├── staging/
│       └── prod/
├── app/                          # Sample Node.js application
│   ├── src/
│   │   └── index.js
│   └── package.json
├── docs/                         # Documentation
│   ├── architecture.md
│   └── images/
├── Dockerfile                    # Multi-stage Docker build
└── README.md
```

## 🔄 CI/CD Pipeline

### Workflow Stages

1. **Build**
   - Checkout source code
   - Build Docker image with BuildKit
   - Tag with environment and commit SHA
   - Push to Azure Container Registry
   - Run Trivy security scan

2. **Deploy**
   - Authenticate with Azure
   - Set AKS cluster context
   - Apply Kustomize manifests
   - Verify deployment rollout
   - Display deployment status

### Environment Strategy

| Branch | Environment | Replicas | Resources |
|--------|------------|----------|-----------|
| `develop` | Development | 2 | 256Mi / 100m CPU |
| `staging` | Staging | 3 | 512Mi / 250m CPU |
| `main` | Production | 5 | 1Gi / 500m CPU |

**[📖 Workflow Documentation](.github/workflows/README.md)**

## 🔒 Security Features

- **Container Scanning**: Trivy scans for vulnerabilities before deployment
- **Non-Root Containers**: All containers run as non-root users
- **Security Contexts**: Dropped capabilities and read-only filesystems
- **Network Policies**: Namespace isolation (can be added)
- **RBAC**: Role-based access control for AKS resources
- **Secrets Management**: Kubernetes secrets for sensitive data

## 🛠️ Technology Stack

- **Container Orchestration**: Azure Kubernetes Service (AKS)
- **Container Registry**: Azure Container Registry (ACR)
- **CI/CD**: GitHub Actions
- **IaC Tool**: Kustomize
- **Security Scanning**: Trivy
- **Ingress Controller**: Azure Application Gateway
- **Application**: Node.js Express API

## 📊 Kubernetes Resources

### Deployment
- Rolling update strategy
- Pod anti-affinity for distribution across nodes
- Liveness and readiness probes
- Resource requests and limits
- Security contexts

### Service
- ClusterIP type for internal communication
- Label selectors matching deployment
- Port mapping (80 → 8080)

### Ingress
- Azure Application Gateway integration
- SSL/TLS termination
- Health probe configuration
- Path-based routing

### PodDisruptionBudget
- Ensures minimum pod availability
- Protects against simultaneous terminations
- Critical for production stability

## 🧪 Testing Locally

### Build and run the application locally:

```bash
cd app
npm install
npm start
```

### Test with Docker:

```bash
docker build -t demo-api:local .
docker run -p 8080:8080 demo-api:local
```

### Validate Kubernetes manifests:

```bash
# Validate base manifests
kubectl apply --dry-run=client -k k8s/base/

# Validate environment overlay
kubectl apply --dry-run=client -k k8s/overlays/dev/
```

### Preview Kustomize output:

```bash
kustomize build k8s/overlays/dev/
```

## 📈 Monitoring and Observability

### Health Endpoints

- **Liveness**: `GET /health/live` - Container is alive
- **Readiness**: `GET /health/ready` - Container is ready for traffic

### Recommended Monitoring Tools

- **Azure Monitor**: Container insights and metrics
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Application Insights**: APM and distributed tracing

## 🔧 Troubleshooting

### Common Issues

**Image Pull Errors**
```bash
# Verify ACR secret exists
kubectl get secret acr-secret -n <namespace>

# Recreate if needed
kubectl create secret docker-registry acr-secret \
  --docker-server=<acr-name>.azurecr.io \
  --docker-username=<username> \
  --docker-password=<password> \
  --namespace=<namespace>
```

**Pod Not Starting**
```bash
# Check pod status
kubectl get pods -n <namespace>

# View pod logs
kubectl logs <pod-name> -n <namespace>

# Describe pod for events
kubectl describe pod <pod-name> -n <namespace>
```

**Deployment Rollout Failed**
```bash
# Check rollout status
kubectl rollout status deployment/<deployment-name> -n <namespace>

# View deployment events
kubectl describe deployment/<deployment-name> -n <namespace>

# Rollback if needed
kubectl rollout undo deployment/<deployment-name> -n <namespace>
```

## 🚀 Future Enhancements

- [ ] Implement Horizontal Pod Autoscaler (HPA)
- [ ] Add Cluster Autoscaler configuration
- [ ] Integrate Azure Key Vault for secrets
- [ ] Implement GitOps with ArgoCD or Flux
- [ ] Add service mesh (Istio/Linkerd)
- [ ] Implement canary deployments
- [ ] Add comprehensive monitoring dashboards
- [ ] Multi-region deployment strategy

## 📚 Additional Resources

- [Azure Kubernetes Service Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Kustomize Documentation](https://kustomize.io/)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is a portfolio project, but suggestions and improvements are welcome! Feel free to open an issue or submit a pull request.

---

**Built with ❤️ to showcase DevOps and Kubernetes expertise**
