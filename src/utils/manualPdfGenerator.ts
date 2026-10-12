import jsPDF from 'jspdf';
import { CompanySettings } from '../types';
import { formatDateBR } from './storage';

/**
 * Helper to add header on every page
 */
function drawManualHeader(
  doc: jsPDF,
  company: CompanySettings | undefined,
  manualTitle: string,
  badgeText: string,
  badgeColor: [number, number, number] = [2, 132, 199] // rgb default cyan/blue
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text((company?.tradeName || company?.name || 'VigiaOS').toUpperCase(), 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    `CNPJ: ${company?.cnpj || '11.601.831/0001-35'} • Tel/WhatsApp: ${company?.phone || company?.whatsapp || '(21) 99723-2764'}`,
    14,
    18
  );
  doc.text(
    `${company?.address || 'Rio de Janeiro - RJ'} • ${company?.email || 'contato@empresa.com'}`,
    14,
    23
  );

  // Manual Badge
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(pageWidth - 78, 6, 64, 15, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(badgeText.toUpperCase(), pageWidth - 76, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('MANUAL OFICIAL VIGIAOS', pageWidth - 76, 17);
}

/**
 * Helper to add footer on every page
 */
function drawManualFooter(doc: jsPDF, pageNum: number, totalPagesPlaceholder: string = '') {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Documento de Treinamento e Procedimento Padrão • VigiaOS • Emitido em ${new Date().toLocaleDateString('pt-BR')}`,
    14,
    pageHeight - 7
  );

  const pageStr = totalPagesPlaceholder ? `Página ${pageNum} de ${totalPagesPlaceholder}` : `Página ${pageNum}`;
  doc.text(pageStr, pageWidth - 14, pageHeight - 7, { align: 'right' });
}

/**
 * Helper to print section titles and content with automatic page breaks
 */
function checkPageBreak(
  doc: jsPDF,
  currentY: number,
  neededHeight: number,
  company: CompanySettings | undefined,
  manualTitle: string,
  badgeText: string,
  badgeColor: [number, number, number],
  pageState: { page: number }
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededHeight > pageHeight - 18) {
    doc.addPage();
    pageState.page += 1;
    drawManualHeader(doc, company, manualTitle, badgeText, badgeColor);
    return 36;
  }
  return currentY;
}

/**
 * --------------------------------------------------------------------------
 * 1. MANUAL DO ADMINISTRADOR / DONO DA EMPRESA (PDF)
 * --------------------------------------------------------------------------
 */
export function downloadAdminManualPDF(company?: CompanySettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageState = { page: 1 };
  const badgeColor: [number, number, number] = [8, 145, 178]; // cyan-600
  const manualTitle = 'Manual do Administrador & Gestor';

  drawManualHeader(doc, company, manualTitle, 'Guia do Administrador', badgeColor);

  let y = 36;

  // Capa / Box de Introdução
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MANUAL DE GESTÃO OPERACIONAL E ADMINISTRATIVA', 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Guia completo para o Dono e Administrador da empresa de segurança eletrônica e telecomunicações.',
    18,
    y + 14
  );
  doc.text(
    'Controle de chamados, técnicos em campo, faturamento Pix/Boleto, GPS e liberação de manuais aos colaboradores.',
    18,
    y + 20
  );

  y += 32;

  const sections = [
    {
      title: '1. VISÃO GERAL & PERFIS DE ACESSO DO SISTEMA',
      items: [
        'O VigiaOS opera com isolamento multi-tenant seguro e 4 perfis operacionais:',
        '• Administrador (Dono): Acesso irrestrito a todos os módulos, configurações da empresa, finanças e senhas.',
        '• Supervisor: Delegação operacional para criar O.S, alterar técnicos de chamados, orçamentos e cadastros.',
        '• Financeiro: Acesso estrito ao módulo de caixa, emissão de Pix, boletos, contas a pagar e comissões.',
        '• Técnico em Campo: Acesso simplificado e veloz via celular, focado em fotos, laudo e assinatura digital.',
      ],
      tip: 'Dica do Dono: Você pode criar operadores e técnicos individuais com senhas próprias para auditar ações.',
    },
    {
      title: '2. GESTÃO E DESPACHO DE ORDENS DE SERVIÇO (O.S)',
      items: [
        '• Criação de O.S: Defina o tipo (Instalação, Manutenção Preventiva/Corretiva, Emergencial) e prioridade.',
        '• Atribuição de Técnicos: Aloque um ou múltiplos técnicos para atender o chamado simultaneamente.',
        '• Despacho Instantâneo no WhatsApp: Com 1 clique no botão "Encaminhar", envie os detalhes completos do chamado para o WhatsApp do técnico (endereço, cliente, telefone e escopo técnico).',
        '• Acompanhamento de Ciclo: Monitore o status em tempo real: Aberta -> Em Deslocamento -> Em Execução -> Concluída.',
      ],
      tip: 'A O.S só é finalizada quando o laudo for preenchido e as evidências fotográficas forem anexadas.',
    },
    {
      title: '3. MONITORAMENTO EM TEMPO REAL VIA GPS (RASTREAMENTO DE CAMPO)',
      items: [
        '• Ativação Automática: Quando o técnico inicia o deslocamento pelo smartphone, a localização é transmitida.',
        '• Mapa em Tempo Real: Na aba "Equipe" > "Mapa GPS", visualize todos os técnicos ativos no mapa.',
        '• Histórico e Precisão: Verifique latitude, longitude, precisão do satélite e horário do último sinal recebido.',
        '• Link Direto do Google Maps: Abra a localização em rota com 1 clique para calcular tempo de chegada.',
      ],
      tip: 'Privacidade e Bateria: O rastreamento só consome dados durante o horário de trabalho e chamados em aberto.',
    },
    {
      title: '4. LIBERAÇÃO DE MANUAIS OPERACIONAIS AOS COLABORADORES',
      items: [
        '• Central de Manuais: Na aba "Equipe" > "Manuais & Treinamento", o Dono tem controle total.',
        '• Liberação Individual de Técnicos: O administrador pode ativar ou desativar o acesso ao manual para cada técnico na lista com 1 clique ("Liberado" / "Bloqueado").',
        '• Liberação Individual do Financeiro: Mesma regra para os operadores do setor financeiro.',
        '• Botões em Massa: Disponível "Liberar para Todos os Técnicos" e "Liberar para Todo o Financeiro".',
        '• Comportamento no App: Quando liberado, o botão "Baixar Manual (PDF)" surge automaticamente na tela do colaborador.',
      ],
      tip: 'Use essa função para padronizar o treinamento de novos técnicos recém-contratados.',
    },
    {
      title: '5. FATURAMENTO, COBRANÇAS PIX & BOLETOS E COMISSÕES',
      items: [
        '• Cobrança de O.S e Visitas Avulsas: Emita Pix dinâmico (QR Code / Copia e Cola) ou Boleto FEBRABAN com linha digitável.',
        '• Visitas Avulsas no Local: Fature clientes sem necessidade de pré-cadastro completo (basta nome, telefone e endereço).',
        '• Comissões dos Técnicos: Configure a porcentagem padrão de comissão (ex: 15% ou 20%) para cálculo automático por O.S.',
        '• Recibos e Comprovantes em PDF: Emita recibos oficiais timbrados para o cliente com 1 clique.',
      ],
      tip: 'Configure a sua Chave Pix (CNPJ, CPF ou celular) e dados bancários na aba "Financeiro" > "Chave Pix & Banco".',
    },
    {
      title: '6. IDENTIDADE VISUAL (WHITE-LABEL) & ORÇAMENTOS',
      items: [
        '• Logomarca Personalizada: Faça upload da imagem da sua logomarca para figurar nos PDFs de O.S e Orçamentos.',
        '• Termos de Garantia: Defina o texto padrão de garantia (equipamentos novos e mão de obra especializada).',
        '• Conversão em 1 Clique: Orçamentos aprovados pelo cliente podem ser convertidos automaticamente em O.S de execução.',
      ],
      tip: 'Mantenha os cadastros de produtos e serviços atualizados com preço de custo e venda para margem real.',
    },
  ];

  sections.forEach((sec) => {
    y = checkPageBreak(doc, y, 40, company, manualTitle, 'Guia do Administrador', badgeColor, pageState);

    // Section title
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(14, y, pageWidth - 28, 7.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(sec.title, 18, y + 5.2);

    y += 11;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    sec.items.forEach((item) => {
      y = checkPageBreak(doc, y, 8, company, manualTitle, 'Guia do Administrador', badgeColor, pageState);
      const splitLines = doc.splitTextToSize(item, pageWidth - 36);
      doc.text(splitLines, 18, y);
      y += splitLines.length * 4.2;
    });

    if (sec.tip) {
      y = checkPageBreak(doc, y, 10, company, manualTitle, 'Guia do Administrador', badgeColor, pageState);
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(18, y - 1, pageWidth - 36, 7.5, 1.5, 1.5, 'FD');
      doc.setTextColor(4, 120, 87);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`💡 ${sec.tip}`, 21, y + 4.2);
      y += 11;
    } else {
      y += 4;
    }
  });

  // Stamp total pages on all pages
  const totalPages = pageState.page;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawManualFooter(doc, i, String(totalPages));
  }

  doc.save(`Manual_Administrador_${company?.tradeName || 'VigiaOS'}_${Date.now()}.pdf`);
}

/**
 * --------------------------------------------------------------------------
 * 2. MANUAL DO TÉCNICO EM CAMPO (PDF - GUIA PRÁTICO MOBILE)
 * --------------------------------------------------------------------------
 */
export function downloadTechnicianManualPDF(company?: CompanySettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageState = { page: 1 };
  const badgeColor: [number, number, number] = [217, 119, 6]; // amber-600
  const manualTitle = 'Manual do Técnico em Campo';

  drawManualHeader(doc, company, manualTitle, 'Guia do Técnico de Campo', badgeColor);

  let y = 36;

  // Header Box
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'F');
  doc.setTextColor(120, 53, 15); // amber-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('GUIA OPERACIONAL DO TÉCNICO DE CAMPO (SMARTPHONE)', 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text(
    'Passo a passo prático para execução de chamados, fotos de evidência, assinatura e orçamentos.',
    18,
    y + 14
  );
  doc.text(
    'Utilize diretamente no navegador do seu celular (Chrome / Safari), sem necessidade de instalar aplicativo.',
    18,
    y + 20
  );

  y += 32;

  const steps = [
    {
      title: 'PASSO 1: ACESSO AO SISTEMA NO CELULAR',
      items: [
        '1. Abra o navegador do smartphone e acesse o endereço fornecido pela empresa.',
        '2. Na tela de login, clique na aba "Técnico".',
        '3. Digite seu e-mail, telefone cadastrado ou seu nome, seguido da sua senha individual.',
        '4. Você entrará diretamente no painel exclusivo de campo com os seus chamados atribuídos.',
      ],
      rule: 'Importante: Mantenha sua senha individual segura e nunca compartilhe com terceiros.',
    },
    {
      title: 'PASSO 2: PAINEL DE CHAMADOS DO DIA (MEUS ATENDIMENTOS)',
      items: [
        '• Visualização dos Chamados: Veja as Ordens de Serviço (O.S) ordenadas por prioridade (Urgente, Alta, Média).',
        '• Endereço e Rota: O endereço completo do cliente possui botão para traçar rota direta no Waze / Google Maps.',
        '• Telefone do Cliente: Clique no botão de WhatsApp / Telefone para falar com o responsável antes de chegar.',
        '• Escopo do Serviço: Leia com atenção a descrição do problema relatado e materiais previstos.',
      ],
      rule: 'Verifique os chamados do dia logo pela manhã para planejar seu deslocamento.',
    },
    {
      title: 'PASSO 3: INICIAR DESLOCAMENTO & CHEGADA NO LOCAL (GPS)',
      items: [
        '1. Ao sair em direção ao cliente, abra a O.S e clique no botão amarelo "Em Deslocamento".',
        '2. Seu smartphone solicitará permissão de GPS: clique em "Permitir / Permitir durante o uso".',
        '3. Isso atualiza a central da empresa e avisa que você já está a caminho.',
        '4. Ao pisar no local do cliente, altere o status para "Em Execução" para registrar o início dos trabalhos.',
      ],
      rule: 'O registro do deslocamento comprova sua pontualidade e o cumprimento do SLA.',
    },
    {
      title: 'PASSO 4: REGISTRO OBRIGATÓRIO DE FOTOS DE EVIDÊNCIA (4 ETAPAS)',
      items: [
        'O sistema possui câmera integrada para anexar fotos instantâneas nas seguintes etapas:',
        '• Foto ANTES: Fotografe o estado inicial do equipamento quebrado, painel de alarme ou fiação danificada.',
        '• Foto DURANTE: Fotografe a montagem, passagem de cabos ou fixação dos suportes.',
        '• Foto DEPOIS: Fotografe o trabalho concluído, câmeras transmitindo imagem nítida, leds acesos e acabamento limpo.',
        '• Foto do EQUIPAMENTO: Fotografe o número de série (MAC / Serial) para fins de garantia e controle de estoque.',
      ],
      rule: 'Fotos nítidas com data e hora protegem você contra contestações e comprovam a excelência do seu serviço.',
    },
    {
      title: 'PASSO 5: APONTAMENTO DE PEÇAS & SERVIÇOS EXTRAS',
      items: [
        '• Se utilizou cabos extras, conectores BNC, fontes colmeia, baterias seladas ou sensores, adicione na O.S.',
        '• Na seção "Materiais e Serviços", selecione o item e informe a quantidade exata utilizada.',
        '• O valor total da O.S é recalculado na hora, garantindo faturamento correto pela empresa.',
      ],
      rule: 'Nunca deixe de apontar materiais gastos para evitar divergência no estoque físico.',
    },
    {
      title: 'PASSO 6: LAUDO TÉCNICO & ASSINATURA DIGITAL NA TELA',
      items: [
        '1. Escreva o Laudo Técnico detalhando o que foi feito (ex: "Efetuada troca de conector com mau contato e reconfiguração de IP").',
        '2. Chame o cliente ou responsável presente no local.',
        '3. Clique em "Coletar Assinatura Digital": o cliente assina diretamente na tela do celular com o dedo.',
        '4. Preencha o nome completo e o documento (CPF ou RG) de quem recebeu o serviço.',
        '5. Salve a assinatura: ela fica gravada com data e hora no documento oficial.',
      ],
      rule: 'A assinatura digital tem validade jurídica conforme o Código de Defesa do Consumidor.',
    },
    {
      title: 'PASSO 7: FINALIZAÇÃO & COMPROVANTE VIA WHATSAPP',
      items: [
        '1. Clique no botão verde "Finalizar Atendimento".',
        '2. A O.S passa para o status "Concluída" e fica registrada no sistema.',
        '3. Clique em "Enviar WhatsApp" para disparar o resumo com laudo técnico e comprovante direto para o cliente.',
      ],
      rule: 'Parabéns! Chamado finalizado com comprovação total e garantia registrada.',
    },
    {
      title: 'PASSO 8: EMISSÃO DE ORÇAMENTOS EM CAMPO (NOVA OPORTUNIDADE)',
      items: [
        '• Se o cliente solicitar um serviço extra (ex: adicionar mais 2 câmeras no quintal), acesse a aba "Orçamentos".',
        '• Clique em "Novo Orçamento", selecione os equipamentos e mão de obra e informe a validade.',
        '• Mostre o valor para o cliente e, se aprovado, clique em "Converter em O.S" para executar imediatamente!',
      ],
      rule: 'Aumente o faturamento da empresa e sua comissão técnica identificando novas necessidades no local.',
    },
  ];

  steps.forEach((step) => {
    y = checkPageBreak(doc, y, 38, company, manualTitle, 'Guia do Técnico de Campo', badgeColor, pageState);

    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(14, y, pageWidth - 28, 7.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(step.title, 18, y + 5.2);

    y += 11;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    step.items.forEach((item) => {
      y = checkPageBreak(doc, y, 8, company, manualTitle, 'Guia do Técnico de Campo', badgeColor, pageState);
      const splitLines = doc.splitTextToSize(item, pageWidth - 36);
      doc.text(splitLines, 18, y);
      y += splitLines.length * 4.2;
    });

    if (step.rule) {
      y = checkPageBreak(doc, y, 10, company, manualTitle, 'Guia do Técnico de Campo', badgeColor, pageState);
      doc.setFillColor(254, 243, 199); // amber-50
      doc.setDrawColor(251, 191, 36);
      doc.roundedRect(18, y - 1, pageWidth - 36, 7.5, 1.5, 1.5, 'FD');
      doc.setTextColor(180, 83, 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`⚡ Regra de Ouro: ${step.rule}`, 21, y + 4.2);
      y += 11;
    } else {
      y += 4;
    }
  });

  const totalPages = pageState.page;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawManualFooter(doc, i, String(totalPages));
  }

  doc.save(`Manual_Tecnico_Campo_${company?.tradeName || 'VigiaOS'}_${Date.now()}.pdf`);
}

/**
 * --------------------------------------------------------------------------
 * 3. MANUAL DO OPERADOR FINANCEIRO & COBRANÇA (PDF)
 * --------------------------------------------------------------------------
 */
export function downloadFinancialManualPDF(company?: CompanySettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageState = { page: 1 };
  const badgeColor: [number, number, number] = [5, 150, 105]; // emerald-600
  const manualTitle = 'Manual do Operador Financeiro';

  drawManualHeader(doc, company, manualTitle, 'Guia do Operador Financeiro', badgeColor);

  let y = 36;

  // Header Box
  doc.setFillColor(209, 250, 229); // emerald-100
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'F');
  doc.setTextColor(6, 78, 59); // emerald-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('MANUAL DE OPERAÇÃO FINANCEIRA, PIX & BOLETOS', 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text(
    'Procedimentos para faturamento de atendimentos, emissão de cobranças Pix/Boleto e conciliação de caixa.',
    18,
    y + 14
  );
  doc.text(
    'Gestão de visitas avulsas, despesas com fornecedores de peças, combustível e repasse de comissões técnicas.',
    18,
    y + 20
  );

  y += 32;

  const chapters = [
    {
      title: 'CAPÍTULO 1: ACESSO AO MÓDULO FINANCEIRO',
      items: [
        '1. Na tela de login, selecione a aba "Financeiro".',
        '2. Entre com o e-mail cadastrado pelo Dono e sua senha individual.',
        '3. Ao entrar, o sistema abre diretamente o painel financeiro consolidado.',
        '4. Suas permissões (Contas a Pagar, Contas a Receber, Emissão de Boletos/Pix, DRE e Comissões) são gerenciadas pelo Dono.',
      ],
      notice: 'Segurança: Não compartilhe sua senha de operador financeiro com outros colaboradores.',
    },
    {
      title: 'CAPÍTULO 2: EMISSÃO DE COBRANÇAS COM PIX DINÂMICO (EMVCo)',
      items: [
        '• Geração Imediata: Abra a O.S ou clique em "Emitir Pix & Boleto".',
        '• QR Code & Copia e Cola: O sistema gera o payload BR Code padrão Banco Central com valor exato e identificador (TxID).',
        '• Envio pelo WhatsApp: Clique em "Enviar WhatsApp" para disparar a cobrança formatada com código Pix direto ao cliente.',
        '• Confirmação de Recebimento: Ao receber o comprovante ou conferir no banco, clique em "✓ Marcar Pago" para dar baixa no caixa.',
      ],
      notice: 'O Pix entra diretamente na conta bancária cadastrada da empresa.',
    },
    {
      title: 'CAPÍTULO 3: EMISSÃO DE BOLETOS BANCÁRIOS (FEBRABAN)',
      items: [
        '• Linha Digitável e Código de Barras: O sistema formata a linha digitável com fator de vencimento e banco emissor.',
        '• Download do Boleto em PDF: Clique em "Baixar Boleto Bancário (PDF)" para gerar o boleto com Ficha de Compensação.',
        '• Instruções de Juros/Multa: O boleto já inclui instruções legais de multa de 2% e juros de mora após o vencimento.',
        '• Envio ao Cliente: O boleto pode ser impresso ou enviado digitalmente em PDF junto com a O.S.',
      ],
      notice: 'Verifique se o CPF/CNPJ do pagador foi preenchido corretamente para emissão do boleto.',
    },
    {
      title: 'CAPÍTULO 4: FATURAMENTO DE VISITAS TÉCNICAS AVULSAS',
      items: [
        '• Sem Necessidade de Cadastro Prévio: Para chamados emergenciais ou clientes de passagem, clique em "Cobrar Visita Avulsa".',
        '• Coleta de Dados no Local: Preencha Nome, Telefone e Endereço do atendimento na hora.',
        '• Emissão Imediata: Gere o Pix ou Boleto de R$ 150, R$ 220 ou do valor acordado.',
        '• Registro no Caixa: A receita é categorizada como "Visita Avulsa" no fluxo financeiro.',
      ],
      notice: 'Visitas avulsas têm alta liquidez e representam receita imediata para a empresa.',
    },
    {
      title: 'CAPÍTULO 5: EMISSÃO DE RECIBOS DE QUITAÇÃO (PDF)',
      items: [
        '• Comprovante Oficial: Para pagamentos já realizados em dinheiro, Pix ou cartão, clique em "Recibo (PDF)".',
        '• Autenticação Eletrônica: O recibo sai timbrado com CNPJ da empresa, dados do pagador e identificador único de quitação.',
        '• Entrega ao Cliente: Baixe o PDF e envie no WhatsApp do cliente como comprovante fiscal/comercial.',
      ],
      notice: 'Recibos com autenticação mecânica geram confiança e fidelizam condomínios e empresas.',
    },
    {
      title: 'CAPÍTULO 6: CONTAS A PAGAR & DESPESAS OPERACIONAIS',
      items: [
        '• Lançamento de Despesas: Clique em "+ Nova Despesa" na aba "Contas a Pagar".',
        '• Categorias Disponíveis: Peças & Fornecedores (Intelbras, cabos, fontes), Combustível da Frota, Ferramentas, Aluguel e Comissões.',
        '• Controle de Vencimentos: Acompanhe despesas com vencimento próximo e marque como pagas após liquidação bancária.',
      ],
      notice: 'Lançar as compras de peças garante a apuração correta do lucro líquido da empresa.',
    },
    {
      title: 'CAPÍTULO 7: APURAÇÃO & REPASSE DE COMISSÕES TÉCNICAS',
      items: [
        '• Cálculo Automático: Ao vincular um técnico a uma O.S ou visita avulsa, o percentual de comissão é calculado.',
        '• Painel de Comissões: Acesse a aba "Comissões Técnicas" para ver o total a pagar e já pago por profissional.',
        '• Baixa de Comissão: Ao efetuar o pagamento ao técnico (semanal ou quinzenal), marque como pago para gerar o lançamento em despesas.',
      ],
      notice: 'A transparência nas comissões motiva a equipe técnica a prestar serviços com qualidade.',
    },
    {
      title: 'CAPÍTULO 8: DEMONSTRATIVO DRE & FLUXO DE CAIXA',
      items: [
        '• Painel em Tempo Real: Acompanhe o Saldo Líquido Operacional (Receitas Liquidadas - Despesas Pagas).',
        '• Previsão Futura: Monitore Contas a Receber em aberto vs Contas a Pagar no mês.',
        '• Exportação Contábil: Clique em "Exportar DRE (PDF)" para gerar o relatório impresso para o Dono ou contador da empresa.',
      ],
      notice: 'Gere o relatório DRE no último dia útil de cada mês para fechamento da folha e impostos.',
    },
  ];

  chapters.forEach((chap) => {
    y = checkPageBreak(doc, y, 38, company, manualTitle, 'Guia do Operador Financeiro', badgeColor, pageState);

    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(14, y, pageWidth - 28, 7.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(chap.title, 18, y + 5.2);

    y += 11;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    chap.items.forEach((item) => {
      y = checkPageBreak(doc, y, 8, company, manualTitle, 'Guia do Operador Financeiro', badgeColor, pageState);
      const splitLines = doc.splitTextToSize(item, pageWidth - 36);
      doc.text(splitLines, 18, y);
      y += splitLines.length * 4.2;
    });

    if (chap.notice) {
      y = checkPageBreak(doc, y, 10, company, manualTitle, 'Guia do Operador Financeiro', badgeColor, pageState);
      doc.setFillColor(209, 250, 229); // emerald-50
      doc.setDrawColor(110, 231, 183);
      doc.roundedRect(18, y - 1, pageWidth - 36, 7.5, 1.5, 1.5, 'FD');
      doc.setTextColor(4, 120, 87);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`📌 Atenção: ${chap.notice}`, 21, y + 4.2);
      y += 11;
    } else {
      y += 4;
    }
  });

  const totalPages = pageState.page;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawManualFooter(doc, i, String(totalPages));
  }

  doc.save(`Manual_Financeiro_${company?.tradeName || 'VigiaOS'}_${Date.now()}.pdf`);
}

/**
 * Download all 3 manuals in batch for the Administrator
 */
export function downloadAllManualsPDF(company?: CompanySettings) {
  downloadAdminManualPDF(company);
  setTimeout(() => {
    downloadTechnicianManualPDF(company);
  }, 600);
  setTimeout(() => {
    downloadFinancialManualPDF(company);
  }, 1200);
}
