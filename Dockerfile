# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

FROM base AS builder
WORKDIR /app

# NEXT_PUBLIC_* must be available at build time (inlined into client bundle)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src/styles ./src/styles

# Pre-create writable cache/catalog dirs for Next.js fetch revalidate and cost import
RUN mkdir -p /app/.next/cache /app/data && chown -R nextjs:nodejs /app/.next /app/data

# Keep the traced standalone node_modules intact. Replacing this folder with
# the deps stage can drop hashed external packages emitted by Next/Turbopack.
RUN chown -R nextjs:nodejs /app/node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
