function doGet(e) {
  var pagina = e && e.parameter && e.parameter.p ? e.parameter.p : 'portal';
  
  if (pagina === 'atualizar') {
    return HtmlService.createTemplateFromFile('FormularioAtualizacao')
      .evaluate()
      .setTitle('Atualização Cadastral - ASPGE-PA')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  if (pagina === 'carteirinha') {
    return HtmlService.createTemplateFromFile('Carteirinha')
      .evaluate()
      .setTitle('Carteirinha de Associado - ASPGE-PA')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  if (pagina === 'inscricao') {
    return HtmlService.createTemplateFromFile('Formulario')
      .evaluate()
      .setTitle('Ficha de Inscrição - ASPGE-PA')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  return HtmlService.createTemplateFromFile('Portal')
    .evaluate()
    .setTitle('Portal do Associado - ASPGE-PA')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Helper para incluir arquivos HTML parciais */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Autentica associado pelo CPF e retorna dados completos + perfil/role.
 */
function autenticarPorCpf(cpfBusca) {
  var resultado = buscarAssociadoPorCpf(cpfBusca);
  if (resultado.erro) return resultado;
  
  var d = resultado.dados;
  var perfilLower = (d.perfil || '').toLowerCase();
  var role = 'associado';
  if (perfilLower.indexOf('tesourei') !== -1) role = 'tesoureiro';
  else if (perfilLower.indexOf('diretor') !== -1) role = 'diretor';
  
  resultado.dados.role = role;
  resultado.dados.status = (d.perfil || 'Associado');
  resultado.dados.iniciais = obterIniciais(d.nomeCompleto);
  return resultado;
}

function obterIniciais(nome) {
  if (!nome) return '??';
  var partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ==============================================================================
// CONSTANTES
// ==============================================================================
var PASTA_RAIZ_ID = '1A-DjVcImoxrX6iL98-dJz4U-nQbHqN8t';
var PLANILHA_ID = '1Ovqir2J_WaENRJcajgGNxGvD0mvIAuzcAoCDILvgTZ4';

// ==============================================================================
// GOOGLE DRIVE - UPLOAD DE FOTOS E DOCUMENTOS
// ==============================================================================

/**
 * Faz upload da foto 3x4 do associado para a pasta "Fotos Associados".
 * Recebe base64 do arquivo e o CPF como nome.
 */
function uploadFotoAssociado(base64Data, mimeType, cpf) {
  try {
    var pastaRaiz = DriveApp.getFolderById(PASTA_RAIZ_ID);
    var pastaFotos = pastaRaiz.getFoldersByName('Fotos Associados').next();
    
    var cpfLimpo = cpf.replace(/\D/g, '');
    var extensao = mimeType.indexOf('png') !== -1 ? '.png' : '.jpg';
    var nomeArquivo = cpfLimpo + extensao;
    
    // Remover foto antiga se existir
    var existentes = pastaFotos.getFilesByName(cpfLimpo + '.jpg');
    while (existentes.hasNext()) existentes.next().setTrashed(true);
    existentes = pastaFotos.getFilesByName(cpfLimpo + '.png');
    while (existentes.hasNext()) existentes.next().setTrashed(true);
    
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, nomeArquivo);
    var arquivo = pastaFotos.createFile(blob);
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fotoUrl = 'https://drive.google.com/thumbnail?id=' + arquivo.getId() + '&sz=w200';
    
    // Salvar URL da foto na coluna R (índice 18) da aba Associados se houver linha
    return { sucesso: true, url: fotoUrl, fileId: arquivo.getId() };
  } catch (e) {
    return { sucesso: false, erro: 'Erro no upload da foto: ' + e.toString() };
  }
}

/**
 * Salva a URL da foto na planilha (coluna R = 18).
 */
function salvarUrlFoto(linha, fotoUrl) {
  try {
    var ss = SpreadsheetApp.openById(PLANILHA_ID);
    var aba = ss.getSheetByName('Associados');
    aba.getRange(linha, 18).setValue(fotoUrl); // R = coluna 18
    return 'Foto salva.';
  } catch (e) {
    return 'Erro: ' + e.toString();
  }
}

/**
 * Faz upload de um documento do associado para "Documentos/[CPF]/".
 */
function uploadDocumento(base64Data, mimeType, nomeOriginal, cpf) {
  try {
    var pastaRaiz = DriveApp.getFolderById(PASTA_RAIZ_ID);
    var pastaDocs = pastaRaiz.getFoldersByName('Documentos').next();
    
    var cpfLimpo = cpf.replace(/\D/g, '');
    
    // Criar subpasta do associado se não existir
    var subPastas = pastaDocs.getFoldersByName(cpfLimpo);
    var pastaAssociado;
    if (subPastas.hasNext()) {
      pastaAssociado = subPastas.next();
    } else {
      pastaAssociado = pastaDocs.createFolder(cpfLimpo);
    }
    
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, nomeOriginal);
    var arquivo = pastaAssociado.createFile(blob);
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { sucesso: true, nome: nomeOriginal, fileId: arquivo.getId(), url: arquivo.getUrl() };
  } catch (e) {
    return { sucesso: false, erro: 'Erro no upload: ' + e.toString() };
  }
}

/**
 * Lista documentos de um associado (pela pasta CPF).
 */
function listarDocumentos(cpf) {
  try {
    var pastaRaiz = DriveApp.getFolderById(PASTA_RAIZ_ID);
    var pastaDocs = pastaRaiz.getFoldersByName('Documentos').next();
    var cpfLimpo = cpf.replace(/\D/g, '');
    
    var subPastas = pastaDocs.getFoldersByName(cpfLimpo);
    if (!subPastas.hasNext()) return [];
    
    var pastaAssociado = subPastas.next();
    var arquivos = pastaAssociado.getFiles();
    var lista = [];
    while (arquivos.hasNext()) {
      var arq = arquivos.next();
      lista.push({
        nome: arq.getName(),
        url: arq.getUrl(),
        tamanho: arq.getSize(),
        data: Utilities.formatDate(arq.getDateCreated(), 'America/Sao_Paulo', 'dd/MM/yyyy')
      });
    }
    return lista;
  } catch (e) {
    return [];
  }
}

/**
 * Obtém a foto do associado (busca na pasta "Fotos Associados" pelo CPF).
 */
function obterFotoAssociado(cpf) {
  try {
    var pastaRaiz = DriveApp.getFolderById(PASTA_RAIZ_ID);
    var pastaFotos = pastaRaiz.getFoldersByName('Fotos Associados').next();
    var cpfLimpo = cpf.replace(/\D/g, '');
    
    var arquivos = pastaFotos.getFiles();
    while (arquivos.hasNext()) {
      var arq = arquivos.next();
      if (arq.getName().indexOf(cpfLimpo) === 0) {
        return 'https://drive.google.com/thumbnail?id=' + arq.getId() + '&sz=w200';
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ==============================================================================
// EVENTOS
// ==============================================================================

/**
 * Retorna eventos da aba "Eventos".
 */
function obterEventos() {
  try {
    var ss = SpreadsheetApp.openById(PLANILHA_ID);
    var aba = ss.getSheetByName('Eventos');
    if (aba && aba.getLastRow() > 1) {
      var dados = aba.getDataRange().getValues();
      var lista = [];
      for (var i = 1; i < dados.length; i++) {
        var dataStr = String(dados[i][0] || '');
        lista.push({
          data: dataStr,
          titulo: String(dados[i][1] || ''),
          local: String(dados[i][2] || ''),
          horario: String(dados[i][3] || ''),
          descricao: String(dados[i][4] || '')
        });
      }
      return lista;
    }
  } catch (e) {}
  return [];
}

/**
 * Retorna dados financeiros. Lê da aba "Financeiro" se existir, senão retorna dados exemplo.
 */
function obterFinanceiro() {
  try {
    var ss = SpreadsheetApp.openById('1Ovqir2J_WaENRJcajgGNxGvD0mvIAuzcAoCDILvgTZ4');
    var aba = ss.getSheetByName('Financeiro');
    if (aba && aba.getLastRow() > 1) {
      var dados = aba.getDataRange().getValues();
      var lancamentos = [];
      var receitas = 0, despesas = 0;
      for (var i = 1; i < dados.length; i++) {
        var tipo = String(dados[i][3] || '').toLowerCase().indexOf('entrada') !== -1 ? 'entrada' : 'saida';
        var valor = parseFloat(dados[i][2]) || 0;
        if (tipo === 'entrada') receitas += valor; else despesas += valor;
        var dataCell = dados[i][0];
        var dataStr = '';
        if (dataCell instanceof Date) {
          dataStr = Utilities.formatDate(dataCell, 'America/Sao_Paulo', 'dd/MM/yyyy');
        } else {
          dataStr = String(dataCell || '');
        }
        lancamentos.push({
          linha: i + 1,
          data: dataStr,
          desc: String(dados[i][1] || ''),
          valor: valor,
          tipo: tipo,
          user: String(dados[i][4] || '')
        });
      }
      return { lancamentos: lancamentos.reverse(), receitas: receitas, despesas: despesas, saldo: receitas - despesas };
    }
  } catch (e) {}
  
  // Dados exemplo se aba não existir
  return {
    lancamentos: [
      { data: '10/01/2026', desc: 'Repasse Folha (Mensalidades)', valor: 15400, tipo: 'entrada', user: 'Auto-PGE' },
      { data: '12/01/2026', desc: 'Internet Sede - Janeiro', valor: 180, tipo: 'saida', user: 'Carlos (Tesoureiro)' },
      { data: '14/01/2026', desc: 'Manutenção Ar Condicionado', valor: 350, tipo: 'saida', user: 'Ana (Suplente)' },
      { data: '15/01/2026', desc: 'Patrocínio Evento Verão', valor: 2500, tipo: 'entrada', user: 'Carlos (Tesoureiro)' }
    ],
    receitas: 17900, despesas: 530, saldo: 48220.12
  };
}

/**
 * Salva um lançamento financeiro na aba "Financeiro".
 */
function salvarLancamento(dados) {
  try {
    var ss = SpreadsheetApp.openById(PLANILHA_ID);
    var aba = ss.getSheetByName('Financeiro');
    if (!aba) return { erro: "Aba 'Financeiro' não encontrada." };
    
    var dataFormatada = dados.data; // dd/MM/yyyy
    var partes = dataFormatada.split('/');
    var dataObj = new Date(partes[2], partes[1] - 1, partes[0]);
    
    aba.appendRow([
      dataObj,
      dados.descricao,
      parseFloat(dados.valor) || 0,
      dados.tipo, // 'Entrada' ou 'Saída'
      dados.responsavel
    ]);
    
    // Formatar célula de data e valor
    var ultima = aba.getLastRow();
    aba.getRange(ultima, 1).setNumberFormat('dd/MM/yyyy');
    aba.getRange(ultima, 3).setNumberFormat('R$ #,##0.00');
    
    return { sucesso: true };
  } catch (e) {
    return { erro: 'Erro ao salvar: ' + e.toString() };
  }
}

/**
 * Exclui um lançamento financeiro pela linha.
 */
function excluirLancamento(linha) {
  try {
    var ss = SpreadsheetApp.openById(PLANILHA_ID);
    var aba = ss.getSheetByName('Financeiro');
    if (!aba) return { erro: "Aba não encontrada." };
    if (linha < 2) return { erro: "Linha inválida." };
    aba.deleteRow(linha);
    return { sucesso: true };
  } catch (e) {
    return { erro: 'Erro: ' + e.toString() };
  }
}

/**
 * Retorna convênios. Lê da aba "Convenios" se existir, senão retorna dados exemplo.
 */
function obterConvenios() {
  try {
    var ss = SpreadsheetApp.openById('1Ovqir2J_WaENRJcajgGNxGvD0mvIAuzcAoCDILvgTZ4');
    var aba = ss.getSheetByName('Convenios');
    if (aba && aba.getLastRow() > 1) {
      var dados = aba.getDataRange().getValues();
      var lista = [];
      for (var i = 1; i < dados.length; i++) {
        lista.push({
          nome: String(dados[i][0] || ''),
          desc: String(dados[i][1] || ''),
          cat: String(dados[i][2] || ''),
          link: String(dados[i][3] || '#')
        });
      }
      return lista;
    }
  } catch (e) {}
  
  return [
    { nome: 'Academia FitPará', desc: 'Desconto de 20% em todas as mensalidades para sócios ativos.', cat: 'Saúde', link: '#' },
    { nome: 'Faculdade Conhecimento', desc: 'Bolsas de até 50% para graduação e pós-graduação.', cat: 'Educação', link: '#' },
    { nome: 'Pizzaria Ver-o-Peso', desc: 'Ganhe uma pizza doce média em qualquer pedido de pizza grande.', cat: 'Lazer', link: '#' }
  ];
}

/**
 * Retorna votações. Lê da aba "Votacoes" se existir, senão retorna dados exemplo.
 */
function obterVotacoes() {
  try {
    var ss = SpreadsheetApp.openById('1Ovqir2J_WaENRJcajgGNxGvD0mvIAuzcAoCDILvgTZ4');
    var aba = ss.getSheetByName('Votacoes');
    if (aba && aba.getLastRow() > 1) {
      var dados = aba.getDataRange().getValues();
      var lista = [];
      for (var i = 1; i < dados.length; i++) {
        lista.push({
          titulo: String(dados[i][0] || ''),
          status: String(dados[i][1] || 'Aberta'),
          fim: String(dados[i][2] || ''),
          votos: parseInt(dados[i][3]) || 0
        });
      }
      return lista;
    }
  } catch (e) {}
  
  return [
    { titulo: 'Aprovação Contas 2025', status: 'Aberta', fim: '20/01/2026', votos: 142 },
    { titulo: 'Mudança de Sede Administrativa', status: 'Encerrada', fim: '10/12/2025', votos: 210 }
  ];
}

/**
 * Busca um associado na aba "Associados" pelo CPF (coluna O, índice 14).
 * Estrutura: A=IDAssociado, B=IDContato, C=Nome do Associado, D=Perfil,
 * E=Status, F=Sexo, G=Nome, H=Endereço, I=WhatsApp, J=Email,
 * K=Obs, L=Nome sobrenome, M=Matricula Funcional, N=Cargo, O=CPF, P=RG, Q=Expeditor
 */
function buscarAssociadoPorCpf(cpfBusca) {
  var ss = SpreadsheetApp.openById('1Ovqir2J_WaENRJcajgGNxGvD0mvIAuzcAoCDILvgTZ4');
  var aba = ss.getSheetByName('Associados');
  
  if (!aba) return { erro: "Aba 'Associados' não encontrada." };

  var dados = aba.getDataRange().getValues();
  var cpfLimpo = cpfBusca.replace(/\D/g, '');
  
  for (var i = 1; i < dados.length; i++) {
    var cpfPlanilha = String(dados[i][14]).replace(/\D/g, ''); // Coluna O (índice 14)
    if (cpfPlanilha === cpfLimpo && cpfLimpo.length >= 11) {
      return {
        linha: i + 1,
        dados: {
          nomeCompleto: String(dados[i][2] || ''),   // C - Nome do Associado
          perfil: String(dados[i][3] || ''),          // D - Perfil
          sexo: String(dados[i][5] || ''),            // F - Sexo
          whatsapp: String(dados[i][8] || ''),        // I - WhatsApp
          email: String(dados[i][9] || ''),           // J - Email
          matricula: String(dados[i][12] || ''),      // M - Matricula Funcional
          cargo: String(dados[i][13] || ''),          // N - Cargo
          cpf: String(dados[i][14] || ''),            // O - CPF
          rg: String(dados[i][15] || ''),             // P - RG
          expeditor: String(dados[i][16] || ''),       // Q - Expeditor
          fotoUrl: String(dados[i][17] || '')           // R - Foto
        }
      };
    }
  }
  
  return { erro: 'CPF não encontrado na base de associados. Tente buscar pelo nome.' };
}

/**
 * Busca associados pelo nome (coluna C, índice 2).
 * Retorna lista de associados correspondentes.
 */
function buscarAssociadoPorNome(nomeBusca) {
  var ss = SpreadsheetApp.openById('1Ovqir2J_WaENRJcajgGNxGvD0mvIAuzcAoCDILvgTZ4');
  var aba = ss.getSheetByName('Associados');
  
  if (!aba) return { erro: "Aba 'Associados' não encontrada." };

  var dados = aba.getDataRange().getValues();
  var nomeLimpo = nomeBusca.trim().toUpperCase();
  var resultados = [];
  
  for (var i = 1; i < dados.length; i++) {
    var nomePlanilha = String(dados[i][2] || '').toUpperCase();
    if (nomePlanilha && nomePlanilha.indexOf(nomeLimpo) !== -1) {
      resultados.push({
        linha: i + 1,
        dados: {
          nomeCompleto: String(dados[i][2] || ''),
          perfil: String(dados[i][3] || ''),
          sexo: String(dados[i][5] || ''),
          whatsapp: String(dados[i][8] || ''),
          email: String(dados[i][9] || ''),
          matricula: String(dados[i][12] || ''),
          cargo: String(dados[i][13] || ''),
          cpf: String(dados[i][14] || ''),
          rg: String(dados[i][15] || ''),
          expeditor: String(dados[i][16] || ''),
          fotoUrl: String(dados[i][17] || '')           // R - Foto
        }
      });
    }
  }
  
  if (resultados.length === 0) {
    return { erro: 'Nenhum associado encontrado com esse nome.' };
  }
  
  return { resultados: resultados };
}

/**
 * Atualiza os dados editáveis do associado na linha especificada.
 * Campos editáveis: WhatsApp(I), Email(J), Matricula(M), Cargo(N), CPF(O), RG(P), Expeditor(Q)
 */
function atualizarAssociado(linha, dados) {
  try {
    var ss = SpreadsheetApp.openById('1Ovqir2J_WaENRJcajgGNxGvD0mvIAuzcAoCDILvgTZ4');
    var aba = ss.getSheetByName('Associados');
    
    if (!aba) return "Erro: Aba 'Associados' não encontrada.";
    if (!linha || linha < 2) return "Erro: Linha inválida.";

    // Atualiza campos individuais para não sobrescrever fórmulas/dados fixos
    if (dados.whatsapp) aba.getRange(linha, 9).setValue(dados.whatsapp);   // I - WhatsApp
    if (dados.email) aba.getRange(linha, 10).setValue(dados.email);        // J - Email
    if (dados.matricula) aba.getRange(linha, 13).setValue(dados.matricula);// M - Matricula
    if (dados.cargo) aba.getRange(linha, 14).setValue(dados.cargo);        // N - Cargo
    if (dados.cpf) aba.getRange(linha, 15).setValue(dados.cpf);            // O - CPF
    if (dados.rg) aba.getRange(linha, 16).setValue(dados.rg);              // P - RG
    if (dados.expeditor) aba.getRange(linha, 17).setValue(dados.expeditor); // Q - Expeditor
    if (dados.fotoUrl) aba.getRange(linha, 18).setValue(dados.fotoUrl);     // R - Foto
    
    return "Sucesso! Seus dados foram atualizados.";
  } catch (e) {
    return "Erro no servidor: " + e.toString();
  }
}

function salvarInscricao(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName("Inscrições");
    
    if (!aba) return "Erro: Aba 'Inscrições' não encontrada.";

    // Ordem exata conforme sua solicitação
    aba.appendRow([
      new Date(), // Carimbo de data/hora
      dados.nome,
      dados.cargo,
      dados.setor,
      dados.telefone,
      dados.nascimento,
      dados.estadoCivil,
      dados.rg,
      dados.orgao,
      dados.cpf,
      dados.endereco,
      dados.bairro,
      dados.cep,
      dados.complemento,
      dados.email
    ]);
    
    return "Sucesso! Sua ficha de inscrição foi enviada corretamente.";
  } catch (e) {
    return "Erro no servidor: " + e.toString();
  }
}

// ==============================================================================
// GESTÃO DE ASSOCIADOS (DIRETORIA)
// ==============================================================================

/**
 * Lista todos os associados da aba "Associados".
 * Retorna array com dados resumidos + flag de cadastro incompleto.
 * Restrito a perfis de diretoria (verificação feita no frontend).
 */
function listarTodosAssociados() {
  try {
    var ss = SpreadsheetApp.openById(PLANILHA_ID);
    var aba = ss.getSheetByName('Associados');
    if (!aba) return { erro: "Aba 'Associados' não encontrada." };

    var dados = aba.getDataRange().getValues();
    var lista = [];
    var camposObrigatorios = [8, 9, 12, 13, 14, 15]; // I=WhatsApp, J=Email, M=Matricula, N=Cargo, O=CPF, P=RG

    for (var i = 1; i < dados.length; i++) {
      var nome = String(dados[i][2] || '').trim();
      if (!nome) continue;

      var camposVazios = 0;
      var camposFaltando = [];
      var labels = ['WhatsApp', 'Email', 'Matrícula', 'Cargo', 'CPF', 'RG'];
      for (var j = 0; j < camposObrigatorios.length; j++) {
        var val = String(dados[i][camposObrigatorios[j]] || '').trim();
        if (!val || val.toLowerCase() === 'não') {
          camposVazios++;
          camposFaltando.push(labels[j]);
        }
      }

      lista.push({
        linha: i + 1,
        nomeCompleto: nome,
        perfil: String(dados[i][3] || ''),
        sexo: String(dados[i][5] || ''),
        whatsapp: String(dados[i][8] || ''),
        email: String(dados[i][9] || ''),
        matricula: String(dados[i][12] || ''),
        cargo: String(dados[i][13] || ''),
        cpf: String(dados[i][14] || ''),
        rg: String(dados[i][15] || ''),
        expeditor: String(dados[i][16] || ''),
        fotoUrl: String(dados[i][17] || ''),
        cadastroCompleto: camposVazios === 0,
        camposPreenchidos: 6 - camposVazios,
        totalCampos: 6,
        camposFaltando: camposFaltando
      });
    }

    return { associados: lista, total: lista.length };
  } catch (e) {
    return { erro: 'Erro ao listar associados: ' + e.toString() };
  }
}

// ==============================================================================
// SETUP INICIAL - EXECUTAR UMA VEZ para criar abas e pastas no Drive
// ==============================================================================

// ==============================================================================
// CONFIGURAÇÃO DO LAYOUT DA CARTEIRINHA
// ==============================================================================

/**
 * Salva a configuração de layout da carteirinha na aba "ConfigCarteirinha".
 * Somente o Diretor Sociocultural pode salvar.
 */
function salvarConfigCarteirinha(cpfSolicitante, configJson) {
  // Verificar permissão
  var assoc = buscarAssociadoPorCpf(cpfSolicitante);
  if (assoc.erro) return { erro: 'Usuário não encontrado.' };
  var perfil = (assoc.dados.perfil || '').toLowerCase();
  if (perfil.indexOf('sociocultural') === -1) {
    return { erro: 'Apenas o Diretor Sociocultural pode alterar o layout da carteirinha.' };
  }

  try {
    var ss = SpreadsheetApp.openById(PLANILHA_ID);
    var aba = ss.getSheetByName('ConfigCarteirinha');
    if (!aba) {
      aba = ss.insertSheet('ConfigCarteirinha');
      aba.getRange('A1:B1').setValues([['Chave', 'Valor']]);
      aba.getRange('A1:B1').setFontWeight('bold');
    }

    // Salvar JSON na célula A2/B2
    var dados = aba.getDataRange().getValues();
    var linhaConfig = -1;
    for (var i = 1; i < dados.length; i++) {
      if (dados[i][0] === 'layoutCarteirinha') { linhaConfig = i + 1; break; }
    }
    if (linhaConfig > 0) {
      aba.getRange(linhaConfig, 2).setValue(configJson);
    } else {
      aba.appendRow(['layoutCarteirinha', configJson]);
    }

    return { sucesso: true };
  } catch (e) {
    return { erro: 'Erro ao salvar: ' + e.toString() };
  }
}

/**
 * Carrega a configuração de layout da carteirinha.
 * Acessível a todos.
 */
function carregarConfigCarteirinha() {
  try {
    var ss = SpreadsheetApp.openById(PLANILHA_ID);
    var aba = ss.getSheetByName('ConfigCarteirinha');
    if (!aba) return { config: null };

    var dados = aba.getDataRange().getValues();
    for (var i = 1; i < dados.length; i++) {
      if (dados[i][0] === 'layoutCarteirinha') {
        return { config: dados[i][1] };
      }
    }
    return { config: null };
  } catch (e) {
    return { config: null };
  }
}

/**
 * Cria as abas necessárias na planilha e as pastas no Google Drive.
 * Execute manualmente pelo editor Apps Script ou via clasp run.
 */
function setupInicial() {
  var log = [];
  
  // ===== 1. CRIAR ABAS NA PLANILHA =====
  var ss = SpreadsheetApp.openById('1Ovqir2J_WaENRJcajgGNxGvD0mvIAuzcAoCDILvgTZ4');
  
  // --- Aba Financeiro ---
  if (!ss.getSheetByName('Financeiro')) {
    var abaFin = ss.insertSheet('Financeiro');
    abaFin.getRange('A1:E1').setValues([['Data', 'Descrição', 'Valor', 'Tipo', 'Responsável']]);
    abaFin.getRange('A1:E1').setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
    abaFin.setColumnWidth(1, 110);
    abaFin.setColumnWidth(2, 300);
    abaFin.setColumnWidth(3, 120);
    abaFin.setColumnWidth(4, 100);
    abaFin.setColumnWidth(5, 200);
    abaFin.setFrozenRows(1);
    // Dados exemplo
    abaFin.getRange('A2:E5').setValues([
      ['10/03/2026', 'Repasse Folha (Mensalidades)', 15400.00, 'Entrada', 'Auto-PGE'],
      ['12/03/2026', 'Internet Sede - Março', 180.00, 'Saída', 'Carlos (Tesoureiro)'],
      ['14/03/2026', 'Manutenção Ar Condicionado', 350.00, 'Saída', 'Ana (Suplente)'],
      ['15/03/2026', 'Patrocínio Evento Verão', 2500.00, 'Entrada', 'Carlos (Tesoureiro)']
    ]);
    abaFin.getRange('C2:C100').setNumberFormat('R$ #,##0.00');
    log.push('✅ Aba "Financeiro" criada com dados exemplo.');
  } else {
    log.push('⏭️ Aba "Financeiro" já existe.');
  }
  
  // --- Aba Convenios ---
  if (!ss.getSheetByName('Convenios')) {
    var abaConv = ss.insertSheet('Convenios');
    abaConv.getRange('A1:D1').setValues([['Nome', 'Descrição', 'Categoria', 'Link']]);
    abaConv.getRange('A1:D1').setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
    abaConv.setColumnWidth(1, 200);
    abaConv.setColumnWidth(2, 400);
    abaConv.setColumnWidth(3, 120);
    abaConv.setColumnWidth(4, 200);
    abaConv.setFrozenRows(1);
    abaConv.getRange('A2:D4').setValues([
      ['Academia FitPará', 'Desconto de 20% em todas as mensalidades para sócios ativos.', 'Saúde', 'fitpara.com.br'],
      ['Faculdade Conhecimento', 'Bolsas de até 50% para graduação e pós-graduação.', 'Educação', '#'],
      ['Pizzaria Ver-o-Peso', 'Ganhe uma pizza doce média em qualquer pedido de pizza grande.', 'Lazer', '#']
    ]);
    log.push('✅ Aba "Convenios" criada com dados exemplo.');
  } else {
    log.push('⏭️ Aba "Convenios" já existe.');
  }
  
  // --- Aba Votacoes ---
  if (!ss.getSheetByName('Votacoes')) {
    var abaVot = ss.insertSheet('Votacoes');
    abaVot.getRange('A1:D1').setValues([['Título', 'Status', 'Data Fim', 'Votos']]);
    abaVot.getRange('A1:D1').setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
    abaVot.setColumnWidth(1, 350);
    abaVot.setColumnWidth(2, 120);
    abaVot.setColumnWidth(3, 120);
    abaVot.setColumnWidth(4, 100);
    abaVot.setFrozenRows(1);
    abaVot.getRange('A2:D3').setValues([
      ['Aprovação Contas 2025', 'Aberta', '20/04/2026', 142],
      ['Mudança de Sede Administrativa', 'Encerrada', '10/12/2025', 210]
    ]);
    log.push('✅ Aba "Votacoes" criada com dados exemplo.');
  } else {
    log.push('⏭️ Aba "Votacoes" já existe.');
  }
  
  // --- Aba Eventos ---
  if (!ss.getSheetByName('Eventos')) {
    var abaEv = ss.insertSheet('Eventos');
    abaEv.getRange('A1:E1').setValues([['Data', 'Título', 'Local', 'Horário', 'Descrição']]);
    abaEv.getRange('A1:E1').setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
    abaEv.setColumnWidth(1, 110);
    abaEv.setColumnWidth(2, 300);
    abaEv.setColumnWidth(3, 200);
    abaEv.setColumnWidth(4, 100);
    abaEv.setColumnWidth(5, 400);
    abaEv.setFrozenRows(1);
    abaEv.getRange('A2:E3').setValues([
      ['25/04/2026', 'Assembleia Geral de Planejamento', 'Sede Social', '14:00', 'Planejamento anual da associação'],
      ['15/05/2026', 'Confraternização do Servidor', 'Restaurante Mangal', '19:00', 'Jantar comemorativo']
    ]);
    log.push('✅ Aba "Eventos" criada com dados exemplo.');
  } else {
    log.push('⏭️ Aba "Eventos" já existe.');
  }
  
  // ===== 2. CRIAR PASTAS NO GOOGLE DRIVE =====
  var pastaRaiz;
  var pastas = DriveApp.getFoldersByName('ASPGE-PA');
  if (pastas.hasNext()) {
    pastaRaiz = pastas.next();
    log.push('⏭️ Pasta raiz "ASPGE-PA" já existe.');
  } else {
    pastaRaiz = DriveApp.createFolder('ASPGE-PA');
    log.push('✅ Pasta raiz "ASPGE-PA" criada.');
  }

  var subPastas = [
    'Fotos Associados',
    'Documentos',
    'Comprovantes Financeiros',
    'Atas',
    'Convênios'
  ];
  
  for (var i = 0; i < subPastas.length; i++) {
    var nome = subPastas[i];
    var existe = pastaRaiz.getFoldersByName(nome);
    if (existe.hasNext()) {
      log.push('⏭️ Subpasta "' + nome + '" já existe.');
    } else {
      pastaRaiz.createFolder(nome);
      log.push('✅ Subpasta "' + nome + '" criada.');
    }
  }
  
  // Resumo
  log.push('');
  log.push('📁 ID da pasta raiz ASPGE-PA: ' + pastaRaiz.getId());
  log.push('📁 URL: ' + pastaRaiz.getUrl());
  log.push('');
  log.push('✅ Setup concluído!');
  
  Logger.log(log.join('\n'));
  return log.join('\n');
}