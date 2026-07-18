# NakshatraVerse backend — production image
# Multi-stage not needed here (no build step; pure Node/Express), but we
# still keep the image minimal and run as a non-root user.
FROM node:20-alpine

WORKDIR /app

# Install dependencies first so this layer is cached across code changes.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

# Persistent volume mount point for the file-backed users/reports store.
# Mount a real volume here in production (see DEPLOYMENT.md) — otherwise
# data is lost whenever the container is recreated.
RUN mkdir -p /app/data && chown -R node:node /app
VOLUME ["/app/data"]
ENV DATA_DIR=/app/data
ENV NODE_ENV=production

USER node

EXPOSE 8617
CMD ["node", "server.js"]
