// Seed dos convênios extraídos dos PDFs oficiais (Downloads/Convenios ASPGE)
// Uso: node scripts/seed-convenios.js
// Faz upsert por nome para ser idempotente.
const prisma = require('../src/config/database');

const convenios = [
  {
    nome: 'Tudo Conveniência',
    categoria: 'Serviços',
    desconto: '10% de desconto',
    descricao: 'Desconto de 10% em qualquer compra realizada em toda a rede de lojas Tudo Conveniência, independentemente da forma de pagamento.',
    comoUsar: 'Informe no caixa que possui direito ao desconto e peça para inserir o seu CPF. A atendente liberará na tela do caixa a opção para você digitar o CPF. Com o CPF preenchido, o desconto de 10% é aplicado automaticamente.',
    condicoes: 'Válido em toda a rede de lojas Tudo Conveniência\nIndependente da forma de pagamento\nNecessário estar com a atualização cadastral em dia junto à ASPGE',
    vigencia: 'Tempo indeterminado',
    link: null,
    visivel: true
  },
  {
    nome: 'Restaurante Govinda',
    categoria: 'Alimentação',
    numeroConvenio: 'Nº 01/2026',
    desconto: '10% de desconto',
    descricao: 'Desconto especial de 10% nas refeições para consumo no local (almoço, jantar e lanchonete), de segunda a sexta-feira. Restaurante vegetariano.',
    endereco: 'Rua dos Mundurucus, 1800 - Batista Campos, Belém/PA',
    cnpj: '11.684.350/0002-11',
    comoUsar: 'Apresente sua carteirinha de associado da ASPGE no estabelecimento. A adesão pode ser realizada em qualquer filial da rede no Estado do Pará.',
    condicoes: 'Válido de segunda a sexta-feira (almoço, jantar e lanchonete)\nVálido para qualquer forma de pagamento aceita na rede\nSem limites mínimos ou máximos de compra\nVálido em todas as filiais no Estado do Pará\nNão cumulativo com outras promoções, bonificações ou descontos\nEm caso de devolução, o crédito corresponde ao valor efetivamente pago',
    vigencia: 'Tempo indeterminado',
    link: null,
    visivel: true
  },
  {
    nome: 'Açougue Carne Boa',
    categoria: 'Alimentação',
    numeroConvenio: 'Nº 03/2026',
    desconto: '5% bovinos · 7% frango',
    descricao: 'Desconto especial de 5% nos cortes bovinos e 7% nos cortes de frango, tanto no açougue quanto por delivery.',
    endereco: 'Rua São Paulo, 11 - Conjunto Marex, Val de Cans, Belém/PA - CEP 66.617-050',
    cnpj: '62.676.042/0001-02',
    comoUsar: 'Apresente sua carteirinha de associado da ASPGE no estabelecimento. A adesão pode ser realizada em qualquer filial da rede no Estado do Pará.',
    condicoes: '5% de desconto nos cortes bovinos\n7% de desconto nos cortes de frango\nVálido no açougue ou por delivery\nVálido para qualquer forma de pagamento aceita na rede\nSem limites mínimos ou máximos de compra\nVálido em todas as filiais no Estado do Pará\nNão se aplica a produtos em oferta nem a vendas na Feirinha do Produtor Rural da PGE\nNão cumulativo com outras promoções, bonificações ou descontos',
    vigencia: 'Tempo indeterminado',
    link: null,
    visivel: true
  }
];

async function main() {
  for (const c of convenios) {
    const existente = await prisma.convenio.findFirst({ where: { nome: c.nome } });
    if (existente) {
      await prisma.convenio.update({ where: { id: existente.id }, data: c });
      console.log(`Atualizado: ${c.nome} (id ${existente.id})`);
    } else {
      const novo = await prisma.convenio.create({ data: c });
      console.log(`Criado: ${c.nome} (id ${novo.id})`);
    }
  }
  console.log('Seed de convênios concluído.');
}

main()
  .catch(e => { console.error('Erro no seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
