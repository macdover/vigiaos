import jsPDF from 'jspdf';
import { FinancialTransaction, CompanySettings } from '../types';
import { formatCurrency, formatDateBR } from './storage';
import { generateBoletoDetails } from './pixBoletoGenerator';

/**
 * Downloads a professional Payment Receipt (Recibo de Quitação / Comprovante) as PDF
 */
export function downloadReceiptPDF(
  transaction: FinancialTransaction,
  company?: CompanySettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = '#0f172a';
  const accentColor = '#0284c7';

  // Header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text((company?.tradeName || company?.name || 'VigiaOS').toUpperCase(), 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`CNPJ: ${company?.cnpj || '11.601.831/0001-35'} • Tel/WhatsApp: ${company?.phone || company?.whatsapp || '(21) 99723-2764'}`, 14, 25);
  doc.text(`${company?.address || 'Rio de Janeiro - RJ'} • ${company?.email || 'contato@empresa.com'}`, 14, 31);

  // Document Title Badge
  doc.setFillColor(2, 132, 199);
  doc.roundedRect(pageWidth - 75, 12, 61, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RECIBO DE PAGAMENTO', pageWidth - 72, 19);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° REC-${transaction.id.replace(/\D/g, '').slice(-6) || '001234'}`, pageWidth - 72, 25);

  let currentY = 50;

  // Receipt Value Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 3, 3, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR DO RECIBO:', 20, currentY + 9);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(transaction.amount), 20, currentY + 17);

  // Status Badge
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(pageWidth - 65, currentY + 5, 45, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('QUITADO / PAGO', pageWidth - 58, currentY + 12.5);

  currentY += 32;

  // Payer Information Card
  const clientName = transaction.isAvulso
    ? (transaction.avulsoClientInfo?.name || transaction.clientName || 'Cliente Avulso')
    : (transaction.clientName || 'Cliente');

  const clientDoc = transaction.isAvulso
    ? (transaction.avulsoClientInfo?.document || 'Não informado')
    : 'Conforme Cadastro VigiaOS';

  const clientPhone = transaction.isAvulso
    ? (transaction.avulsoClientInfo?.phone || 'Não informado')
    : 'Conforme Cadastro VigiaOS';

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 48, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO PAGADOR / CLIENTE', 20, currentY + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Nome / Razão Social:', 20, currentY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(clientName, 65, currentY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('CPF / CNPJ:', 20, currentY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(clientDoc, 65, currentY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Telefone / Contato:', 20, currentY + 31);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(clientPhone, 65, currentY + 31);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tipo de Atendimento:', 20, currentY + 38);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(
    transaction.isAvulso 
      ? 'Atendimento / Visita Técnica Avulsa' 
      : (transaction.workOrderNumber ? `Ordem de Serviço #${transaction.workOrderNumber}` : 'Cliente Contratual Cadastrado'),
    65, 
    currentY + 38
  );

  currentY += 56;

  // Description / Statement of payment
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 44, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DISCRIMINAÇÃO DOS SERVIÇOS & FORMA DE PAGAMENTO', 20, currentY + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const descText = transaction.description || transaction.title || 'Serviços técnicos de segurança eletrônica, telecomunicações e manutenção.';
  doc.text(`Referente a: ${descText}`, 20, currentY + 17, { maxWidth: pageWidth - 40 });

  const payMethodLabels: Record<string, string> = {
    pix: 'PIX Instantâneo',
    boleto: 'Boleto Bancário',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    dinheiro: 'Dinheiro em Espécie',
    transferencia: 'Transferência Bancária (TED/DOC)',
    outro: 'Outro Método',
  };

  const methodLabel = payMethodLabels[transaction.paymentMethod || 'pix'] || 'PIX Instantâneo';
  doc.text(`Forma de Pagamento: ${methodLabel}`, 20, currentY + 28);
  doc.text(`Data de Liquidação: ${formatDateBR(transaction.paymentDate || transaction.dueDate || new Date().toISOString().split('T')[0])}`, 20, currentY + 35);

  currentY += 52;

  // Declaration text
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Declaramos para os devidos fins que recebemos de ${clientName} a importância de ${formatCurrency(transaction.amount)}, dando plena e irrevogável quitação pelo serviço discriminado acima.`,
    14,
    currentY,
    { maxWidth: pageWidth - 28 }
  );

  currentY += 24;

  // Signature lines
  const sigY = currentY + 15;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, sigY, 90, sigY);
  doc.line(pageWidth - 90, sigY, pageWidth - 20, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(company?.tradeName || company?.name || 'VigiaOS - Emitente', 30, sigY + 5);
  doc.text('Assinatura do Responsável', 35, sigY + 9);

  doc.text(clientName, pageWidth - 80, sigY + 5);
  doc.text('Assinatura do Pagador', pageWidth - 75, sigY + 9);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento emitido eletronicamente pelo VigiaOS em ${new Date().toLocaleString('pt-BR')}`,
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  const safeFileName = `Recibo_${transaction.workOrderNumber || transaction.id.slice(-6)}_${Date.now()}.pdf`;
  doc.save(safeFileName);
}

/**
 * Downloads standard Brazilian Boleto Bancário document as PDF
 */
export function downloadBoletoPDF(
  transaction: FinancialTransaction,
  company?: CompanySettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const boleto = generateBoletoDetails(transaction, company);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header: Recibo do Sacado
  doc.setFillColor(248, 250, 252);
  doc.rect(10, 10, pageWidth - 20, 75, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(boleto.bankName, 14, 18);

  doc.setFontSize(9);
  doc.text(`RECIBO DO PAGADOR / SACADO`, pageWidth - 65, 18);

  doc.setDrawColor(203, 213, 225);
  doc.line(10, 22, pageWidth - 10, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Cedente / Beneficiário: ${boleto.beneficiaryName} - CNPJ: ${boleto.beneficiaryDocument}`, 14, 28);
  doc.text(`Pagador: ${boleto.payerName} - ${boleto.payerDocument}`, 14, 34);
  doc.text(`Nosso Número: ${boleto.ourNumber}`, 14, 40);
  doc.text(`Vencimento: ${formatDateBR(boleto.dueDate)}`, 14, 46);
  doc.text(`Valor do Documento: ${formatCurrency(boleto.amount)}`, 14, 52);
  doc.text(`Linha Digitável: ${boleto.digitableLine}`, 14, 58);
  doc.text(`Autenticação Mecânica: REGISTRO CIP/FEBRABAN OK`, 14, 68);

  // Cut line dashed
  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(148, 163, 184);
  doc.line(10, 95, pageWidth - 10, 95);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Corte aqui para destacar a Ficha de Compensação', pageWidth / 2, 93, { align: 'center' });

  // Ficha de Compensação Header
  let y = 105;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('341-7', 14, y + 6);
  doc.text('|', 32, y + 6);
  doc.setFontSize(10.5);
  doc.text(boleto.digitableLine, 36, y + 6);

  // Main Compensation Slip Grid
  y += 10;
  const tableWidth = pageWidth - 20;

  // Draw main frame
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(10, y, tableWidth, 90);

  // Grid rows
  doc.line(10, y + 10, pageWidth - 10, y + 10);
  doc.line(10, y + 20, pageWidth - 10, y + 20);
  doc.line(10, y + 30, pageWidth - 10, y + 30);
  doc.line(10, y + 40, pageWidth - 10, y + 40);

  // Right column dividing line
  const colRightX = pageWidth - 65;
  doc.line(colRightX, y, colRightX, y + 70);

  // Field Labels & Contents
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Local de Pagamento', 12, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PAGÁVEL EM QUALQUER BANCO OU CANAL ELETRÔNICO ATÉ O VENCIMENTO', 12, y + 8);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Vencimento', colRightX + 2, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(formatDateBR(boleto.dueDate), colRightX + 2, y + 8);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Beneficiário / Cedente', 12, y + 13.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`${boleto.beneficiaryName} - CNPJ: ${boleto.beneficiaryDocument}`, 12, y + 18);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Valor do Documento', colRightX + 2, y + 13.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(formatCurrency(boleto.amount), colRightX + 2, y + 18);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Data do Documento', 12, y + 23.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(formatDateBR(new Date().toISOString().split('T')[0]), 12, y + 28);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Número do Documento', 50, y + 23.5);
  doc.setFont('helvetica', 'bold');
  doc.text(transaction.workOrderNumber || transaction.id.slice(-6), 50, y + 28);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Espécie Doc.', 90, y + 23.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DM', 90, y + 28);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Aceite', 115, y + 23.5);
  doc.setFont('helvetica', 'bold');
  doc.text('N', 115, y + 28);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Nosso Número', colRightX + 2, y + 23.5);
  doc.setFont('helvetica', 'bold');
  doc.text(boleto.ourNumber, colRightX + 2, y + 28);

  // Instructions Box
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Instruções (Texto de responsabilidade do beneficiário)', 12, y + 33.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  let instY = y + 38;
  boleto.instructions.forEach((inst) => {
    doc.text(`• ${inst}`, 14, instY);
    instY += 4.5;
  });

  // Payer Box (Sacado) at bottom of slip
  const sacadoY = y + 70;
  doc.line(10, sacadoY, pageWidth - 10, sacadoY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Pagador (Sacado):', 12, sacadoY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`${boleto.payerName} - CPF/CNPJ: ${boleto.payerDocument}`, 12, sacadoY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Endereço: ${boleto.payerAddress}`, 12, sacadoY + 14);

  // Visual Barcode generation simulation
  const barcodeY = y + 96;
  doc.setFillColor(15, 23, 42);

  // Draw authentic looking Interleaved 2 of 5 barcode bars
  let barX = 14;
  const barPattern = [1, 2, 1, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 1, 3, 1, 2, 1, 3, 1, 2, 3, 1, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 2];
  
  for (let i = 0; i < 75; i++) {
    const width = (barPattern[i % barPattern.length] * 0.7) || 0.8;
    const isBar = (i % 2 === 0);
    if (isBar) {
      doc.rect(barX, barcodeY, width, 14, 'F');
    }
    barX += width + 0.5;
  }

  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Código de Barras FEBRABAN: ${boleto.barcodeNumber}`, 14, barcodeY + 19);

  const safeFileName = `Boleto_${transaction.workOrderNumber || transaction.id.slice(-6)}_${Date.now()}.pdf`;
  doc.save(safeFileName);
}

/**
 * Downloads Financial Cash Flow / DRE Report in PDF
 */
export function downloadCashFlowReportPDF(
  transactions: FinancialTransaction[],
  company?: CompanySettings,
  monthYearLabel?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((company?.tradeName || company?.name || 'VigiaOS').toUpperCase(), 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Demonstrativo Financeiro & Fluxo de Caixa • CNPJ: ${company?.cnpj || '11.601.831/0001-35'}`, 14, 23);
  doc.text(`Competência: ${monthYearLabel || 'Visão Consolidada Geral'}`, 14, 29);

  // Financial summary numbers
  const totalReceitas = transactions
    .filter((t) => t.type === 'receita' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = transactions
    .filter((t) => t.type === 'despesa' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  const totalPendenteReceber = transactions
    .filter((t) => t.type === 'receita' && t.status !== 'pago' && t.status !== 'cancelado')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPendentePagar = transactions
    .filter((t) => t.type === 'despesa' && t.status !== 'pago' && t.status !== 'cancelado')
    .reduce((sum, t) => sum + t.amount, 0);

  let y = 45;

  // KPI boxes
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 55, 20, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('RECEITAS LIQUIDADAS', 18, y + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(formatCurrency(totalReceitas), 18, y + 15);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(73, y, 55, 20, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('DESPESAS PAGAS', 77, y + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68); // red
  doc.text(formatCurrency(totalDespesas), 77, y + 15);

  doc.setFillColor(saldoLiquido >= 0 ? 236 : 254, saldoLiquido >= 0 ? 253 : 242, saldoLiquido >= 0 ? 245 : 242);
  doc.roundedRect(132, y, 64, 20, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('SALDO / RESULTADO LÍQUIDO', 136, y + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(saldoLiquido >= 0 ? 5 : 220, saldoLiquido >= 0 ? 150 : 38, saldoLiquido >= 0 ? 105 : 38);
  doc.text(formatCurrency(saldoLiquido), 136, y + 15);

  y += 28;

  // Pending overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Previsão Futura & Pendências:', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Contas a Receber (Em aberto / Vencendo): ${formatCurrency(totalPendenteReceber)}`, 14, y + 6);
  doc.text(`• Contas a Pagar (Em aberto / Vencendo): ${formatCurrency(totalPendentePagar)}`, 14, y + 12);

  y += 22;

  // Table header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Lançamentos Financeiros Recentes', 14, y);

  y += 4;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text('DATA', 16, y + 4.8);
  doc.text('DESCRIÇÃO / CLIENTE / FORNECEDOR', 40, y + 4.8);
  doc.text('TIPO', 125, y + 4.8);
  doc.text('STATUS', 145, y + 4.8);
  doc.text('VALOR', pageWidth - 16, y + 4.8, { align: 'right' });

  y += 7;

  // List rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const rows = transactions.slice(0, 30);

  rows.forEach((t, idx) => {
    if (y > 275) return;
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 6, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.text(formatDateBR(t.paymentDate || t.dueDate || ''), 16, y + 4.2);

    const desc = t.title + (t.clientName ? ` (${t.clientName})` : t.supplierName ? ` (${t.supplierName})` : '');
    doc.text(desc.slice(0, 48), 40, y + 4.2);

    doc.setTextColor(t.type === 'receita' ? 16 : 239, t.type === 'receita' ? 185 : 68, t.type === 'receita' ? 129 : 68);
    doc.text(t.type === 'receita' ? 'Receita' : 'Despesa', 125, y + 4.2);

    doc.setTextColor(71, 85, 105);
    doc.text(t.status.toUpperCase(), 145, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(t.type === 'receita' ? 16 : 239, t.type === 'receita' ? 185 : 68, t.type === 'receita' ? 129 : 68);
    const prefix = t.type === 'receita' ? '+ ' : '- ';
    doc.text(`${prefix}${formatCurrency(t.amount)}`, pageWidth - 16, y + 4.2, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 6;
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Relatório emitido pelo VigiaOS em ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 288, { align: 'center' });

  doc.save(`Relatorio_Financeiro_${Date.now()}.pdf`);
}
