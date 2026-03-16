# ──────────────────────────────────────────────
# AgriFlow Dockerfile
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ──── Production image ────
FROM node:20-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/api.ts ./api.ts
COPY --from=build /app/db.ts ./db.ts
COPY tsconfig.json ./
RUN npm install tsx --save-dev

# Persist the SQLite database file
VOLUME ["/app/data"]
ENV DB_PATH=/app/data/farm.db
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
