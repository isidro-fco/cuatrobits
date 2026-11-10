# Despliegue: Supabase + Render + Vercel

| Parte | Servicio | Qué hace |
|---|---|---|
| Base de datos | **Supabase** | PostgreSQL administrado |
| Backend | **Render** | Servidor Fastify (`backend/`), configurado en `render.yaml` |
| Frontend | **Vercel** | Sitio estático de Vite (`frontend/`), configurado en `frontend/vercel.json` |

```
Navegador ──► Vercel (frontend)
    │
    └── /api/... ──► Render (backend) ──TLS──► Supabase (PostgreSQL)
```

Los tres tienen plan gratuito. Hazlo en este orden: Supabase, Render y Vercel, porque cada uno necesita
un dato del anterior.

## 0. Subir el código a GitHub

Render y Vercel despliegan desde un repositorio de GitHub (o GitLab/Bitbucket).

```bash
git add .
git commit -m "CuatroBits"
git remote add origin https://github.com/<tu-usuario>/cuatrobits.git
git push -u origin master
```

`backend/.env` está en `.gitignore`: tu contraseña local no se sube. Compruébalo con `git status`
antes del commit.

## 1. Supabase (base de datos)

1. Crea un proyecto en <https://supabase.com/dashboard>. Elige la región más cercana a tus jugadores
   y **la misma región** (o la más cercana) que usarás en Render. Guarda la contraseña de la base de datos.
2. **Cadena de conexión.** Botón **Connect** → pestaña de cadenas de conexión → **Session pooler**.
   Tiene esta forma:
   ```
   postgresql://postgres.<ref-del-proyecto>:<CONTRASEÑA>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```
   - Usa el *Session pooler* y no la *Direct connection*: la conexión directa solo funciona por IPv6 y
     Render se conecta por IPv4.
   - Si la contraseña tiene caracteres especiales (`@ # / : ? %`…), escríbela codificada, igual que en tu
     `.env` local. Para codificarla: `python3 -c "import urllib.parse; print(urllib.parse.quote(input(), safe=''))"`.
3. **Certificado.** *Project Settings* → *Database* → *SSL Configuration* → **Download certificate**.
   El backend lo usa para comprobar que se conecta al servidor real de Supabase.
4. **API de datos (recomendado).** Supabase publica las tablas en una API REST con una clave pública.
   CuatroBits no la usa: desactívala en *Project Settings* → *Data API*. Aunque la dejes activa, la
   migración `005_seguridad_supabase.sql` activa RLS en todas las tablas para que esa API no pueda leerlas
   ni modificarlas.

No hace falta crear las tablas a mano: el backend aplica las migraciones al arrancar.

> En el plan gratuito, Supabase **pausa el proyecto tras 7 días sin actividad**. Se reactiva desde el panel.

## 2. Render (backend)

1. En <https://dashboard.render.com>: **New** → **Blueprint** → elige el repositorio. Render lee
   `render.yaml` y crea el servicio `cuatrobits-api`.
2. Te pedirá las variables marcadas como secretas:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | La cadena del *Session pooler* del paso 1 |
   | `DATABASE_CA_CERT` | El contenido completo del certificado descargado, desde `-----BEGIN CERTIFICATE-----` hasta `-----END CERTIFICATE-----` |
   | `CORS_ORIGIN` | La URL de Vercel. Aún no la tienes: pon `https://cuatrobits.vercel.app` y la corriges en el paso 3 |

   Las demás ya vienen en `render.yaml`: `DATABASE_SSL=verify`, `DATABASE_POOL_MAX=5` y Node 24.
3. Al terminar el despliegue, abre `https://<tu-servicio>.onrender.com/api/health`. Debe responder
   `{"status":"ok","database":"ok"}`. En los registros (*Logs*) verás `Migraciones aplicadas: 001…005`.

Qué hace Render en cada despliegue:
- **Compilar:** `corepack pnpm install --frozen-lockfile && corepack pnpm --filter backend build`.
  `corepack` usa la versión de pnpm fijada en `package.json`.
- **Arrancar:** `node backend/dist/migrar.js && node backend/dist/servidor.js`. Primero aplica las
  migraciones pendientes; si ya están todas, no hace nada.

> El plan gratuito de Render **se duerme tras 15 minutos sin visitas** y tarda hasta un minuto en
> despertar. La primera partida guardada después de un rato puede tardar; mientras tanto el juego sigue
> funcionando y la partida queda pendiente hasta que el servidor responde.

**Si falla la conexión con la base de datos**, revisa en los registros:
- `self-signed certificate in certificate chain`: el certificado de `DATABASE_CA_CERT` está incompleto o
  no es el del proyecto. Como último recurso, `DATABASE_SSL=no-verify` cifra la conexión pero sin
  comprobar el certificado.
- `password authentication failed`: contraseña mal codificada en `DATABASE_URL`, o falta el
  `.<ref-del-proyecto>` después de `postgres` en el usuario.
- `ENETUNREACH`: estás usando la conexión directa (IPv6) en lugar del *Session pooler*.

## 3. Vercel (frontend)

1. En <https://vercel.com/new> importa el mismo repositorio.
2. **Root Directory:** `frontend`. Vercel detecta Vite; el resto de la configuración está en
   `frontend/vercel.json`.
3. **Environment Variables:**

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | La URL de Render, sin barra final: `https://<tu-servicio>.onrender.com` |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1`, para que Vercel use la versión de pnpm de `package.json` |

4. En *Settings* → *Build and Deployment* → **Node.js Version**, elige **24.x**.
5. Despliega y copia el dominio que te asigne, por ejemplo `https://cuatrobits.vercel.app`.
6. **Vuelve a Render** y pon ese dominio en `CORS_ORIGIN`. Al guardar, Render se vuelve a desplegar.
   Si quieres probar también las vistas previas de Vercel, agrega sus dominios separados por comas.

`VITE_API_URL` se incorpora al compilar: si cambias la URL de Render, vuelve a desplegar en Vercel.

## 4. Comprobar

1. Abre el dominio de Vercel, crea un perfil y anota el código secreto.
2. Juega una partida. En *Mi historial* debe decir "Todas tus partidas están guardadas en el servidor".
3. En Supabase, *Table Editor* → `games`, debe aparecer la partida.
4. En otro navegador o en modo incógnito, recupera el perfil con el nombre y el código.

## Desarrollo local

No cambia nada: `pnpm dev:backend` y `pnpm dev:frontend` siguen usando tu PostgreSQL local, sin TLS y
sin `VITE_API_URL`.

## Variables del backend

| Variable | Por defecto | Uso |
|---|---|---|
| `DATABASE_URL` | PostgreSQL local | Cadena de conexión |
| `DATABASE_SSL` | `off` | `off` · `verify` (con `DATABASE_CA_CERT`) · `no-verify` |
| `DATABASE_CA_CERT` | — | Certificado raíz PEM; acepta saltos de línea reales o escritos como `\n` |
| `DATABASE_POOL_MAX` | `5` | Conexiones simultáneas con la base de datos |
| `CORS_ORIGIN` | `http://localhost:5173` | Orígenes del frontend permitidos, separados por comas |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | Render asigna `PORT` automáticamente |
