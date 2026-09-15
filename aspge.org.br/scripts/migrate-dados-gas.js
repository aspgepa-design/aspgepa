const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script de migração dos dados da planilha Google Sheets para o PostgreSQL.
 * Dados extraídos diretamente da planilha ASPGE.
 */
async function migrar() {
  console.log('=== MIGRAÇÃO DADOS GAS → NODE ===\n');

  // ===== 1. CONVÊNIOS =====
  console.log('1. Migrando Convênios...');
  const convenios = [
    { nome: 'Tudo Conveniência', descricao: '', categoria: 'Alimentação', link: '#', visivel: true }
  ];
  
  for (const c of convenios) {
    const existe = await prisma.convenio.findFirst({ where: { nome: c.nome } });
    if (!existe) {
      await prisma.convenio.create({ data: c });
      console.log(`  ✅ Convênio: ${c.nome}`);
    } else {
      console.log(`  ⏭️  Já existe: ${c.nome}`);
    }
  }

  // ===== 2. GESTÃO =====
  console.log('\n2. Migrando Gestões...');
  let gestao = await prisma.gestao.findFirst({ where: { nome: '2026/2027' } });
  if (!gestao) {
    gestao = await prisma.gestao.create({
      data: {
        nome: '2026/2027',
        inicio: new Date(2026, 0, 1),
        fim: new Date(2027, 11, 31),
        ativa: true
      }
    });
    console.log('  ✅ Gestão 2026/2027 criada e ativada');
  } else {
    // Garantir que está ativa
    await prisma.gestao.update({ where: { id: gestao.id }, data: { ativa: true } });
    console.log('  ⏭️  Gestão 2026/2027 já existe, ativada');
  }

  // ===== 3. DIRETORIA DA GESTÃO =====
  console.log('\n3. Migrando Diretoria da Gestão 2026/2027...');
  const diretoria = [
    { cpf: '161.344.002-20', nome: 'ANA CARLA BARROSO QUEIROZ', cargo: 'Secretária da Assembléia Geral' },
    { cpf: '426.204.302-91', nome: 'ARLEN ANTONIO SOEIRO DE SOUZA', cargo: 'Vice-Presidente' },
    { cpf: '152.520.002-04', nome: 'DIOGO GOMES DOS SANTOS', cargo: 'Conselho Fiscal' },
    { cpf: '636.470.602-91', nome: 'FERNANDO SARAIVA DE SOUZA FILHO', cargo: 'Tesoureiro' },
    { cpf: '037.460.562-92', nome: 'GABRIEL LOUREIRO DA SILVA', cargo: 'Conselho Fiscal' },
    { cpf: '925.035.432-00', nome: 'GISELLE ALVES GUERRA', cargo: 'Presidente' },
    { cpf: '392.292.972-91', nome: 'JURACI NERI CASTRO FILHO', cargo: 'Suplente Conselho Fiscal' },
    { cpf: '765.662.422-87', nome: 'LEON JAMES DOS SANTOS', cargo: 'Diretor Sociocultural' },
    { cpf: '012.332.822-55', nome: 'LUCIANO JUNIOR SILVA DA SILVA', cargo: 'Diretora Administrativa' },
    { cpf: '118.090.192-49', nome: 'MARIA CLARA DE AZEVEDO FONSECA', cargo: 'Presidente da Assembléia Geral' },
    { cpf: '480.666.722-68', nome: 'OTHON SODRE DE SOUSA', cargo: 'Suplente Conselho Fiscal' },
    { cpf: '696.219.932-53', nome: 'ROBERTA FERREIRA DA SILVA', cargo: 'Suplente Conselho Fiscal' },
    { cpf: '087.927.982-68', nome: 'ROSANE MARTINS MATOS', cargo: 'Conselho Fiscal' },
    { cpf: '133.521.722-34', nome: 'ROSICLEIDE TEODOZIO DE LIMA', cargo: 'Vice-presidente da Assembléia Geral' },
    { cpf: '844.054.902-44', nome: 'SANDY RODRIGUES FAIDHERB', cargo: 'Consultora Jurídica' },
    { cpf: '024.989.092-57', nome: 'TASSIO GUIMARAES SENGER', cargo: 'Secretário-Geral' }
  ];

  // Limpar diretoria existente para esta gestão
  await prisma.diretoriaGestao.deleteMany({ where: { gestaoId: gestao.id } });
  
  for (const m of diretoria) {
    await prisma.diretoriaGestao.create({
      data: {
        gestaoId: gestao.id,
        cpf: m.cpf,
        nome: m.nome,
        cargo: m.cargo
      }
    });
    console.log(`  ✅ ${m.nome} - ${m.cargo}`);
  }

  // ===== 4. ATUALIZAR PERFIS DOS ASSOCIADOS COM BASE NA DIRETORIA =====
  console.log('\n4. Atualizando perfis dos associados com base na diretoria...');
  
  // Mapeamento: cargo da gestão → perfil no sistema
  function mapearCargoParaPerfil(cargo) {
    const c = cargo.toLowerCase();
    if (c.includes('presidente') && !c.includes('vice') && !c.includes('assembl')) return 'presidente';
    if (c.includes('vice-presidente') && !c.includes('assembl')) return 'presidente';
    if (c.includes('diretor')) return 'diretor';
    if (c.includes('secretário') || c.includes('secretária') || c.includes('secretario')) return 'diretor';
    if (c.includes('tesoureiro')) return 'tesoureiro';
    if (c.includes('conselho fiscal') || c.includes('suplente')) return 'tesoureiro';
    if (c.includes('consultor')) return 'diretor';
    return null; // Manter perfil atual
  }

  // Primeiro, resetar todos para 'associado'
  await prisma.associado.updateMany({
    where: { perfil: { notIn: ['associado'] } },
    data: { perfil: 'associado' }
  });

  // Aplicar perfis da diretoria
  for (const m of diretoria) {
    const cpfLimpo = m.cpf.replace(/\D/g, '');
    const perfilNovo = mapearCargoParaPerfil(m.cargo);
    if (!perfilNovo) continue;
    
    const associado = await prisma.associado.findFirst({ where: { cpf: cpfLimpo } });
    if (associado) {
      await prisma.associado.update({
        where: { id: associado.id },
        data: { perfil: perfilNovo }
      });
      console.log(`  ✅ ${m.nome}: ${perfilNovo} (${m.cargo})`);
    } else {
      console.log(`  ⚠️  CPF não encontrado: ${m.cpf} - ${m.nome}`);
    }
  }

  // ===== 5. CONFIG CARTEIRINHA =====
  console.log('\n5. Migrando Config Carteirinha...');
  const configCarteirinha = '{"frame":{"left":3.9,"top":38.7,"width":29.5,"height":52.7},"campos":{"cardNome":{"left":36.8,"top":46.1,"fontSize":2.9,"color":"#1a1a1a","fontWeight":700},"cardMatricula":{"left":58,"top":60,"fontSize":3.1,"color":"#1a1a1a","fontWeight":700},"cardCargo":{"left":50.7,"top":66.4,"fontSize":2.8,"color":"#1a1a1a","fontWeight":700},"cardCpf":{"left":16.9,"top":40.1,"fontSize":3.2,"color":"#1a1a1a","fontWeight":700},"cardRg":{"left":15.2,"top":47,"fontSize":3.2,"color":"#1a1a1a","fontWeight":700},"cardEmissao":{"left":36.6,"top":86.1,"fontSize":2.7,"color":"#1a1a1a","fontWeight":700},"cardValidade":{"left":61,"top":86.1,"fontSize":2.7,"color":"#1a1a1a","fontWeight":700},"cardLblNome":{"left":36.6,"top":40.1,"fontSize":2.9,"color":"#1a1a1a","fontWeight":700,"text":"NOME:"},"cardLblMatricula":{"left":36.6,"top":60,"fontSize":2.9,"color":"#1a1a1a","fontWeight":700,"text":"MATRÍCULA:"},"cardLblCargo":{"left":36.6,"top":66.4,"fontSize":2.9,"color":"#1a1a1a","fontWeight":700,"text":"CARGO:"},"cardLblEmissao":{"left":36.6,"top":80.1,"fontSize":2.9,"color":"#1a1a1a","fontWeight":700,"text":"EMISSÃO:"},"cardLblValidade":{"left":61,"top":80,"fontSize":2.9,"color":"#1a1a1a","fontWeight":700,"text":"VALIDADE:"},"cardLblDadosPessoais":{"left":7.4,"top":32.4,"fontSize":3.2,"color":"#1a1a1a","fontWeight":700},"cardLblCpf":{"left":7.4,"top":40.1,"fontSize":3.2,"color":"#1a1a1a","fontWeight":700},"cardLblRg":{"left":7.7,"top":47,"fontSize":3.2,"color":"#1a1a1a","fontWeight":700}}}';
  
  const existeConfig = await prisma.configCarteirinha.findFirst();
  if (!existeConfig) {
    await prisma.configCarteirinha.create({
      data: {
        config: configCarteirinha,
        templateFrente: '1hJPJtlNu3HVgNlb0OT8AGagIy9q2A-XS',
        templateVerso: '1kmommsjL-OMWnFe85s1_G5B0V2XydobD'
      }
    });
    console.log('  ✅ Config carteirinha migrada');
  } else {
    await prisma.configCarteirinha.update({
      where: { id: existeConfig.id },
      data: {
        config: configCarteirinha,
        templateFrente: '1hJPJtlNu3HVgNlb0OT8AGagIy9q2A-XS',
        templateVerso: '1kmommsjL-OMWnFe85s1_G5B0V2XydobD'
      }
    });
    console.log('  ⏭️  Config carteirinha atualizada');
  }

  // ===== 6. RESUMO FINAL =====
  console.log('\n=== RESUMO FINAL ===');
  const totalAssoc = await prisma.associado.count();
  const totalConv = await prisma.convenio.count();
  const totalGest = await prisma.gestao.count();
  const totalDir = await prisma.diretoriaGestao.count();
  
  const perfilCount = await prisma.associado.groupBy({ by: ['perfil'], _count: true });
  
  console.log(`Associados: ${totalAssoc}`);
  console.log(`Convênios: ${totalConv}`);
  console.log(`Gestões: ${totalGest}`);
  console.log(`Membros Diretoria: ${totalDir}`);
  console.log('\nPerfis:');
  perfilCount.forEach(p => console.log(`  ${p.perfil}: ${p._count}`));
  
  console.log('\n✅ Migração concluída!');
  await prisma.$disconnect();
}

migrar().catch(e => {
  console.error('Erro na migração:', e);
  prisma.$disconnect();
});
