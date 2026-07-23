# Stage 1: Build the application
FROM node:21.5-alpine3.18 AS builder

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package*.json ./

RUN npm install

# Copy application source
COPY . .

# Build (Vite outputs to /app/dist)
RUN npm run build


# Stage 2: Runtime image
FROM node:21.5-alpine3.18

WORKDIR /app

# Install static file server
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/env.sh /app/env.sh

# Make entrypoint script executable
RUN chmod +x /app/env.sh

# Expose serve port
EXPOSE 3000

# Use env.sh as entrypoint to inject environment variables at runtime
ENTRYPOINT ["/app/env.sh"]
CMD ["serve", "-s", "dist", "-l", "3000"]
