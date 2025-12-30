#!/bin/bash
set -e

# Script untuk build Docker image dari git tag
# Penggunaan:
#   1. git tag v1.0.0
#   2. git push origin v1.0.0
#   3. ./build-from-tag.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the latest git tag
if [ -z "$1" ]; then
    TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
else
    TAG=$1
fi

if [ -z "$TAG" ]; then
    echo -e "${RED}Error: No git tag found${NC}"
    echo "Usage: $0 [tag]"
    echo "Example: $0 v1.0.0"
    echo ""
    echo "Or create a tag first:"
    echo "  git tag v1.0.0"
    exit 1
fi

echo -e "${YELLOW}Current tag: ${TAG}${NC}"

# Extract version (remove 'v' prefix if exists)
VERSION=${TAG#v}

echo -e "${YELLOW}Building Docker image:${NC}"
echo "  Image: idx-stock-api"
echo "  Tags: ${VERSION}, latest"

# Build with version tag
docker build --pull -t idx-stock-api:${VERSION} -t idx-stock-api:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo ""
    echo "Images created:"
    echo "  - idx-stock-api:${VERSION}"
    echo "  - idx-stock-api:latest"
    echo ""
    echo "To run the container:"
    echo "  docker run -d -p 8000:8000 --env-file .env --name idx-stock-api idx-stock-api:${VERSION}"
    echo ""
    echo "Or use docker-compose (update your docker-compose.yml with image: idx-stock-api:${VERSION})"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
