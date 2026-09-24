# syntax=docker/dockerfile:1
FROM node:20-slim

# Dependências do Puppeteer (Chromium headless) e do Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    chromium fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 \
    libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Usa o Chromium do sistema em vez de baixar um
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

# Instala dependências (aproveita cache de camadas)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Código-fonte
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Porta da aplicação
EXPOSE 3000

# Sobe aplicando migrations pendentes e inicia o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
