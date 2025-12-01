#!/bin/bash
# =============================================================================
# Smart Management UI - Build Unified Docker Image Locally
# =============================================================================
# Builds a single image containing Shell + All MFEs
#
# Usage:
#   ./scripts/docker-build-local.sh              # Build unified image
#   ./scripts/docker-build-local.sh --run        # Build and run
#   ./scripts/docker-build-local.sh --push PI_IP # Build and push to Raspberry Pi
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLATFORM="linux/arm64"
TAG="local"
IMAGE_NAME="smart-management-ui"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE} Smart Management UI - Unified Build${NC}"
echo -e "${BLUE} Platform: ${PLATFORM}${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Setup buildx for ARM64
echo -e "${YELLOW}🔧 Setting up Docker Buildx for ARM64...${NC}"
docker buildx create --name arm64builder --use 2>/dev/null || docker buildx use arm64builder 2>/dev/null || true

# Build the unified image
echo ""
echo -e "${YELLOW}🏗️  Building unified image: ${IMAGE_NAME}:${TAG}${NC}"
echo -e "${BLUE}   Contains: Shell + MFE Tenant Settings + MFE Users${NC}"
echo ""

docker buildx build \
    --platform ${PLATFORM} \
    --load \
    -f ./docker/unified/Dockerfile \
    -t ${IMAGE_NAME}:${TAG} \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Show image info
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN} Build Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}Image built:${NC}"
docker images | grep ${IMAGE_NAME} | grep ${TAG}

echo ""
echo -e "${BLUE}Image contents:${NC}"
echo "  📁 /              → Shell (host application)"
echo "  📁 /mfe-tenant/   → MFE Tenant Settings"
echo "  📁 /mfe-users/    → MFE Users"

# Handle arguments
case "${1}" in
    --run)
        echo ""
        echo -e "${YELLOW}🚀 Starting container...${NC}"
        docker stop ${IMAGE_NAME}-test 2>/dev/null || true
        docker rm ${IMAGE_NAME}-test 2>/dev/null || true
        docker run -d --name ${IMAGE_NAME}-test -p 4200:80 ${IMAGE_NAME}:${TAG}
        echo ""
        echo -e "${GREEN}✅ Container running at: http://localhost:4200${NC}"
        echo ""
        echo -e "${BLUE}Endpoints:${NC}"
        echo "  🌐 Shell:        http://localhost:4200/"
        echo "  🌐 MFE Tenant:   http://localhost:4200/mfe-tenant/"
        echo "  🌐 MFE Users:    http://localhost:4200/mfe-users/"
        echo "  ❤️  Health:       http://localhost:4200/health"
        echo ""
        echo -e "${BLUE}To stop:${NC} docker stop ${IMAGE_NAME}-test"
        ;;
    --push)
        PI_IP="${2}"
        if [ -z "$PI_IP" ]; then
            echo -e "${RED}❌ Please provide Raspberry Pi IP: $0 --push <IP>${NC}"
            exit 1
        fi
        echo ""
        echo -e "${YELLOW}📤 Pushing to Raspberry Pi at ${PI_IP}...${NC}"
        docker save ${IMAGE_NAME}:${TAG} | ssh pi@${PI_IP} docker load
        echo -e "${GREEN}✅ Image pushed to ${PI_IP}${NC}"
        echo ""
        echo -e "${BLUE}To run on Raspberry Pi:${NC}"
        echo "  ssh pi@${PI_IP} 'docker run -d -p 80:80 ${IMAGE_NAME}:${TAG}'"
        ;;
    *)
        echo ""
        echo -e "${BLUE}To test locally:${NC}"
        echo "  docker run -d -p 4200:80 ${IMAGE_NAME}:${TAG}"
        echo ""
        echo -e "${BLUE}To push to Raspberry Pi:${NC}"
        echo "  docker save ${IMAGE_NAME}:${TAG} | ssh pi@<raspberry-ip> docker load"
        echo ""
        echo -e "${BLUE}Or use:${NC}"
        echo "  $0 --run         # Build and run locally"
        echo "  $0 --push <IP>   # Push to Raspberry Pi"
        ;;
esac

echo ""
