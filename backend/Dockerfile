# Use official Node.js LTS on Ubuntu base
FROM node:20-bullseye-slim

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Copy startup script
COPY start.sh .

# Fix Windows line endings (CRLF) -> Linux (LF) and make executable
# This prevents "exec format error" or "no such file or directory" on Linux
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

# Expose the port your app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start both NestJS API and LiveKit Agent
CMD ["./start.sh"]
