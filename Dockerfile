FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Instalar dependencias (prisma/ necesario antes de npm ci por postinstall)
COPY prometeo-tattoo/backend/package*.json ./
COPY prometeo-tattoo/backend/prisma ./prisma
RUN npm ci

# Copiar código fuente
COPY prometeo-tattoo/backend/ .

# Generar cliente Prisma y compilar TypeScript
RUN npx prisma generate
RUN npm run build

EXPOSE 4000

# Sincronizar el schema y luego iniciar el servidor. La base de producción
# no usa migraciones (se creó con db push), así que migrate deploy no hacía
# nada. db push solo aplica cambios aditivos: si un cambio borraría datos,
# falla (no se pasa --accept-data-loss) y el server arranca igual.
CMD ["sh", "-c", "timeout 30 npx prisma db push --skip-generate || echo '[db push] skipped or failed, continuing...'; node dist/server.js"]
