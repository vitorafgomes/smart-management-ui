# =============================================================================
# Smart Management UI - Unified Image
# Single image containing Shell + All MFEs (Microfrontends)
# =============================================================================
# This creates ONE image with everything bundled together
# No need for separate pods/services in Kubernetes
# =============================================================================

# Stage 1: Build all applications
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build all applications (shared-auth is built first by build:all script)
RUN npm run build:all

# Stage 2: Production - Single nginx serving everything
FROM nginx:alpine AS production

# Copy custom nginx config for unified deployment
COPY docker/unified/nginx.conf /etc/nginx/nginx.conf

# Copy Shell (main application)
COPY --from=builder /app/dist/smart-admin/browser /usr/share/nginx/html

# Copy MFE Tenant Settings to /mfe-tenant/
COPY --from=builder /app/dist/mfe-tenant-settings/browser /usr/share/nginx/html/mfe-tenant

# Copy MFE Users to /mfe-users/
COPY --from=builder /app/dist/mfe-users/browser /usr/share/nginx/html/mfe-users

# Create directory for runtime config (will be mounted from ConfigMap)
# The default config.json is included, but can be overridden via ConfigMap mount
RUN mkdir -p /usr/share/nginx/html/assets/config

# Copy default config (can be overridden by ConfigMap mount at /usr/share/nginx/html/assets/config/config.json)
COPY --from=builder /app/dist/smart-admin/browser/assets/config/config.json /usr/share/nginx/html/assets/config/config.json

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Labels for Kubernetes
LABEL app="smart-management-ui" \
      component="unified" \
      description="Shell + All MFEs in single image" \
      version="1.0.0"

CMD ["nginx", "-g", "daemon off;"]
