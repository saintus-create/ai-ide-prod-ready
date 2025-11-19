# ---------- Builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# ---------- Runtime ----------
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 4000
CMD ["node", "dist/server.js"]