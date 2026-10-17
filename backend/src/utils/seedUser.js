require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

async function seed() {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password) {
    throw new Error('SEED_USER_PASSWORD é obrigatória para executar o seed.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const utilizador = await prisma.utilizador.upsert({
    where: { email: 'jose@grib.pt' },
    update: {},
    create: {
      nome: 'Jose Folha',
      email: 'jose@grib.pt',
      passwordHash,
      funcaoPadrao: 'arbitro',
    },
  });

  console.log('Utilizador criado/confirmado:', utilizador.id);
}

seed()
  .catch((e) => {
    console.error('Erro ao executar seed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => process.exit());