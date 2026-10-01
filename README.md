# Cotizaciones de costura · Elizabeth Méndez

Sistema independiente para cotizar confecciones, prendas a medida y arreglos. Aplicación React/Vite, API Node/Express como Vercel Function y persistencia MongoDB Atlas.

## Importante: base de datos vacía

La API **no inserta clientes, cotizaciones ni ajustes de demostración**. Los endpoints de lectura devuelven listas vacías y los ajustes predeterminados existen solo en memoria hasta que se guarden desde Configuración. Las colecciones se poblarán únicamente cuando se creen registros reales.

## Antes de configurar Atlas

Una contraseña de Atlas fue compartida en una conversación. Cámbiala en Atlas antes de volver a usar esa cuenta. No copies la contraseña anterior a este proyecto. Genera una nueva cadena de conexión después de rotarla y guárdala solo como variable privada del servidor.

## Desarrollo local

Requisitos: Node.js 20 o superior.

1. Instala paquetes con `npm install`.
2. Abre `.env.local` (ya creado localmente y excluido de Git) y reemplaza sus placeholders usando credenciales nuevas. No pegues ningún secreto en el chat.
3. Genera el hash de la contraseña del administrador con `npm run hash:password`. El script pide la contraseña sin mostrarla. Copia el hash generado a `ADMIN_PASSWORD_HASH`.
4. Genera una clave para firmar sesiones con `npm run hash:session` y asígnala a `SESSION_SECRET`.
5. Inicia interfaz y API con `npm run dev`.

Vite sirve la aplicación en `http://localhost:5173`; las llamadas `/api` se envían al servidor local de `http://localhost:4000`.

Variables locales requeridas:

- `MONGODB_URI`: URI Atlas nueva, con contraseña URL-encoded y una base como `elizabeth_cotizaciones`.
- `ADMIN_USERNAME`: nombre de usuario del administrador.
- `ADMIN_PASSWORD_HASH`: hash bcrypt, nunca la contraseña en texto.
- `SESSION_SECRET`: secreto aleatorio largo; no lo reutilices como contraseña de Atlas.
- `NODE_ENV=development`.

## Despliegue en Vercel

1. Rota primero la contraseña de base de datos compartida anteriormente y crea/usa un usuario Atlas con privilegios mínimos para esa base.
2. Importa `andyRS/elizabeth-cotizacion` en Vercel. Usa el directorio raíz del repositorio, Framework Preset **Vite**, comando de build `npm run build` y directorio de salida `dist`. El archivo `vercel.json` conserva las rutas de React Router y deja que Vercel resuelva `/api` como función.
3. En Vercel → **Settings → Environment Variables**, define para Production (y Preview si lo deseas):
   - `MONGODB_URI`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
4. Crea el hash localmente con `npm run hash:password` y la clave de sesión con `npm run hash:session`; pega sus resultados solo en las variables privadas correspondientes de Vercel. No pongas secretos en variables `VITE_*`.
5. En Atlas, permite conectividad desde Vercel según el método de salida de red configurado para el proyecto. Atlas requiere una IP/rango permitido; las IP salientes de Vercel pueden variar según el plan. Prefiere una opción de salida estática si está disponible. Si para una demo eliges temporalmente permitir `0.0.0.0/0`, usa un usuario MongoDB con privilegios mínimos, una contraseña nueva y monitoriza el acceso; esa regla permite intentos de conexión desde cualquier IP.
6. Despliega y valida `/api/health`, el login, la creación de un cliente y una cotización. No actives datos demo.

La URI de Mongo, el hash y la clave de sesión se usan exclusivamente en la API del servidor. El navegador recibe únicamente una cookie `HttpOnly`, `SameSite=Strict` y `Secure` en producción.

## Arquitectura

- `src/pages` y `src/components`: aplicación responsive.
- `src/services/dataStore.js`: cliente de API, no acceso directo a MongoDB.
- `api/_lib/app.js`: rutas API, validación y operaciones de clientes/cotizaciones/configuración.
- `api/_lib/models.js`: esquemas Mongoose.
- `api/_lib/auth.js`: login de administrador y sesión protegida.
- `api/_lib/db.js`: conexión reutilizable a Atlas en funciones serverless.
- `src/services/pdfService.js`: generación de PDF en el navegador; el PDF no se almacena en Atlas.

Lint, compilación y dependencias: `npm run lint`, `npm run build` y `npm audit`.
