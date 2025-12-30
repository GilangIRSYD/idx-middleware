#!/bin/bash
set -e

# Script untuk create tag, build, dan deploy dalam satu langkah
# Penggunaan:
#   ./release.sh 1.0.0
#   ./release.sh 1.0.0 minor
#   ./release.sh 1.0.0 major

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Error: Version required${NC}"
    echo "Usage: $0 <version> [bump_type]"
    echo ""
    echo "Examples:"
    echo "  $0 1.0.0           # Create tag v1.0.0"
    echo "  $0 1.0.0 patch     # Create tag and bump patch version"
    echo "  $0 1.0.1 minor     # Create tag and bump minor version"
    echo "  $0 2.0.0 major     # Create tag and bump major version"
    exit 1
fi

VERSION=$1
BUMP_TYPE=${2:-""}
TAG_NAME="v${VERSION}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Release Process for ${TAG_NAME}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Create git tag
echo -e "${YELLOW}Step 1: Creating git tag ${TAG_NAME}...${NC}"
git tag -a ${TAG_NAME} -m "Release version ${VERSION}"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tag ${TAG_NAME} created${NC}"
else
    echo -e "${RED}✗ Failed to create tag${NC}"
    exit 1
fi
echo ""

# Step 3: Push tag (optional - comment out if local only)
echo -e "${YELLOW}Step 2: Pushing tag to remote...${NC}"
git push origin ${TAG_NAME}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tag pushed to remote${NC}"
else
    echo -e "${YELLOW}⚠ Remote push failed (continuing...)${NC}"
fi
echo ""

# Step 4: Build Docker image
echo -e "${YELLOW}Step 3: Building Docker image...${NC}"
./build-from-tag.sh ${TAG_NAME}
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi
echo ""

# Step 5: Optional - Update package.json version
if [ -n "$BUMP_TYPE" ]; then
    echo -e "${YELLOW}Step 4: Updating package.json version...${NC}"
    if command -v bun &> /dev/null; then
        bun version ${BUMP_TYPE} --commit "${TAG_NAME}" --tag
        echo -e "${GREEN}✓ package.json updated${NC}"
    else
        echo -e "${YELLOW}⚠ bun not found, skipping package.json update${NC}"
    fi
    echo ""
fi

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  Release ${TAG_NAME} completed! ✓${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Docker images created:"
echo "  - idx-stock-api:${VERSION}"
echo "  - idx-stock-api:latest"
echo ""
echo "Next steps:"
echo "  1. Update docker-compose.yml with image: idx-stock-api:${VERSION}"
echo "  2. Run: docker-compose up -d idx-stock-api"
echo ""
