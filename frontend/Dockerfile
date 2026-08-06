# ---- deps: install all dependencies (needed for the Next.js build) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: produce the standalone Next.js server bundle ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at BUILD time, not
# runtime — pass the real API URL as a build arg for non-local deployments,
# e.g. `docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api`.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:5051/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

# ---- runner: minimal final image using Next.js standalone output ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5050
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 5050
CMD ["node", "server.js"]
