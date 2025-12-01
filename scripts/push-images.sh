#!/bin/bash
# =============================================================================
# Push Docker Images to Registry
# =============================================================================

set -e

# Configuration
REGISTRY=${REGISTRY:-"your-registry.com"}
TAG=${TAG:-"latest"}

echo "============================================="
echo "Pushing Smart Management UI Docker Images"
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo "============================================="

# Push Shell
echo ""
echo "🚀 Pushing Shell..."
docker push "$REGISTRY/smart-management-ui/shell:$TAG"

# Push MFE Tenant Settings
echo ""
echo "🚀 Pushing MFE Tenant Settings..."
docker push "$REGISTRY/smart-management-ui/mfe-tenant-settings:$TAG"

# Push MFE Users
echo ""
echo "🚀 Pushing MFE Users..."
docker push "$REGISTRY/smart-management-ui/mfe-users:$TAG"

echo ""
echo "============================================="
echo "✅ All images pushed successfully!"
echo "============================================="
