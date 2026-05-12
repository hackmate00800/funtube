FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .

FROM node:20-alpine
WORKDIR /app
COPY --from=backend /app/server ./server
COPY --from=frontend-build /app/client/build ./client/build
COPY --from=backend /app/server/node_modules ./server/node_modules

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/index.js"]
