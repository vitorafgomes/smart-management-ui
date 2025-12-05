#!/bin/bash
# Smart Management UI - Kubernetes Deployment Script
# This script deploys all MFE components using Helm

set -e

# Configuration
NAMESPACE="${NAMESPACE:-smart-management}"
HELM_CHART="${HELM_CHART:-/home/vitorafgomes/WorkSpace/helm-chart/kube-deploy}"
REGISTRY="${REGISTRY:-ghcr.io/vitorafgomes/smart-management-ui}"
TAG="${1:-latest}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi

    if [ ! -d "$HELM_CHART" ]; then
        log_error "Helm chart not found at $HELM_CHART"
        exit 1
    fi

    log_info "Prerequisites check passed"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
}

# Create GHCR secret if not exists
create_ghcr_secret() {
    if kubectl get secret ghcr-secret -n $NAMESPACE &> /dev/null; then
        log_info "GHCR secret already exists"
    else
        log_warn "GHCR secret not found. Please create it manually:"
        echo "kubectl create secret docker-registry ghcr-secret \\"
        echo "  --docker-server=ghcr.io \\"
        echo "  --docker-username=YOUR_GITHUB_USERNAME \\"
        echo "  --docker-password=YOUR_GITHUB_TOKEN \\"
        echo "  -n $NAMESPACE"
    fi
}

# Deploy Shell
deploy_shell() {
    log_info "Deploying Shell..."
    helm upgrade --install smart-management-shell $HELM_CHART \
        -f $HELM_CHART/values-shell.yaml \
        -f $SCRIPT_DIR/values-shell.yaml \
        --set image.tag=$TAG \
        -n $NAMESPACE \
        --wait \
        --timeout 5m
    log_info "Shell deployed successfully"
}

# Deploy MFE Tenant Settings
deploy_mfe_tenant() {
    log_info "Deploying MFE Tenant Settings..."
    helm upgrade --install mfe-tenant-settings $HELM_CHART \
        -f $HELM_CHART/values-mfe.yaml \
        -f $SCRIPT_DIR/values-mfe.yaml \
        --set nameOverride=mfe-tenant-settings \
        --set fullnameOverride=mfe-tenant-settings \
        --set image.repository=$REGISTRY/mfe-tenant \
        --set image.tag=$TAG \
        --set "mtls.server.dnsNames[0]=mfe-tenant-settings.${NAMESPACE}.svc.cluster.local" \
        -n $NAMESPACE \
        --wait \
        --timeout 5m
    log_info "MFE Tenant Settings deployed successfully"
}

# Deploy MFE Users
deploy_mfe_users() {
    log_info "Deploying MFE Users..."
    helm upgrade --install mfe-users $HELM_CHART \
        -f $HELM_CHART/values-mfe.yaml \
        -f $SCRIPT_DIR/values-mfe.yaml \
        --set nameOverride=mfe-users \
        --set fullnameOverride=mfe-users \
        --set image.repository=$REGISTRY/mfe-users \
        --set image.tag=$TAG \
        --set "mtls.server.dnsNames[0]=mfe-users.${NAMESPACE}.svc.cluster.local" \
        -n $NAMESPACE \
        --wait \
        --timeout 5m
    log_info "MFE Users deployed successfully"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    echo ""
    echo "=== Pods ==="
    kubectl get pods -n $NAMESPACE
    echo ""
    echo "=== Services ==="
    kubectl get svc -n $NAMESPACE
    echo ""
    echo "=== HTTPRoutes ==="
    kubectl get httproutes -n $NAMESPACE 2>/dev/null || log_warn "No HTTPRoutes found"
}

# Uninstall all
uninstall_all() {
    log_warn "Uninstalling all releases..."
    helm uninstall smart-management-shell -n $NAMESPACE 2>/dev/null || true
    helm uninstall mfe-tenant-settings -n $NAMESPACE 2>/dev/null || true
    helm uninstall mfe-users -n $NAMESPACE 2>/dev/null || true
    log_info "All releases uninstalled"
}

# Main
main() {
    case "${2:-deploy}" in
        deploy)
            check_prerequisites
            create_namespace
            create_ghcr_secret
            deploy_shell
            deploy_mfe_tenant
            deploy_mfe_users
            verify_deployment
            ;;
        shell)
            check_prerequisites
            create_namespace
            deploy_shell
            ;;
        mfe-tenant)
            check_prerequisites
            create_namespace
            deploy_mfe_tenant
            ;;
        mfe-users)
            check_prerequisites
            create_namespace
            deploy_mfe_users
            ;;
        uninstall)
            uninstall_all
            ;;
        verify)
            verify_deployment
            ;;
        *)
            echo "Usage: $0 [TAG] [deploy|shell|mfe-tenant|mfe-users|uninstall|verify]"
            echo ""
            echo "Arguments:"
            echo "  TAG          Image tag (default: latest)"
            echo ""
            echo "Commands:"
            echo "  deploy       Deploy all components (default)"
            echo "  shell        Deploy only Shell"
            echo "  mfe-tenant   Deploy only MFE Tenant Settings"
            echo "  mfe-users    Deploy only MFE Users"
            echo "  uninstall    Uninstall all releases"
            echo "  verify       Verify deployment status"
            exit 1
            ;;
    esac
}

main "$@"
