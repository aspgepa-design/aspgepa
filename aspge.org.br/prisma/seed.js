const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Criar associados de teste
  const associadosTeste = [
    {
      nomeCompleto: 'Administrador Teste',
      cpf: '11111111111',
      rg: '1234567',
      expeditor: 'SSP-PA',
      matricula: '001',
      cargo: 'Presidente',
      perfil: 'Presidente',
      situacao: 'Ativo',
      sexo: 'Masculino',
      whatsapp: '(91) 98765-4321',
      email: 'admin@teste.com',
      senha: await bcrypt.hash('11111111111', 10),
      dataNascimento: new Date('1980-01-01'),
      naturalidade: 'Belém',
      estadoCivil: 'Casado(a)',
      graduacao: 'Direito',
      posGraduacao: 'Direito Público',
      areaAtuacao: 'Jurídico',
      lotacao: 'Sede',
      cadastroCompleto: true,
      camposPreenchidos: 6
    },
    {
      nomeCompleto: 'Diretor Teste',
      cpf: '22222222222',
      rg: '7654321',
      expeditor: 'SSP-PA',
      matricula: '002',
      cargo: 'Diretor Sociocultural',
      perfil: 'Diretor',
      situacao: 'Ativo',
      sexo: 'Feminino',
      whatsapp: '(91) 98765-4322',
      email: 'diretor@teste.com',
      senha: await bcrypt.hash('22222222222', 10),
      dataNascimento: new Date('1985-05-15'),
      naturalidade: 'Belém',
      estadoCivil: 'Solteiro(a)',
      graduacao: 'Administração',
      areaAtuacao: 'Administrativo',
      lotacao: 'Sede',
      cadastroCompleto: true,
      camposPreenchidos: 6
    },
    {
      nomeCompleto: 'Tesoureiro Teste',
      cpf: '44444444444',
      rg: '3334445',
      expeditor: 'SSP-PA',
      matricula: '004',
      cargo: 'Analista Financeiro',
      perfil: 'Tesoureiro',
      situacao: 'Ativo',
      sexo: 'Masculino',
      whatsapp: '(91) 98765-4324',
      email: 'tesoureiro@teste.com',
      senha: await bcrypt.hash('44444444444', 10),
      dataNascimento: new Date('1982-03-10'),
      naturalidade: 'Belém',
      estadoCivil: 'Casado(a)',
      graduacao: 'Contabilidade',
      areaAtuacao: 'Financeiro',
      lotacao: 'Sede',
      cadastroCompleto: true,
      camposPreenchidos: 6
    },
    {
      nomeCompleto: 'Associado Teste',
      cpf: '33333333333',
      rg: '1112223',
      expeditor: 'SSP-PA',
      matricula: '003',
      cargo: 'Analista',
      perfil: 'Associado',
      situacao: 'Ativo',
      sexo: 'Masculino',
      whatsapp: '(91) 98765-4323',
      email: 'associado@teste.com',
      senha: await bcrypt.hash('33333333333', 10),
      dataNascimento: new Date('1990-10-20'),
      naturalidade: 'Ananindeua',
      estadoCivil: 'Solteiro(a)',
      graduacao: 'Direito',
      areaAtuacao: 'Jurídico',
      lotacao: 'Promotorias',
      cadastroCompleto: false,
      camposPreenchidos: 4
    }
  ];

  for (const associado of associadosTeste) {
    const existente = await prisma.associado.findUnique({
      where: { cpf: associado.cpf }
    });

    if (!existente) {
      await prisma.associado.create({ data: associado });
      console.log(`✅ Associado criado: ${associado.nomeCompleto} (${associado.cpf})`);
    } else {
      console.log(`⚠️  Associado já existe: ${associado.nomeCompleto}`);
    }
  }

  // Criar eventos de teste
  const eventosTeste = [
    {
      data: new Date('2026-06-15'),
      titulo: 'Assembleia Geral',
      local: 'Auditório da PGE',
      horario: '14:00',
      descricao: 'Assembleia geral ordinária para discussão de pautas importantes.',
      visivel: true
    },
    {
      data: new Date('2026-07-20'),
      titulo: 'Confraternização',
      local: 'Clube do Servidor',
      horario: '18:00',
      descricao: 'Confraternização de meio de ano para associados e familiares.',
      visivel: true
    },
    {
      data: new Date('2026-08-10'),
      titulo: 'Palestra: Direito Previdenciário',
      local: 'Sala de Reuniões 3',
      horario: '10:00',
      descricao: 'Palestra sobre atualizações no direito previdenciário.',
      visivel: true
    }
  ];

  // Limpar eventos antigos e criar novos
  await prisma.evento.deleteMany({});
  
  for (const evento of eventosTeste) {
    await prisma.evento.create({ data: evento });
    console.log(`✅ Evento criado: ${evento.titulo}`);
  }

  // Criar convênios de teste
  const conveniosTeste = [
    {
      nome: 'Academia Fitness',
      descricao: 'Desconto de 20% em planos mensais e anuais.',
      categoria: 'Saúde e Bem-estar',
      link: 'https://fitness.com',
      visivel: true
    },
    {
      nome: 'Livraria Cultura',
      descricao: '15% de desconto em livros jurídicos.',
      categoria: 'Educação',
      link: 'https://livraria.com',
      visivel: true
    },
    {
      nome: 'Restaurante Sabor',
      descricao: '10% de desconto em refeições.',
      categoria: 'Alimentação',
      link: '#',
      visivel: true
    }
  ];

  await prisma.convenio.deleteMany({});
  
  for (const convenio of conveniosTeste) {
    await prisma.convenio.create({ data: convenio });
    console.log(`✅ Convênio criado: ${convenio.nome}`);
  }

  // Criar lançamentos financeiros de teste
  const lancamentosTeste = [
    {
      data: new Date('2026-05-01'),
      descricao: 'Contribuição mensal - Maio',
      valor: 5000.00,
      tipo: 'Entrada',
      responsavel: 'Tesoureiro'
    },
    {
      data: new Date('2026-05-10'),
      descricao: 'Aluguel sede',
      valor: 1200.00,
      tipo: 'Saída',
      responsavel: 'Tesoureiro'
    },
    {
      data: new Date('2026-05-15'),
      descricao: 'Material de escritório',
      valor: 350.00,
      tipo: 'Saída',
      responsavel: 'Secretário'
    }
  ];

  await prisma.lancamento.deleteMany({});
  
  for (const lancamento of lancamentosTeste) {
    await prisma.lancamento.create({ data: lancamento });
    console.log(`✅ Lançamento criado: ${lancamento.descricao}`);
  }

  // Configuração padrão de carteirinha
  const configPadrao = {
    frame: {
      left: 5,
      top: 20,
      width: 30,
      height: 60
    },
    campos: {
      cardNome: { left: 45, top: 30, fontSize: 3.5, color: '#1e3a5f', fontWeight: 700 },
      cardMatricula: { left: 45, top: 50, fontSize: 3, color: '#333', fontWeight: 400 },
      cardCargo: { left: 45, top: 62, fontSize: 3, color: '#555', fontWeight: 400 },
      cardEmissao: { left: 45, top: 75, fontSize: 2.5, color: '#666', fontWeight: 400 },
      cardValidade: { left: 70, top: 75, fontSize: 2.5, color: '#666', fontWeight: 400 },
      cardCpf: { left: 10, top: 45, fontSize: 3, color: '#333', fontWeight: 400 },
      cardRg: { left: 10, top: 55, fontSize: 3, color: '#333', fontWeight: 400 },
      cardLblNome: { left: 45, top: 22, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'ASSOCIADO:' },
      cardLblMatricula: { left: 45, top: 44, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'MATRÍCULA:' },
      cardLblCargo: { left: 45, top: 56, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'CARGO:' },
      cardLblEmissao: { left: 45, top: 70, fontSize: 2, color: '#888', fontWeight: 400, text: 'EMISSÃO:' },
      cardLblValidade: { left: 70, top: 70, fontSize: 2, color: '#888', fontWeight: 400, text: 'VALIDADE:' },
      cardLblDadosPessoais: { left: 10, top: 20, fontSize: 3, color: '#1e3a5f', fontWeight: 700, text: 'DADOS PESSOAIS' },
      cardLblCpf: { left: 10, top: 38, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'CPF:' },
      cardLblRg: { left: 10, top: 48, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'RG:' }
    }
  };

  const configExistente = await prisma.configCarteirinha.findFirst();
  
  if (!configExistente) {
    await prisma.configCarteirinha.create({
      data: {
        config: JSON.stringify(configPadrao),
        templateFrente: null,
        templateVerso: null
      }
    });
    console.log('✅ Configuração de carteirinha padrão criada');
  } else {
    console.log('⚠️  Configuração de carteirinha já existe');
  }

  console.log('\n✨ Seed concluído com sucesso!\n');
  console.log('Credenciais de teste (CPF = senha):');
  console.log('  Presidente: 111.111.111-11 / senha: 11111111111');
  console.log('  Diretor:   222.222.222-22 / senha: 22222222222');
  console.log('  Tesoureiro: 444.444.444-44 / senha: 44444444444');
  console.log('  Associado: 333.333.333-33 / senha: 33333333333');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
