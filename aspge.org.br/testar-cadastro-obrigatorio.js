const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testar() {
  const resultados = [];
  
  function log(tipo, msg) {
    const icon = tipo === 'OK' ? '✓' : tipo === 'FALHA' ? '✗' : '?';
    console.log(`${icon} [${tipo}] ${msg}`);
    resultados.push({ tipo, msg });
  }

  console.log('=== TESTES AUTOMATIZADOS - CADASTRO OBRIGATÓRIO ===\n');

  // 1. Verificar se servidor está online
  try {
    const res = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    log('OK', 'Servidor está online');
  } catch (e) {
    log('FALHA', `Servidor não respondeu: ${e.message}`);
  }

  // 2. Testar login com CPF (senha inicial = CPF)
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      cpf: '76566242287',
      senha: '76566242287'
    });
    
    if (loginRes.data.sucesso) {
      log('OK', 'Login com CPF como senha funcionou');
      log('INFO', `cadastroCompleto: ${loginRes.data.dados.cadastroCompleto}`);
      log('INFO', `senhaAlterada: ${loginRes.data.dados.senhaAlterada}`);
      log('INFO', `precisaAtualizarCadastro: ${loginRes.data.dados.precisaAtualizarCadastro}`);
      
      const token = loginRes.data.token;
      
      // 3. Testar acesso ao perfil
      try {
        const perfilRes = await axios.get(`${BASE_URL}/api/auth/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        log('OK', 'Perfil acessível com token');
      } catch (e) {
        log('FALHA', `Perfil não acessível: ${e.response?.data?.erro || e.message}`);
      }
    } else {
      log('FALHA', 'Login retornou sucesso=false');
    }
  } catch (e) {
    log('FALHA', `Login falhou: ${e.response?.data?.erro || e.message}`);
  }

  // 4. Testar página de atualização
  try {
    const res = await axios.get(`${BASE_URL}/atualizacao`);
    if (res.data.includes('Endereço Completo')) {
      log('OK', 'Página de atualização contém seção "Endereço Completo"');
    } else {
      log('FALHA', 'Página de atualização NÃO contém seção "Endereço Completo"');
    }
    
    if (res.data.includes('Alteração de Senha')) {
      log('OK', 'Página de atualização contém seção "Alteração de Senha"');
    } else {
      log('FALHA', 'Página de atualização NÃO contém seção "Alteração de Senha"');
    }
  } catch (e) {
    log('FALHA', `Página de atualização não carregou: ${e.message}`);
  }

  // 5. Testar página de login
  try {
    const res = await axios.get(`${BASE_URL}/login`);
    if (res.data.includes('atualizacao')) {
      log('OK', 'Login page contém referência a redirecionamento para atualização');
    } else {
      log('INFO', 'Login page - verificar redirecionamento manualmente');
    }
  } catch (e) {
    log('FALHA', `Página de login não carregou: ${e.message}`);
  }

  // 6. Testar buscar associado por CPF
  try {
    const res = await axios.get(`${BASE_URL}/api/associados/cpf/765.662.422-87`);
    if (res.data.sucesso) {
      log('OK', 'Busca por CPF funcionou');
    } else {
      log('FALHA', 'Busca por CPF não retornou sucesso');
    }
  } catch (e) {
    log('FALHA', `Busca por CPF falhou: ${e.response?.data?.erro || e.message}`);
  }

  // Resumo
  console.log('\n=== RESUMO ===');
  const ok = resultados.filter(r => r.tipo === 'OK').length;
  const falhas = resultados.filter(r => r.tipo === 'FALHA').length;
  console.log(`✓ OK: ${ok}`);
  console.log(`✗ FALHAS: ${falhas}`);
  console.log(`? INFO: ${resultados.filter(r => r.tipo === 'INFO').length}`);
  
  if (falhas === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  } else {
    console.log(`\n⚠️  ${falhas} TESTE(S) FALHOU/FALHARAM - VERIFICAR`);
  }
}

testar().catch(console.error);
