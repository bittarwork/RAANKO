# API image for staging / managed PaaS (Slice 14)
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @raanko/shared build
RUN pnpm --filter @raanko/api db:generate
RUN pnpm --filter @raanko/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV ENFORCE_PLATFORM_2FA=true
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api ./apps/api
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
