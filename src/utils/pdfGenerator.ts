import { jsPDF } from 'jspdf';
import { 
  Budget, 
  CompanySettings, 
  Client, 
  WorkOrder, 
  Technician, 
  OSStatus, 
  OSType 
} from '../types';
import { 
  formatCurrency, 
  formatDateBR, 
  formatDateTimeBR, 
  getPriorityLabel, 
  generateWhatsAppLink 
} from './storage';

/* -------------------------------------------------------------
 * Helper utilities for PDF Generation
 * ------------------------------------------------------------- */

function getOSStatusText(status: OSStatus): string {
  switch (status) {
    case 'aberta': return 'Aberta';
    case 'em_deslocamento': return 'Em Deslocamento';
    case 'em_andamento': return 'Em Execução';
    case 'aguardando_peca': return 'Aguardando Peça';
    case 'concluida': return 'Concluída';
    case 'cancelada': return 'Cancelada';
    default: return status;
  }
}

function getOSTypeText(type: OSType): string {
  switch (type) {
    case 'instalacao': return 'Instalação';
    case 'manutencao_preventiva': return 'Manut. Preventiva';
    case 'manutencao_corretiva': return 'Manut. Corretiva';
    case 'chamado_emergencial': return 'Chamado Emergencial';
    case 'vistoria': return 'Vistoria Técnica';
    default: return String(type).replace('_', ' ');
  }
}

function getClientTypeLabel(type: Client['type']): string {
  switch (type) {
    case 'condominio': return 'Condomínio';
    case 'comercial': return 'Comercial';
    case 'residencial': return 'Residencial';
    case 'industrial': return 'Industrial';
    default: return type;
  }
}

/**
 * Draws standard company header across report pages.
 */
function drawReportHeader(
  doc: jsPDF,
  company: CompanySettings,
  reportTitle: string,
  reportSubtitle: string,
  badgeText: string,
  pageWidth: number,
  margin: number,
  y: number
): number {
  const contentWidth = pageWidth - margin * 2;

  // Header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 24, 'F');

  // Cyan accent line on top of the bar
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(margin, y, contentWidth, 1.5, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const companyTitle = company.tradeName || company.name || 'MPS Telefonia & Segurança';
  doc.text(companyTitle, margin + 5, y + 8.5);

  // Company sub-details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  const companySub = [
    company.cnpj ? `CNPJ: ${company.cnpj}` : '',
    company.phone ? `Tel: ${company.phone}` : '',
    company.email ? `Email: ${company.email}` : '',
  ]
    .filter(Boolean)
    .join('  •  ');
  doc.text(companySub, margin + 5, y + 14);

  const addressSub = company.address ? company.address : 'Sistemas de Segurança Eletrônica & CFTV';
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(addressSub, margin + 5, y + 19);

  // Badge box on the right
  const badgeWidth = 56;
  const badgeX = pageWidth - margin - badgeWidth - 3;
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.roundedRect(badgeX, y + 4.5, badgeWidth, 15, 2, 2, 'F');
  
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(badgeText, badgeX + badgeWidth / 2, y + 10.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(reportSubtitle, badgeX + badgeWidth / 2, y + 15, { align: 'center' });

  return y + 27;
}

/**
 * Draws mini header for continuation pages.
 */
function drawContinuationHeader(
  doc: jsPDF,
  company: CompanySettings,
  title: string,
  pageWidth: number,
  margin: number
): number {
  const contentWidth = pageWidth - margin * 2;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, 8, contentWidth, 10, 'F');
  
  doc.setFillColor(6, 182, 212);
  doc.rect(margin, 8, contentWidth, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const companyTitle = company.tradeName || company.name || 'MPS Telefonia & Segurança';
  doc.text(`${companyTitle} • ${title} (Continuação)`, margin + 4, 14.5);

  return 22;
}

/**
 * Adds page numbering and emission stamp to all pages.
 */
function addPageFooters(doc: jsPDF, reportName: string, pageWidth: number, pageHeight: number) {
  const totalPages = doc.getNumberOfPages();
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400

    // Top subtle divider line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(12, pageHeight - 9, pageWidth - 12, pageHeight - 9);

    doc.text(
      `${reportName} • Emitido eletronicamente em ${dateFormatted} às ${timeFormatted}`,
      14,
      pageHeight - 5
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 14,
      pageHeight - 5,
      { align: 'right' }
    );
  }
}

/* -------------------------------------------------------------
 * 1. COMMERCIAL BUDGET PROPOSAL PDF
 * ------------------------------------------------------------- */

/**
 * Builds a professional jsPDF document for a commercial proposal / budget.
 */
