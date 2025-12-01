#!/bin/bash
# =============================================================================
# Deploy to Kubernetes
# =============================================================================

set -e

# Configuration
REGISTRY=${REGISTRY:-"your-registry.com"}
TAG=${TAG:-"latest"}
NAMESPACE=${NAMESPACE:-"smart-management-ui"}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "============================================="
echo "Deploying Smart Management UI to Kubernetes"
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo "Namespace: $NAMESPACE"
echo "============================================="

cd "$PROJECT_ROOT/k8s"

# Apply with kustomize
echo ""
echo "🚀 Applying Kubernetes manifests..."
kubectl apply -k .

# Wait for deployments
echo ""
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/shell -n $NAMESPACE --timeout=120s
kubectl rollout status deployment/mfe-tenant-settings -n $NAMESPACE --timeout=120s
kubectl rollout status deployment/mfe-users -n $NAMESPACE --timeout=120s

echo ""
echo "============================================="
echo "✅ Deployment complete!"
echo ""
echo "Check status:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get svc -n $NAMESPACE"
echo "  kubectl get ingress -n $NAMESPACE"
echo "============================================="
