# =============================================================================
# MFE Users
# Multi-stage build for Angular Native Federation Remote
# =============================================================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build shared-auth library first (dependency)
RUN npm run build:shared-auth

# Build the MFE Users
RUN npm run build:mfe-users

# Stage 2: Production
FROM nginx:alpine AS production

# Copy custom nginx config
COPY docker/mfe-users/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist/mfe-users/browser /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Labels for Kubernetes
LABEL app="smart-management-ui" \
      component="mfe-users" \
      version="1.0.0"

CMD ["nginx", "-g", "daemon off;"]
