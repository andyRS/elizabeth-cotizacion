# Cotizaciones · Elizabeth Méndez

Aplicación independiente para gestión de clientes y cotizaciones. Se puede mover o publicar como proyecto separado sin alterar el sistema administrativo original.

El negocio está configurado como taller de costura: confecciones, arreglos y prendas a medida.

## Acceso de demostración

- Define `VITE_ADMIN_USERNAME` y `VITE_ADMIN_PASSWORD` en `.env.local` para el acceso local.
- `.env.local` está excluido de Git; usa `.env.example` como referencia.

El acceso de esta fase se valida en el navegador y sirve como bloqueo básico de la interfaz; no reemplaza autenticación segura de servidor para un despliegue público. Las variables Vite terminan en el JavaScript del navegador, así que no uses esta autenticación para proteger datos sensibles ni la consideres secreta en una publicación web.

## Desarrollo

- Requisitos: Node.js 20 o superior y npm.
- Ejecutar `npm install` y `npm run dev` desde esta carpeta.
- Crear una versión de producción con `npm run build`.
- Los datos de esta fase se guardan en `localStorage`; la interfaz accede a ellos mediante `src/services/dataStore.js`, que puede sustituirse por una API sin reescribir las páginas.
- Incluye datos ficticios de demostración. En Configuración se pueden restaurar o limpiar editando el almacenamiento local del navegador.

## Estructura

`src/components` contiene piezas reutilizables, `src/pages` las pantallas, `src/services` persistencia/PDF y `src/utils` cálculos y formato.
