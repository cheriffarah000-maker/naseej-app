# ---------- Stage 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first so Docker can cache this layer between code changes.
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Never run as root inside the container.
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
