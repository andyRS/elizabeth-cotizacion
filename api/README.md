# API deployment notes

The Vercel catch-all function in `[...route].js` exports the same Express API used by the local development server. MongoDB collections are created only as real clients, quotes, or settings are first saved; no demo records are inserted.

Vercel environment variables (Production and Preview as appropriate):

- `MONGODB_URI`: the rotated Atlas connection string, stored only in Vercel's server-side environment.
- `ADMIN_USERNAME`: administrator login name.
- `ADMIN_PASSWORD_HASH`: bcrypt hash generated locally with `npm run hash:password`.
- `SESSION_SECRET`: random secret of at least 32 random bytes, generated locally and stored in Vercel.
- `MONGODB_URI`: Atlas URI for the database used by this application; it remains exclusively on the server.

Do not use any `VITE_` variable for secrets. Variables prefixed with `VITE_` are bundled into public browser code. The API sets an HttpOnly, Secure-in-production, SameSite=Strict session cookie. The browser never receives the database URI or password hash.
