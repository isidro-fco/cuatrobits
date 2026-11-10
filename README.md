# CuatroBits

Aplicación web de minijuegos para niños (Conecta 4, Arma a BitBot, Ordenamiento de esferas y Memorama).
La especificación completa está en `../Documentacion/`.

> Este proyecto usa **pnpm** exclusivamente. No uses `npm`.

## Estructura

- `frontend/` — React + TypeScript + Vite + Zustand, pruebas con Vitest.
- `backend/` — Node.js + Fastify (API REST), PostgreSQL con `pg`, validación con Zod.
- `database/` — migraciones SQL y datos iniciales.

## Requisitos

- Node.js 24 o superior
- pnpm
- PostgreSQL 14 o superior

## Puesta en marcha

```bash
pnpm install
cp backend/.env.example backend/.env

# Base de datos: crea las tablas y carga los logros (se puede repetir sin riesgo)
createdb cuatrobits
pnpm --filter backend db:migrate

# Backend (puerto 3000)
pnpm dev:backend

# Frontend (puerto 5173, redirige /api al backend)
pnpm dev:frontend
```

Sin un servidor PostgreSQL instalado, usa PGlite (PostgreSQL compilado a WebAssembly) cambiando en
`backend/.env` la línea `DATABASE_URL=pglite://.data/pglite`. Los datos se guardan en `backend/.data/`.

Si el frontend debe usar un backend en otro puerto: `API_URL=http://localhost:3199 pnpm dev:frontend`.

## API

| Método | Ruta | Respuesta |
|---|---|---|
| POST | `/api/players` | `{ id?, username, avatar, token }` · 201 creado (incluye `codigoRecuperacion`, solo esta vez) · 200 reintento con el mismo `id` y `token` · 409 `username-taken` / `profile-claimed` |
| POST | `/api/players/recover` | `{ username, codigo, token }` → perfil completo e historial · 401 `invalid-recovery` · 429 `too-many-attempts` |
| POST | `/api/players/:id/recovery-code` | Código para perfiles creados antes de existir la recuperación · 409 `code-exists` |
| GET | `/api/players/:id` | Perfil con experiencia, nivel, Bits, logros y artículos |
| GET | `/api/players/:id/history?limite=&desplazamiento=` | Partidas con sus detalles, de la más reciente a la más antigua |
| GET | `/api/players/:id/stats` | Totales y resultados por juego |
| POST | `/api/games` | 201 guardada · 200 `duplicate` · 400 `validation-error` · 403 partida de otro jugador |
| POST | `/api/players/:id/items` | Compra un artículo de BitBot `{ idArticulo }` · 201 comprado · 200 `duplicate` · 409 `insufficient-bits` |
| POST | `/api/games/sync` | `{ partidas }` → `{ resultados: [{ id, estatus: created \| duplicate \| rejected }] }`, hasta 100 partidas |
| GET | `/api/health` | Estado del servidor y de la base de datos |

Todas las rutas, salvo crear, recuperar y `health`, exigen la cabecera `Authorization: Bearer <token>`
del jugador: 401 `unauthorized` sin token válido · 403 `forbidden` si el token es de otro jugador.

Los errores tienen la forma `{ error, mensaje, detalles? }`. El servidor valida cada partida (resultado
posible para el juego, estadísticas coherentes y experiencia según la tabla de la sección 9.1) y la
sincronización es idempotente: reenviar una partida no la duplica ni suma experiencia otra vez.

## Progreso y recompensas (etapa 4)

- **Experiencia:** tabla de la sección 9.1. Nivel *n* → *n+1* requiere `100 + (n − 1) · 50` XP.
- **Bits:** 2 por terminar una partida y 3 más por ganarla o completarla. Se gastan en el Taller de BitBot
  (`/taller`) en colores y accesorios que solo cambian su apariencia.
- **Logros:** se evalúan con el historial al terminar cada partida, en el navegador y otra vez en el
  servidor al registrarla; nunca se otorgan dos veces. Ganar o completar cuenta como victoria en los
  cuatro juegos, y las parejas de Memorama se suman entre partidas.
- Las reglas están duplicadas en `backend/src/models/` y `frontend/src/`; `rules.test.ts` comprueba
  que coincidan.
- **Sonido:** efectos y música chiptune sintetizados con Web Audio (sin archivos de audio). Empiezan con
  la primera interacción, como exigen los navegadores, y respetan la configuración.

## Recuperar un perfil

Al crear un perfil, el servidor genera un código secreto (por ejemplo `K7QM-4TZP`). El lobby lo muestra
una vez para que un adulto lo anote, y queda en el perfil, oculto hasta pedirlo. En otro dispositivo, o
si se borran los datos del navegador, "¿Ya tienes un perfil?" (`/recuperar`) pide el nombre y el código
y descarga el progreso, los logros, los artículos y el historial.

- El servidor guarda solo la huella del código (scrypt), nunca el código.
- Tras 5 intentos fallidos para un mismo nombre se bloquea durante 15 minutos. El límite vive en memoria
  y se reinicia con el servidor.
- Los perfiles creados antes de esta función pueden generar su código desde el perfil, una sola vez.

## Autenticación (sección 4.3)

Cada dispositivo genera un token secreto al azar (32 bytes) al crear o recuperar un perfil, lo guarda
con el perfil y lo envía en cada solicitud. El servidor guarda solo su huella SHA-256 en
`player_tokens` y comprueba que el token pertenezca al jugador cuyos datos se consultan o modifican, así
que conocer el identificador de un jugador ya no basta para enviar partidas o compras a su nombre.

- Un jugador puede tener sesión en varios dispositivos (hasta 10; al pasar el límite se descartan los
  más antiguos). Recuperar el perfil autoriza el nuevo dispositivo sin cerrar los demás.
- Los perfiles creados antes de esta función los reclama el primer dispositivo que los sincroniza. Si
  otro dispositivo ya lo protegió, el perfil avisa que hay que recuperarlo con el código secreto y sus
  partidas quedan pendientes hasta entonces.
- Si el servidor deja de reconocer el token (por ejemplo, porque se reinició la base de datos), el
  dispositivo vuelve a registrar el perfil con su mismo token, una sola vez.

Después de actualizar el código, aplica las migraciones nuevas con `pnpm --filter backend db:migrate`.

## Despliegue

Supabase (PostgreSQL), Render (backend) y Vercel (frontend): pasos en [DESPLIEGUE.md](DESPLIEGUE.md).
La configuración está en `render.yaml` y `frontend/vercel.json`.

## Pruebas y compilación

```bash
pnpm test
pnpm build
```
