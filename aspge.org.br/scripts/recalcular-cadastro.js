const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CAMPOS_OBRIGATORIOS = ['whatsapp', 'email', 'matricula', 'cargo', 'cpf', 'rg'];

async function recalcular() {
  console.log('Recalculando status de cadastro de todos os associados...\n');

  const associados = await prisma.associado.findMany();
  let completos = 0;
  let pendentes = 0;

  for (const a of associados) {
    let preenchidos = 0;
    for (const campo of CAMPOS_OBRIGATORIOS) {
      const valor = a[campo];
      if (valor && valor.trim() !== '' && valor.toLowerCase() !== 'não') {
        preenchidos++;
      }
    }

    const cadastroCompleto = preenchidos === CAMPOS_OBRIGATORIOS.length;

    await prisma.associado.update({
      where: { id: a.id },
      data: {
        camposPreenchidos: preenchidos,
        cadastroCompleto: cadastroCompleto
      }
    });

    if (cadastroCompleto) completos++;
    else pendentes++;
  }

  console.log(`Total: ${associados.length}`);
  console.log(`✅ Cadastro completo: ${completos}`);
  console.log(`⚠️  Cadastro pendente: ${pendentes}`);

  await prisma.$disconnect();
}

recalcular().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
