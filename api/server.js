import dotenv from 'dotenv';
import app from './_lib/app.js';

dotenv.config({ path: '.env.local' });
const port = Number(process.env.API_PORT || 4000);
app.listen(port, () => console.log(`API local escuchando en http://localhost:${port}/api`));
