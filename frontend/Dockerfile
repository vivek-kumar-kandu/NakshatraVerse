# NakshatraVerse frontend — production image
# Stage 1: build the static Vite bundle.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
# VITE_* variables are baked in at build time — pass them via
# `docker build --build-arg` (see DEPLOYMENT.md) or docker-compose.yml.
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npm run build

# Stage 2: serve the built static files with a tiny web server.
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
EXPOSE 5187
CMD ["serve", "-s", "dist", "-l", "5187"]
