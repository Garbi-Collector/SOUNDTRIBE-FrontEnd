# Etapa 1: Build Angular
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servidor Express
FROM node:18-alpine

WORKDIR /app

# Copiamos solo lo necesario
COPY --from=builder /app/dist/soundtribe-front-end ./dist/soundtribe-front-end
COPY server.js ./
COPY package*.json ./

# Instalamos solo lo que se necesita para producción (express, etc)
RUN npm install --only=production

EXPOSE 4200
CMD ["node", "server.js"]
