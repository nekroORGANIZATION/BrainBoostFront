FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY . .

RUN npm install --force
RUN npm run build

# Етап 2: Запуск продакшен сервера
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["npm", "start"]
