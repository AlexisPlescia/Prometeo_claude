FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Instalar dependencias sin correr postinstall (prisma generate necesita el schema)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copiar código fuente
COPY . .

# Generar cliente Prisma y compilar TypeScript
RUN npx prisma generate
RUN npm run build

# Exponer puerto
EXPOSE 4000

# Correr migraciones y luego iniciar el servidor
CMD ["sh", "-c", "timeout 20 npx prisma migrate deploy || echo '[migration] skipped or failed, continuing...'; node dist/server.js"]
