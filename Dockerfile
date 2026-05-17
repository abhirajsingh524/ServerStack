# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build React frontend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend-react

COPY frontend-react/package*.json ./
RUN npm ci

COPY frontend-react/ ./
RUN npm run build
# Output: /app/frontend-react/../frontend-dist  (vite.config.js outDir: ../frontend-dist)

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Install backend production dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: Final production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy backend dependencies
COPY --from=backend-builder /app/node_modules ./node_modules

# Copy backend source
COPY src/ ./src/
COPY package.json ./

# Copy built React frontend from stage 1
COPY --from=frontend-builder /app/frontend-dist ./frontend-dist

# Create required runtime directories
RUN mkdir -p uploads src/logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "src/app.js"]
