# Estado del proyecto — Prometeo Tattoo

Última actualización: 2026-10-27

## Qué es

E-commerce B2C de insumos de tatuaje. Arquitectura separada:
`backend/` (Node/Express/Prisma/PostgreSQL, deploy en **Render**) +
`frontend/` (React/Vite/React Router, deploy en **Vercel**). El README
menciona Railway como backend — está desactualizado, el backend real hoy
corre en Render (`https://prometeo-claude.onrender.com`).

## 🔴 Incidente del 23/09/2026 — el sitio estuvo caído

### Qué pasó (en orden)

1. **El frontend devolvía 404 en toda ruta que no fuera `/`** (`/shop`,
   `/login`, `/admin`, `/product/:slug`, etc.). Causa: no existía
   `prometeo-tattoo/frontend/vercel.json` con el rewrite que necesita
   cualquier SPA de React Router — sin eso, Vercel solo sirve archivos que
   existen literalmente en `dist/`, y cualquier entrada directa o recarga
   rompía. **Arreglado**: se agregó `vercel.json` con
   `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`,
   commit `149d99c`.

   ⚠️ **Ese fix quedó "Obstruido" en Vercel** (deployment status
   `failure` / "Deployment was blocked", ver Deployments en el dashboard).
   No se pudo determinar la causa exacta desde acá — no hay acceso al
   dashboard de Vercel desde este entorno. Varios deploys directos a
   `master` a lo largo del año tienen el mismo estado "Obstruido", pero
   los "Redespliegue de X" de builds viejos sí salen "Listo" — sugiere que
   el problema es específico del build/proceso de deploy automático desde
   git, no del código. **Pendiente**: revisar
   `Settings → Protección de despliegue` en Vercel y la razón exacta que
   da el deployment bloqueado más reciente.

