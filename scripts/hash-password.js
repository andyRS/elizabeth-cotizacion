import bcrypt from 'bcryptjs';

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('Ejecuta este script en una terminal interactiva para ingresar la contraseña de forma oculta.');
  process.exit(1);
}

const stdin = process.stdin;
const stdout = process.stdout;
let password = '';
stdout.write('Contraseña nueva (entrada oculta): ');
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

stdin.on('data', async (key) => {
  if (key === '\u0003') {
    stdout.write('\nCancelado.\n');
    process.exit(130);
  }
  if (key === '\r' || key === '\n') {
    stdin.setRawMode(false);
    stdin.pause();
    if (password.length < 12) {
      stdout.write('\nUsa una contraseña de al menos 12 caracteres.\n');
      process.exit(1);
    }
    stdout.write('\nHash bcrypt para configurar en Vercel (no es la contraseña):\n');
    stdout.write(`${await bcrypt.hash(password, 12)}\n`);
    password = '';
    process.exit(0);
  }
  if (key === '\u007f' || key === '\b') {
    password = password.slice(0, -1);
    return;
  }
  if (!key.startsWith('\u001b') && password.length < 1024) password += key;
});
