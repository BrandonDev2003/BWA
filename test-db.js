import 'dotenv/config';
import prisma from './lib/prisma.js';

async function main() {
  console.log('🔍 Probando conexión a la base de datos...');

  try {
    const users = await prisma.usuario.findMany();
    console.log(`✅ Conexión exitosa. Se encontraron ${users.length} usuarios.`);
    if (users.length > 0) {
      console.log('Ejemplo del primer usuario:', users[0]);
    }
  } catch (e) {
    console.error('❌ Error al conectar con la base de datos:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
