# ---- deps: install all dependencies (needed for the TypeScript build) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript to dist/ ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- prod-deps: install production-only dependencies ----
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runner: minimal final image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Used by transcription.service.ts to extract just the audio track from an
# uploaded Shadowing video before sending it to OpenAI — keeps the file
# well under Whisper's 25MB cap even for videos whose raw size is much
# larger (that size is almost entirely picture data, not audio).
RUN apk add --no-cache ffmpeg
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 5051
CMD ["node", "dist/src/server.js"]
