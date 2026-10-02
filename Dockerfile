# Multi-stage production Dockerfile for Talk With Astrologers
# Compatible with Google Cloud Run, AWS ECS, or any standard container runtime

FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install all dependencies for building
RUN npm install

# Copy application source code and configurations
COPY . .

# Compile frontend production bundle into dist/
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy dependency specifications
COPY package*.json ./

# Install runtime production dependencies and global tsx runner
RUN npm install --omit=dev && npm install -g tsx && npm cache clean --force

# Copy built frontend assets and required runtime files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose standard port
EXPOSE 3000

# Start production server
CMD ["tsx", "server.ts"]