export function buildBudgetPDF(budget: Budget, company: CompanySettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  let y = margin;

  // 1. TOP HEADER BAND
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 24, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const companyTitle = company.tradeName || company.name || 'MPS Telefonia & Segurança';
  doc.text(companyTitle, margin + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  const companySub = [
    company.cnpj ? `CNPJ: ${company.cnpj}` : '',
    company.phone ? `Tel: ${company.phone}` : '',
    company.email ? `Email: ${company.email}` : '',
    company.address ? company.address : '',
  ]
    .filter(Boolean)
    .join('  •  ');
  doc.text(companySub, margin + 5, y + 14);

  // Badge: PROPOSTA COMERCIAL
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.roundedRect(pageWidth - margin - 52, y + 5, 48, 14, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ORÇAMENTO COMERCIAL', pageWidth - margin - 28, y + 11, { align: 'center' });
  doc.setFontSize(7);
  doc.text('SEGURANÇA ELETRÔNICA', pageWidth - margin - 28, y + 15.5, { align: 'center' });

  y += 28;

  // 2. PROPOSAL & CLIENT INFO BOX
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  // Left Column: Client info
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DADOS DO CLIENTE', margin + 4, y + 6);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(budget.clientName || 'Cliente não identificado', margin + 4, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Telefone / WhatsApp: ${budget.clientPhone || 'Não informado'}`, margin + 4, y + 17);
  doc.text(`Projeto / Objeto: ${budget.title || 'Instalação de Segurança'}`, margin + 4, y + 22);

  // Right Column: Proposal Metadata
  const col2X = margin + 115;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('INFORMAÇÕES DA PROPOSTA', col2X, y + 6);

  doc.setTextColor(2, 132, 199); // cyan-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Nº ${budget.budgetNumber}`, col2X, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Data de Emissão: ${formatDateBR(budget.createdAt)}`, col2X, y + 17);
  doc.text(`Validade da Proposta: ${budget.validityDays || 15} dias`, col2X, y + 22);

  y += 31;

  // 3. ITEMS TABLE
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 7.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('ITEM / DESCRIÇÃO DOS EQUIPAMENTOS E SERVIÇOS', margin + 4, y + 5);
  doc.text('TIPO', margin + 112, y + 5, { align: 'center' });
  doc.text('QTD', margin + 130, y + 5, { align: 'center' });
  doc.text('UNITÁRIO', margin + 155, y + 5, { align: 'right' });
  doc.text('TOTAL', margin + contentWidth - 4, y + 5, { align: 'right' });

  y += 7.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const items = budget.items || [];
  if (items.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(148, 163, 184);
    doc.text('Nenhum item discriminado no orçamento.', margin + 4, y + 5.5);
    y += 8;
  } else {
    items.forEach((it, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, 7, 'F');

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);

      doc.setTextColor(30, 41, 59);
      const nameTruncated = it.name.length > 55 ? it.name.substring(0, 52) + '...' : it.name;
      doc.text(nameTruncated, margin + 4, y + 4.8);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text(it.type === 'service' ? 'Serviço' : 'Equipamento', margin + 112, y + 4.8, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(String(it.quantity), margin + 130, y + 4.8, { align: 'center' });
      doc.text(formatCurrency(it.unitPrice), margin + 155, y + 4.8, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(it.total), margin + contentWidth - 4, y + 4.8, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += 7;
    });
  }

  y += 4;

  // 4. FINANCIAL SUMMARY BOX
  const summaryBoxWidth = 85;
  const summaryX = margin + contentWidth - summaryBoxWidth;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, y, summaryBoxWidth, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Mão de Obra / Serviços:', summaryX + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(budget.laborValue || 0), summaryX + summaryBoxWidth - 4, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Equipamentos / Peças:', summaryX + 4, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(budget.partsValue || 0), summaryX + summaryBoxWidth - 4, y + 12, { align: 'right' });

  if (budget.discountValue && budget.discountValue > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 38, 38);
    doc.text('Desconto Especial:', summaryX + 4, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`- ${formatCurrency(budget.discountValue)}`, summaryX + summaryBoxWidth - 4, y + 18, { align: 'right' });
  }

  // Highlighted Total Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(summaryX + 2, y + 21, summaryBoxWidth - 4, 9, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('VALOR TOTAL:', summaryX + 6, y + 26.8);
  doc.setFontSize(10.5);
  doc.setTextColor(34, 211, 238); // cyan-400
  doc.text(formatCurrency(budget.totalValue), summaryX + summaryBoxWidth - 6, y + 27, { align: 'right' });

  // Left Box: Conditions & Payment
  const termsWidth = contentWidth - summaryBoxWidth - 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, termsWidth, 32, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CONDIÇÕES COMERCIAIS & PAGAMENTO', margin + 4, y + 6);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const termsText = budget.paymentTerms || 'À vista via Pix ou 50% entrada + 50% conclusão';
  doc.text(termsText, margin + 4, y + 12);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('GARANTIA DOS SERVIÇOS', margin + 4, y + 19);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const warranty = company.warrantyTerms || 'Garantia de 12 meses para equipamentos novos e 90 dias para serviços.';
  const warrantyLines = doc.splitTextToSize(warranty, termsWidth - 8);
  doc.text(warrantyLines, margin + 4, y + 24);

  y += 37;

  // 5. TECHNICAL OBSERVATIONS (if any)
  if (budget.notes) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(251, 191, 36); // amber-400
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
    doc.setTextColor(146, 64, 14); // amber-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('OBSERVAÇÕES TÉCNICAS E ESPECIFICAÇÕES:', margin + 4, y + 5);

    doc.setTextColor(120, 53, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const splitNotes = doc.splitTextToSize(budget.notes, contentWidth - 8);
    doc.text(splitNotes, margin + 4, y + 9.5);

    y += 18;
  }

  // 6. SIGNATURE LINES
  y = Math.max(y, pageHeight - 38);
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.line(margin + 6, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin - 6, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(companyTitle, margin + 38, y + 4, { align: 'center' });
  doc.text('De Acordo do Cliente', pageWidth - margin - 38, y + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Departamento Técnico & Comercial', margin + 38, y + 7.5, { align: 'center' });
  doc.text(budget.clientName || 'Assinatura do Contratante', pageWidth - margin - 38, y + 7.5, { align: 'center' });

  // 7. FOOTER
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Proposta emitida eletronicamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Proposta ${budget.budgetNumber}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  return doc;
}

export function downloadBudgetPDF(budget: Budget, company: CompanySettings): string {
  const doc = buildBudgetPDF(budget, company);
  const cleanNumber = budget.budgetNumber.replace(/[^a-zA-Z0-9-]/g, '');
  const fileName = `Orcamento_${cleanNumber}.pdf`;
  doc.save(fileName);
  return fileName;
}

export async function sendBudgetPDFToWhatsApp(
  budget: Budget,
  company: CompanySettings
): Promise<{ success: boolean; sharedViaNative: boolean; fileName: string }> {
  const doc = buildBudgetPDF(budget, company);
  const cleanNumber = budget.budgetNumber.replace(/[^a-zA-Z0-9-]/g, '');
  const fileName = `Orcamento_${cleanNumber}.pdf`;
  const companyName = company.tradeName || company.name || 'MPS Telefonia & Segurança';

  const itemsText = (budget.items || [])
    .map(it => `• ${it.quantity}x ${it.name} - ${formatCurrency(it.total)}`)
    .join('\n');

  const message =
    `*ORÇAMENTO COMERCIAL & PROPOSTA EM PDF*\n` +
    `*${companyName}*\n\n` +
    `Olá *${budget.clientName}*, preparamos a proposta comercial *${budget.budgetNumber}* para o seu projeto:\n\n` +
    `📋 *Projeto:* ${budget.title}\n` +
    (itemsText ? `*Principais Itens:*\n${itemsText}\n\n` : '') +
    `💰 *VALOR TOTAL:* *${formatCurrency(budget.totalValue)}*\n` +
    `💳 *Condições:* ${budget.paymentTerms || 'A combinar'}\n` +
    `📅 *Validade:* ${budget.validityDays || 15} dias\n\n` +
    `📄 *O documento completo em PDF (${fileName}) com termos de garantia e laudo detalhado foi gerado e está pronto para envio!*\n\n` +
    `Para aprovar ou tirar dúvidas, basta responder por aqui.`;

  doc.save(fileName);

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Orçamento ${budget.budgetNumber} - ${companyName}`,
          text: message,
        });
        return { success: true, sharedViaNative: true, fileName };
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed or unsupported:', err);
      }
    }
  }

  const waUrl = generateWhatsAppLink(budget.clientPhone, message);
  window.open(waUrl, '_blank');

  return { success: true, sharedViaNative: false, fileName };
}

/* -------------------------------------------------------------
 * 2. CLIENTS REPORT PDF (Relatório Geral de Clientes)
 * ------------------------------------------------------------- */

export interface ClientsReportOptions {
  typeFilter?: string;
  searchTerm?: string;
  title?: string;
}

/**
 * Builds a comprehensive Client List / Report PDF with summary statistics,
 * contact details, and Work Order counts.
 */
export function buildClientsReportPDF(
  clients: Client[],
  workOrders: WorkOrder[],
  budgets: Budget[],
  company: CompanySettings,
  options?: ClientsReportOptions
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  let y = margin;

  // 1. Header
  y = drawReportHeader(
    doc,
    company,
    'RELATÓRIO GERAL DE CLIENTES',
    'BASE CADASTRAL & ATENDIMENTOS',
    'RELATÓRIO DE CLIENTES',
    pageWidth,
    margin,
    y
  );

  // 2. Summary KPI Box
  const totalClients = clients.length;
  const totalOrders = workOrders.length;
  const totalBudgets = budgets.length;

  // Calculate total billing across these clients
  const clientIdsSet = new Set(clients.map(c => c.id));
  const relevantOrders = workOrders.filter(o => clientIdsSet.has(o.clientId));
  const totalBilled = relevantOrders
    .filter(o => o.status === 'concluida')
    .reduce((sum, o) => sum + (o.totalValue || 0), 0);

  const kpiBoxHeight = 17;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, kpiBoxHeight, 2, 2, 'FD');

  const colW = contentWidth / 4;

  // KPI 1: Clientes
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('CLIENTES LISTADOS', margin + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(String(totalClients), margin + 4, y + 12.5);

  // KPI 2: Total O.S
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('ORDENS DE SERVIÇO', margin + colW + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text(String(relevantOrders.length), margin + colW + 4, y + 12.5);

  // KPI 3: Orçamentos
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('ORÇAMENTOS EMITIDOS', margin + colW * 2 + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(String(totalBudgets), margin + colW * 2 + 4, y + 12.5);

  // KPI 4: Faturamento Concluído
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('FATURAMENTO CONCLUÍDO', margin + colW * 3 + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(formatCurrency(totalBilled), margin + colW * 3 + 4, y + 12.5);

  y += kpiBoxHeight + 4;

  // Filter notice if applied
  if (options?.typeFilter && options.typeFilter !== 'all') {
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Filtro por categoria: ${getClientTypeLabel(options.typeFilter as any)}`, margin + 1, y);
    y += 4;
  }

  // Helper to draw Table Header
  const drawTableHeader = (curY: number): number => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, curY, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);

    // Columns:
    // Cliente/Fantasia (54mm) | Tipo (20mm) | Documento (26mm) | Contato (34mm) | Localidade (30mm) | O.S / Orç (22mm)
    doc.text('CLIENTE / RAZÃO SOCIAL', margin + 3, curY + 4.8);
    doc.text('TIPO', margin + 56, curY + 4.8);
    doc.text('DOCUMENTO', margin + 78, curY + 4.8);
    doc.text('TELEFONE / EMAIL', margin + 106, curY + 4.8);
    doc.text('LOCALIDADE', margin + 140, curY + 4.8);
    doc.text('HISTÓRICO', margin + contentWidth - 3, curY + 4.8, { align: 'right' });

    return curY + 7;
  };

  y = drawTableHeader(y);

  // Table Rows
  if (clients.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Nenhum cliente cadastrado ou correspondente ao filtro.', margin + 4, y + 6);
    y += 10;
  } else {
    clients.forEach((c, index) => {
      // Row height: 9mm
      const rowHeight = 9.5;

      // Page break check
      if (y + rowHeight > pageHeight - 16) {
        doc.addPage();
        y = drawContinuationHeader(doc, company, 'Relatório Geral de Clientes', pageWidth, margin);
        y = drawTableHeader(y);
      }

      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');

      // Thin divider
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      // Client name & trade name
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const nameTrunc = c.name.length > 28 ? c.name.substring(0, 26) + '...' : c.name;
      doc.text(nameTrunc, margin + 3, y + 4.2);

      if (c.tradeName) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(2, 132, 199);
        const tradeTrunc = c.tradeName.length > 30 ? c.tradeName.substring(0, 28) + '...' : c.tradeName;
        doc.text(tradeTrunc, margin + 3, y + 7.8);
      }

      // Type Badge
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(getClientTypeLabel(c.type), margin + 56, y + 5.5);

      // Document (CPF / CNPJ)
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(c.document || 'Não informado', margin + 78, y + 5.5);

      // Phone & Email
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(c.phone || '-', margin + 106, y + 4.2);
      if (c.email) {
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        const emailTrunc = c.email.length > 22 ? c.email.substring(0, 20) + '...' : c.email;
        doc.text(emailTrunc, margin + 106, y + 7.8);
      }

      // Localidade (Bairro, Cidade - UF)
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      const locText = `${c.address.neighborhood || ''}, ${c.address.city || ''}-${c.address.state || ''}`;
      const locTrunc = locText.length > 24 ? locText.substring(0, 22) + '...' : locText;
      doc.text(locTrunc, margin + 140, y + 5.5);

      // Histórico: Count OS & Budgets
      const cOrders = workOrders.filter(o => o.clientId === c.id);
      const cBudgets = budgets.filter(b => b.clientId === c.id);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(2, 132, 199);
      doc.text(`${cOrders.length} OS`, margin + contentWidth - 14, y + 5.5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`| ${cBudgets.length} Orç.`, margin + contentWidth - 3, y + 5.5, { align: 'right' });

      y += rowHeight;
    });
  }

  // 3. Category Breakdown at Bottom
  y += 4;
  if (y + 14 > pageHeight - 16) {
    doc.addPage();
    y = drawContinuationHeader(doc, company, 'Relatório Geral de Clientes', pageWidth, margin);
  }

  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'F');

  const condCount = clients.filter(c => c.type === 'condominio').length;
  const resCount = clients.filter(c => c.type === 'residencial').length;
  const comCount = clients.filter(c => c.type === 'comercial').length;
  const indCount = clients.filter(c => c.type === 'industrial').length;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('DISTRIBUIÇÃO POR CATEGORIA DE CLIENTE:', margin + 4, y + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `• Condomínios: ${condCount}    • Residências: ${resCount}    • Comércios: ${comCount}    • Indústrias: ${indCount}`,
    margin + 4,
    y + 9
  );

  // Apply footers with page numbering
  addPageFooters(doc, 'Relatório de Clientes & Atendimentos', pageWidth, pageHeight);

  return doc;
}