2. **El backend estaba arriba pero no podía conectar a la base**
   (`/api/config`, `/api/categories`, `/api/auth/login` → 503 "Base de
   datos no disponible"). Causa real, confirmada probando la conexión
   directo: **el proyecto de Supabase viejo (`brukjylnxnzkxmfyhgel`)
   estaba pausado/inaccesible** — plan free de Supabase pausa proyectos
   tras ~7 días sin actividad de queries. El usuario había creado un
   **proyecto de Supabase nuevo** (`zqysohuqnzvvmkmcqyvl`) sin darse
   cuenta de que existía un botón "Restore project" para el viejo, así
   que **los datos reales anteriores (productos, categorías, clientes,
   órdenes) se perdieron** — no se pudo recuperar el proyecto viejo desde
   esta sesión.

   **Arreglado**:
   - Se corrió `prisma db push` contra el proyecto nuevo → crea las 8
     tablas (`User`, `Category`, `Product`, `Cart`, `CartItem`, `Order`,
     `OrderItem`, `StoreConfig`) a partir del schema actual de
     producción (sin las tablas de POS del PR #1, que sigue sin
     mergear).
   - Se corrió `npm run db:seed` → **datos de ejemplo**, no el catálogo
     real: 10 categorías, 25 productos de muestra, admin
     `admin@prometeo.com` / `admin123`. **Hay que reemplazar esto por el
     catálogo real** desde el panel admin, y cambiar la contraseña del
     admin.
   - `DATABASE_URL` en Render actualizado al proyecto nuevo. Primero se
     probó el pooler en modo **Transaction** (puerto 6543,
     `?pgbouncer=true`) — daba `prepared statement "sN" does not exist`
     intermitente (problema conocido de Prisma + PgBouncer transaction
     mode: cada query puede caer en un backend de Postgres físico
     distinto, y los prepared statements no sobreviven eso). Se cambió a
     modo **Session** (mismo host, **puerto 5432**, sin
     `pgbouncer=true`) — cada conexión se queda pegada a un mismo
     backend, sin ese problema. Verificado con 8 queries seguidas sin
     error.
   - Se descartó usar la conexión **directa** (`db.<ref>.supabase.co:5432`,
     sin pooler) porque esa resuelve **solo por IPv6** — riesgoso para
     Render, que no tiene garantizado el egress IPv6. El pooler
     (`*.pooler.supabase.com`) sí resuelve por IPv4.

   **`DATABASE_URL` actual en Render** (pooler, modo Session):
   ```
   postgresql://postgres.zqysohuqnzvvmkmcqyvl:***@aws-1-us-west-1.pooler.supabase.com:5432/postgres?connection_limit=1
   ```
   La contraseña real está en Render → Environment (no se repite acá).

3. **`/api/keepalive` existía en el código pero nunca se llamaba desde
   ningún lado** (sin GitHub Action, sin cron de Render, sin
   `render.yaml`) — y aunque se hubiera llamado, **no tocaba la base**,
   solo respondía "ok" del proceso. No habría evitado que Supabase se
   pausara. **Arreglado**: el endpoint ahora hace `SELECT 1` contra la
   DB, y se agregó `.github/workflows/keepalive.yml` — un cron de GitHub
   Actions que le pega cada 2 días (margen sobre la ventana de 7 días de
   Supabase). Requiere el secret `CRON_SECRET` en
   `Settings → Secrets and variables → Actions` del repo (ya cargado).

### Lección para no repetir esto

- Si Supabase muestra un proyecto **pausado**, usar el botón **"Restore
  project"** — nunca crear uno nuevo, se pierden los datos y todas las
  variables de entorno que apuntan al ref viejo quedan rotas en
  silencio (no hay ningún aviso — el síntoma es un 503 genérico bastante
  después).
- El keepalive real ahora corre solo. Si en el futuro se cambia de
  proveedor de DB o de plan, revisar si sigue haciendo falta.

## PR abierto sin mergear — Punto de venta + control de gastos

Rama `feature/pos-y-gastos`, PR #1
(https://github.com/AlexisPlescia/Prometeo_claude/pull/1), estado
`MERGEABLE`, **sin mergear** desde el 3 de septiembre. Agrega:

- Modelos `Sale`/`SaleItem`/`Expense`/`StockMovement` (no están en
  producción todavía — por eso el `db push` de hoy no las creó).
- Pantalla `/admin/pos` (punto de venta presencial, descuenta stock).
- Pantalla `/admin/expenses` (control de gastos).
- Dashboard con ganancia neta (online + mostrador − gastos).

Verificado con tests (23/23 backend, mockeados) y build, pero **nunca se
probó el flujo end-to-end contra una base real** (ver la nota en el PR).
Antes de mergear: probar a mano contra la base actual (ya en modo Session
pooler, así que el problema de prepared statements de este incidente no
debería repetirse ahí tampoco).

## Catálogo actualizado (27/10/2026)

- Precios de los 25 productos ajustados al mercado argentino (tiendas locales:
  Tomás Oberti, Amazing, Insumos Datri, Vlajec, MercadoLibre; si no hay venta
  local: precio oficial USD × dólar BNA $1.535 × 1,3 insumos / 1,8 máquinas).
- 10 productos con foto oficial de la marca; 15 siguen con picsum (joyería
  propia, Kwadron, Spirit, Stencil Stuff, Dynamic, sets Eternal, AtomX2).
- Modelos inexistentes renombrados al real: Bishop V6 → Fantom 3.5mm, Bishop
  Wand Wireless → Power Wand XLUMEN, Critical CX-2 → AtomX2, Derm Shield 4x6 →
  Sheet Pack 15x20cm. Flux Max: era máquina, no fuente (descripción corregida).
- Bishop Wand 3.5 Pen: stock 0 (no existe ese modelo). No hay campo de
  visibilidad en Product, así que sigue apareciendo como "sin stock".
- Aplicado en producción vía API admin y reflejado en `seed.ts`.
- Seed ya no tiene contraseña hardcodeada: usa `ADMIN_PASSWORD`. Nuevo script
  `npm run admin:password` para cambiarla en la base.
- Contraseña del admin cambiada en producción (27/10/2026) vía el nuevo endpoint
  `PATCH /api/auth/password` (pide token + contraseña actual). `admin123` ya no entra.

## Pendiente / próximos pasos

1. **Vercel**: entender por qué los deploys directos a `master` quedan
   "Obstruido" — revisar `Protección de despliegue` en Settings y el log
   del deployment bloqueado más reciente.
2. **Catálogo real**: reemplazar las 10 categorías / 25 productos de
   ejemplo por el catálogo real (si no hay backup del proyecto Supabase
   viejo, hay que cargarlo a mano o buscar si existe un export/backup en
   otro lado).
3. ~~Admin: cambiar la contraseña~~ — hecho el 27/10/2026.
4. **PR #1** (POS + gastos): revisar y mergear cuando se pruebe a mano.
5. **README desactualizado**: sigue diciendo que el backend va en
   Railway — en los hechos está en Render. Conviene corregirlo para que
   no confunda a la próxima persona (o sesión) que lo lea.
6. Confirmar que el keepalive nuevo corrió bien la primera vez — se
   puede disparar a mano desde
   `Actions → Keepalive → Run workflow` en GitHub, o esperar el primer
   cron automático.

## Cómo retomar

```bash
git clone https://github.com/AlexisPlescia/Prometeo_claude.git
cd Prometeo_claude/prometeo-tattoo

cd backend && cp .env.example .env   # completar con los valores reales de Render
npm install && npm run dev            # http://localhost:4000

cd ../frontend && cp .env.example .env
npm install && npm run dev            # http://localhost:5173
```

Producción: frontend en https://prometeo-claude.vercel.app,
backend en https://prometeo-claude.onrender.com — variables de entorno
reales solo en los dashboards de Vercel/Render, nunca en el repo.
