# Stage 1: Build
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/browser/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV PORT=8080
EXPOSE 8080
# 👇 Sin CMD, usa el entrypoint por defecto de nginx:alpine
# que procesa /etc/nginx/templates/ antes de arrancar