export function downloadClientsReportPDF(
  clients: Client[],
  workOrders: WorkOrder[],
  budgets: Budget[],
  company: CompanySettings,
  options?: ClientsReportOptions
): string {
  const doc = buildClientsReportPDF(clients, workOrders, budgets, company, options);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const fileName = `Relatorio_Clientes_${dateStr}.pdf`;
  doc.save(fileName);
  return fileName;
}

/* -------------------------------------------------------------
 * 3. CLIENT DOSSIER & WORK ORDER HISTORY PDF
 * ------------------------------------------------------------- */

/**
 * Builds a dedicated PDF dossier for a single client with complete
 * profile details, address, property notes, and chronological Work Order history.
 */
export function buildClientHistoryPDF(
  client: Client,
  workOrders: WorkOrder[],
  budgets: Budget[],
  company: CompanySettings,
  technicians: Technician[]
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  let y = margin;

  // 1. Header
  y = drawReportHeader(
    doc,
    company,
    'DOSSIÊ & HISTÓRICO DO CLIENTE',
    'HISTÓRICO COMPLETO DE ATENDIMENTOS',
    'HISTÓRICO DO CLIENTE',
    pageWidth,
    margin,
    y
  );

  // 2. Client Profile Card
  const profileHeight = 29;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, profileHeight, 2, 2, 'FD');

  // Left col: Client Identity
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('DADOS DO CLIENTE & LOCALIZAÇÃO', margin + 4, y + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(client.name, margin + 4, y + 10.5);

  if (client.tradeName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(2, 132, 199);
    doc.text(`Nome Fantasia: ${client.tradeName}`, margin + 4, y + 15);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const fullAddress = `${client.address.street}, ${client.address.number}${client.address.complement ? ` (${client.address.complement})` : ''} - ${client.address.neighborhood}, ${client.address.city}/${client.address.state} • CEP: ${client.address.zipCode || 'Não inf.'}`;
  const addressLines = doc.splitTextToSize(`Endereço: ${fullAddress}`, 115);
  doc.text(addressLines, margin + 4, y + 20);

  // Right col: Metadata & Contacts
  const rightColX = margin + 120;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CONTATO & CADASTRO', rightColX, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Documento: ${client.document || 'Não informado'}`, rightColX, y + 10.5);
  doc.text(`Telefone: ${client.phone || '-'}`, rightColX, y + 15);
  if (client.email) {
    doc.text(`Email: ${client.email}`, rightColX, y + 19.5);
  }
  doc.text(`Tipo: ${getClientTypeLabel(client.type).toUpperCase()}`, rightColX, y + 24);

  y += profileHeight + 4;

  // Technical notes on the property (if any)
  if (client.notes) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(251, 191, 36); // amber-400
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('NOTAS TÉCNICAS DO IMÓVEL (CÂMERAS, ALARMES, PORTARIA, OBSERVAÇÕES):', margin + 4, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 53, 15);
    const splitNote = doc.splitTextToSize(client.notes, contentWidth - 8);
    doc.text(splitNote, margin + 4, y + 8.5);
    y += 14;
  }

  // 3. Client Work Orders List
  const clientOrders = workOrders
    .filter(o => o.clientId === client.id)
    .sort((a, b) => new Date(b.scheduledDate || b.createdAt).getTime() - new Date(a.scheduledDate || a.createdAt).getTime());

  const clientBudgets = budgets.filter(b => b.clientId === client.id);

  // KPI Mini Bar
  const totalBilled = clientOrders
    .filter(o => o.status === 'concluida')
    .reduce((sum, o) => sum + (o.totalValue || 0), 0);

  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`HISTÓRICO DE ATENDIMENTOS (${clientOrders.length} O.S. REGISTRADAS)`, margin + 4, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  const completedCount = clientOrders.filter(o => o.status === 'concluida').length;
  doc.text(
    `Concluídas: ${completedCount}  |  Em Aberto/Andamento: ${clientOrders.length - completedCount}  |  Faturamento Acumulado: ${formatCurrency(totalBilled)}`,
    margin + contentWidth - 4,
    y + 7.5,
    { align: 'right' }
  );

  y += 15;

  // Work Orders List Cards
  if (clientOrders.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 12, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('Nenhuma Ordem de Serviço registrada para este cliente até o momento.', margin + 4, y + 7.5);
    y += 15;
  } else {
    clientOrders.forEach((order, idx) => {
      // Calculate dynamic height needed
      const descLines = doc.splitTextToSize(`Descrição: ${order.description || 'Sem descrição'}`, contentWidth - 8);
      let reportLines: string[] = [];
      if (order.technicalReport) {
        reportLines = doc.splitTextToSize(`Laudo Técnico: ${order.technicalReport}`, contentWidth - 8);
      }

      const cardHeight = 22 + (descLines.length * 3.5) + (reportLines.length * 3.5) + (order.signature ? 6 : 0);

      // Page break check
      if (y + cardHeight > pageHeight - 16) {
        doc.addPage();
        y = drawContinuationHeader(doc, company, `Histórico do Cliente: ${client.name}`, pageWidth, margin);
      }

      // Card box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'FD');

      // Top OS bar inside card
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(margin, y, contentWidth, 6.5, 1.5, 1.5, 'F');

      // OS Number
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(order.osNumber, margin + 4, y + 4.5);

      // Type & Priority
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`Tipo: ${getOSTypeText(order.type)}  •  Prioridade: ${getPriorityLabel(order.priority)}`, margin + 34, y + 4.5);

      // Date
      doc.text(`Data: ${formatDateBR(order.scheduledDate)} ${order.scheduledTime ? `às ${order.scheduledTime}` : ''}`, margin + 110, y + 4.5);

      // Status Badge
      const statusLabel = getOSStatusText(order.status).toUpperCase();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (order.status === 'concluida') {
        doc.setTextColor(16, 185, 129); // emerald
      } else if (order.status === 'em_andamento') {
        doc.setTextColor(6, 182, 212); // cyan
      } else if (order.status === 'cancelada') {
        doc.setTextColor(239, 68, 68); // red
      } else {
        doc.setTextColor(245, 158, 11); // amber
      }
      doc.text(`[ ${statusLabel} ]`, margin + contentWidth - 4, y + 4.5, { align: 'right' });

      let insideY = y + 10;

      // Technicians
      const orderTechs = technicians.filter(t => order.assignedTechnicianIds.includes(t.id));
      const techNames = orderTechs.length > 0 ? orderTechs.map(t => t.name).join(', ') : 'Não informado';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Técnico(s) Responsável(is): ', margin + 4, insideY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(techNames, margin + 38, insideY);

      insideY += 4.5;

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(descLines, margin + 4, insideY);
      insideY += descLines.length * 3.5;

      // Technical report if present
      if (reportLines.length > 0) {
        doc.setTextColor(2, 132, 199);
        doc.setFont('helvetica', 'bold');
        doc.text('Laudo do Atendimento: ', margin + 4, insideY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(reportLines, margin + 4, insideY + 3.5);
        insideY += (reportLines.length * 3.5) + 3.5;
      }

      // Financial Total & Signature on bottom line of card
      doc.setDrawColor(241, 245, 249);
      doc.line(margin + 4, insideY, margin + contentWidth - 4, insideY);
      insideY += 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Total da O.S:', margin + 4, insideY);
      doc.setTextColor(2, 132, 199);
      doc.text(formatCurrency(order.totalValue), margin + 24, insideY);

      if (order.laborValue || order.partsValue) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`(Serviços: ${formatCurrency(order.laborValue || 0)}  |  Peças: ${formatCurrency(order.partsValue || 0)})`, margin + 50, insideY);
      }

      if (order.signature) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(16, 185, 129);
        doc.text(
          `Assinado eletronicamente por: ${order.signature.signedBy || 'Cliente'} em ${formatDateBR(order.signature.signedAt)}`,
          margin + contentWidth - 4,
          insideY,
          { align: 'right' }
        );
      }

      y += cardHeight + 3.5;
    });
  }

  // 4. Client Budgets List (if any)
  if (clientBudgets.length > 0) {
    if (y + 25 > pageHeight - 16) {
      doc.addPage();
      y = drawContinuationHeader(doc, company, `Histórico do Cliente: ${client.name}`, pageWidth, margin);
    }

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`ORÇAMENTOS COMERCIAIS REGISTRADOS (${clientBudgets.length})`, margin + 4, y + 4.2);

    y += 7;

    clientBudgets.forEach((bud, bIdx) => {
      if (y + 7 > pageHeight - 16) {
        doc.addPage();
        y = drawContinuationHeader(doc, company, `Histórico do Cliente: ${client.name}`, pageWidth, margin);
      }

      const isEven = bIdx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, 6.5, 'F');

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(bud.budgetNumber, margin + 4, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Data: ${formatDateBR(bud.createdAt)}`, margin + 30, y + 4.2);

      const titleTrunc = bud.title.length > 45 ? bud.title.substring(0, 42) + '...' : bud.title;
      doc.text(titleTrunc, margin + 65, y + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text(formatCurrency(bud.totalValue), margin + contentWidth - 4, y + 4.2, { align: 'right' });

      y += 6.5;
    });
  }

  // Apply footers
  addPageFooters(doc, `Histórico de Atendimentos - ${client.name}`, pageWidth, pageHeight);

  return doc;
}

export function downloadClientHistoryPDF(
  client: Client,
  workOrders: WorkOrder[],
  budgets: Budget[],
  company: CompanySettings,
  technicians: Technician[]
): string {
  const doc = buildClientHistoryPDF(client, workOrders, budgets, company, technicians);
  const cleanName = client.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const fileName = `Historico_Cliente_${cleanName}_${dateStr}.pdf`;
  doc.save(fileName);
  return fileName;
}

/* -------------------------------------------------------------
 * 4. WORK ORDERS HISTORY REPORT PDF (Histórico Geral de O.S)
 * ------------------------------------------------------------- */

export interface WorkOrdersHistoryOptions {
  statusFilter?: string;
  techIdFilter?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

/**
 * Builds a complete Work Orders History report with financial breakdown,
 * technicians, execution status, and date filtering.
 */
export function buildWorkOrdersHistoryReportPDF(
  workOrders: WorkOrder[],
  technicians: Technician[],
  company: CompanySettings,
  options?: WorkOrdersHistoryOptions
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  let y = margin;

  // 1. Header
  y = drawReportHeader(
    doc,
    company,
    'RELATÓRIO DE HISTÓRICO DE ORDENS DE SERVIÇO',
    'CONTROLE GERAL DE ATENDIMENTOS',
    'HISTÓRICO DE O.S.',
    pageWidth,
    margin,
    y
  );

  // 2. Summary KPI Box
  const totalOrders = workOrders.length;
  const completedOrders = workOrders.filter(o => o.status === 'concluida');
  const inProgressOrders = workOrders.filter(o => o.status === 'em_andamento' || o.status === 'em_deslocamento');
  const openOrders = workOrders.filter(o => o.status === 'aberta' || o.status === 'aguardando_peca');
  const cancelledOrders = workOrders.filter(o => o.status === 'cancelada');

  const totalLabor = workOrders.reduce((sum, o) => sum + (o.laborValue || 0), 0);
  const totalParts = workOrders.reduce((sum, o) => sum + (o.partsValue || 0), 0);
  const totalRevenue = workOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
  const completedRevenue = completedOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);

  const kpiBoxHeight = 20;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, kpiBoxHeight, 2, 2, 'FD');

  const colW = contentWidth / 4;

  // KPI 1: Total OS
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('TOTAL DE O.S.', margin + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(String(totalOrders), margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${completedOrders.length} concluídas`, margin + 4, y + 16.5);

  // KPI 2: Em Execução / Abertas
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('EM ANDAMENTO / ABERTAS', margin + colW + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text(String(inProgressOrders.length + openOrders.length), margin + colW + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${inProgressOrders.length} em campo  •  ${openOrders.length} abertas`, margin + colW + 4, y + 16.5);

  // KPI 3: Serviços vs Peças
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('SERVIÇOS / PEÇAS', margin + colW * 2 + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`M.O: ${formatCurrency(totalLabor)}`, margin + colW * 2 + 4, y + 11.5);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Peças: ${formatCurrency(totalParts)}`, margin + colW * 2 + 4, y + 16.5);

  // KPI 4: Faturamento Concluído
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('FATURAMENTO CONCLUÍDO', margin + colW * 3 + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(formatCurrency(completedRevenue), margin + colW * 3 + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total geral: ${formatCurrency(totalRevenue)}`, margin + colW * 3 + 4, y + 16.5);

  y += kpiBoxHeight + 4;

  // Active filters note
  const filterDesc: string[] = [];
  if (options?.statusFilter && options.statusFilter !== 'all') {
    filterDesc.push(`Status: ${getOSStatusText(options.statusFilter as any)}`);
  }
  if (options?.techIdFilter && options.techIdFilter !== 'all') {
    const tech = technicians.find(t => t.id === options.techIdFilter);
    if (tech) filterDesc.push(`Técnico: ${tech.name}`);
  }
  if (options?.startDate || options?.endDate) {
    filterDesc.push(`Período: ${options.startDate ? formatDateBR(options.startDate) : 'Início'} até ${options.endDate ? formatDateBR(options.endDate) : 'Hoje'}`);
  }

  if (filterDesc.length > 0) {
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Filtros ativos: ${filterDesc.join('  •  ')}`, margin + 1, y);
    y += 4;
  }

  // Helper to draw Table Header
  const drawTableHeader = (curY: number): number => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, curY, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);

    // Columns:
    // Nº O.S (24mm) | DATA (22mm) | CLIENTE (50mm) | TIPO / SERVIÇO (40mm) | TÉCNICO (26mm) | STATUS & TOTAL (24mm)
    doc.text('Nº O.S.', margin + 3, curY + 4.8);
    doc.text('DATA / HORA', margin + 27, curY + 4.8);
    doc.text('CLIENTE & LOCAL', margin + 50, curY + 4.8);
    doc.text('TIPO DE SERVIÇO', margin + 102, curY + 4.8);
    doc.text('TÉCNICO', margin + 138, curY + 4.8);
    doc.text('STATUS / TOTAL', margin + contentWidth - 3, curY + 4.8, { align: 'right' });

    return curY + 7;
  };

  y = drawTableHeader(y);

  if (workOrders.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Nenhuma Ordem de Serviço encontrada para os filtros selecionados.', margin + 4, y + 6);
    y += 10;
  } else {
    workOrders.forEach((order, index) => {
      const rowHeight = 9.5;

      // Page break check
      if (y + rowHeight > pageHeight - 16) {
        doc.addPage();
        y = drawContinuationHeader(doc, company, 'Histórico de Ordens de Serviço', pageWidth, margin);
        y = drawTableHeader(y);
      }

      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');

      // Thin divider
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      // Nº O.S
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(order.osNumber, margin + 3, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(getPriorityLabel(order.priority), margin + 3, y + 7.8);

      // Data / Hora
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(formatDateBR(order.scheduledDate), margin + 27, y + 4.2);
      if (order.scheduledTime) {
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(order.scheduledTime, margin + 27, y + 7.8);
      }

      // Cliente & Endereço
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const clientTrunc = order.clientName.length > 27 ? order.clientName.substring(0, 25) + '...' : order.clientName;
      doc.text(clientTrunc, margin + 50, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const addrTrunc = order.clientAddress ? (order.clientAddress.length > 30 ? order.clientAddress.substring(0, 28) + '...' : order.clientAddress) : '';
      doc.text(addrTrunc, margin + 50, y + 7.8);

      // Tipo de Serviço
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(getOSTypeText(order.type), margin + 102, y + 4.2);

      const descSnippet = order.description ? (order.description.length > 25 ? order.description.substring(0, 23) + '...' : order.description) : '';
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(descSnippet, margin + 102, y + 7.8);

      // Técnico
      const assigned = technicians.filter(t => order.assignedTechnicianIds.includes(t.id));
      const techDisplay = assigned.length > 0 ? assigned[0].name.split(' ')[0] : 'Não def.';
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(techDisplay, margin + 138, y + 5.5);

      // Status & Total
      const statusText = getOSStatusText(order.status);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      if (order.status === 'concluida') {
        doc.setTextColor(16, 185, 129);
      } else if (order.status === 'cancelada') {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(2, 132, 199);
      }
      doc.text(statusText, margin + contentWidth - 3, y + 4.2, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(order.totalValue), margin + contentWidth - 3, y + 7.8, { align: 'right' });

      y += rowHeight;
    });
  }

  // Financial summary bar at bottom
  y += 4;
  if (y + 12 > pageHeight - 16) {
    doc.addPage();
    y = drawContinuationHeader(doc, company, 'Histórico de Ordens de Serviço', pageWidth, margin);
  }

  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TOTALIZAÇÃO DO RELATÓRIO:', margin + 4, y + 6.2);

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Total de Atendimentos: ${workOrders.length}`, margin + 52, y + 6.2);
  doc.text(`Concluídas: ${completedOrders.length}`, margin + 102, y + 6.2);

  doc.setTextColor(34, 211, 238); // cyan-400
  doc.text(`Faturamento: ${formatCurrency(completedRevenue)}`, margin + contentWidth - 4, y + 6.2, { align: 'right' });

  // Apply footers
  addPageFooters(doc, 'Relatório de Histórico de Ordens de Serviço', pageWidth, pageHeight);

  return doc;
}

export function downloadWorkOrdersHistoryPDF(
  workOrders: WorkOrder[],
  technicians: Technician[],
  company: CompanySettings,
  options?: WorkOrdersHistoryOptions
): string {
  const doc = buildWorkOrdersHistoryReportPDF(workOrders, technicians, company, options);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const fileName = `Relatorio_Historico_OS_${dateStr}.pdf`;
  doc.save(fileName);
  return fileName;
}
