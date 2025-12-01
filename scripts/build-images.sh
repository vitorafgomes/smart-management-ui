#!/bin/bash
# =============================================================================
# Build Docker Images for Smart Management UI
# =============================================================================

set -e

# Configuration
REGISTRY=${REGISTRY:-"your-registry.com"}
TAG=${TAG:-"latest"}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "============================================="
echo "Building Smart Management UI Docker Images"
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo "============================================="

cd "$PROJECT_ROOT"

# Build Shell
echo ""
echo "📦 Building Shell (Host)..."
docker build \
  -f docker/shell/Dockerfile \
  -t "$REGISTRY/smart-management-ui/shell:$TAG" \
  .

# Build MFE Tenant Settings
echo ""
echo "📦 Building MFE Tenant Settings..."
docker build \
  -f docker/mfe-tenant-settings/Dockerfile \
  -t "$REGISTRY/smart-management-ui/mfe-tenant-settings:$TAG" \
  .

# Build MFE Users
echo ""
echo "📦 Building MFE Users..."
docker build \
  -f docker/mfe-users/Dockerfile \
  -t "$REGISTRY/smart-management-ui/mfe-users:$TAG" \
  .

echo ""
echo "============================================="
echo "✅ All images built successfully!"
echo ""
echo "Images created:"
echo "  - $REGISTRY/smart-management-ui/shell:$TAG"
echo "  - $REGISTRY/smart-management-ui/mfe-tenant-settings:$TAG"
echo "  - $REGISTRY/smart-management-ui/mfe-users:$TAG"
echo "============================================="
