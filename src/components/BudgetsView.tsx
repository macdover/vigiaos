import React, { useState } from 'react';
import { 
  Budget, 
  BudgetStatus, 
  CompanySettings 
} from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  Share2, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Calendar, 
  DollarSign, 
  Trash2,
  Check,
  FileDown,
  Send,
  CheckCheck,
  X
} from 'lucide-react';
import { formatCurrency, formatDateBR, generateWhatsAppLink } from '../utils/storage';
import { downloadBudgetPDF, sendBudgetPDFToWhatsApp } from '../utils/pdfGenerator';

interface BudgetsViewProps {
  budgets: Budget[];
  company: CompanySettings;
  onOpenNewBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onConvertToOS: (budget: Budget) => void;
  onUpdateBudget: (budget: Budget) => void;
  onDeleteBudget?: (budgetId: string) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  company,
  onOpenNewBudget,
  onEditBudget,
  onConvertToOS,
  onUpdateBudget,
  onDeleteBudget,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingPrintBudget, setViewingPrintBudget] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string; fileName?: string } | null>(null);

  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch =
      b.budgetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendPDFToWhatsApp = async (b: Budget) => {
    setIsProcessingPdf(true);
    try {
      const result = await sendBudgetPDFToWhatsApp(b, company);
      setToastMsg({
        title: 'Orçamento em PDF Pronto!',
        desc: result.sharedViaNative
          ? `A proposta em PDF (${result.fileName}) foi compartilhada diretamente!`
          : `O arquivo PDF (${result.fileName}) foi salvo no seu aparelho e a conversa do WhatsApp com ${b.clientName} foi aberta. Agora basta anexar o PDF na conversa!`,
        fileName: result.fileName,
      });
    } catch (e) {
      console.error('Error generating budget PDF:', e);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleDownloadPDF = (b: Budget) => {
    try {
      const fileName = downloadBudgetPDF(b, company);
      setToastMsg({
        title: 'Download Concluído!',
        desc: `O arquivo ${fileName} foi baixado com sucesso no seu dispositivo.`,
        fileName,
      });
    } catch (e) {
      console.error('Error downloading budget PDF:', e);
    }
  };

  const handleSendWhatsApp = (b: Budget) => {
    handleSendPDFToWhatsApp(b);
  };

  const getStatusBadge = (status: BudgetStatus) => {
    switch (status) {
      case 'pendente':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Pendente</span>;
      case 'aprovado':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Aprovado</span>;
      case 'rejeitado':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Rejeitado</span>;
      case 'convertido_em_os':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Convertido em O.S</span>;
    }
  };

  // If viewing printable budget
  if (viewingPrintBudget) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <button
            type="button"
            onClick={() => setViewingPrintBudget(null)}
            className="text-xs font-semibold text-slate-300 hover:text-white"
          >
            ← Voltar para Lista de Orçamentos
          </button>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isProcessingPdf}
              onClick={() => handleSendPDFToWhatsApp(viewingPrintBudget)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition-all disabled:opacity-50"
              title="Mandar o orçamento em PDF para o WhatsApp do cliente"
            >
              <Share2 className="w-4 h-4" />
              {isProcessingPdf ? 'Gerando PDF...' : 'Mandar PDF no WhatsApp'}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPDF(viewingPrintBudget)}
              className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition-all"
              title="Baixar arquivo PDF no dispositivo"
            >
              <FileDown className="w-4 h-4" />
              Baixar PDF
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg shadow cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Floating Toast inside print preview */}
        {toastMsg && (
          <div className="print:hidden bg-emerald-950/90 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg text-white">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{toastMsg.title}</p>
                <p className="text-xs text-emerald-200">{toastMsg.desc}</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setToastMsg(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 print:border-none print:shadow-none print:p-0 font-sans text-xs sm:text-sm">
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              {company.logoUrl && (
                <div className="h-14 max-w-[160px] p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  <img src={company.logoUrl} alt={company.name} className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-slate-950">{company.name}</h1>
                <p className="text-xs text-slate-600">CNPJ: {company.cnpj} • Tel: {company.phone} / WhatsApp: {company.whatsapp}</p>
                <p className="text-xs text-slate-600">{company.address}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Proposta Comercial</span>
              <span className="font-mono text-2xl font-black text-slate-900">{viewingPrintBudget.budgetNumber}</span>
              <p className="text-xs text-slate-600 mt-1">Data: {formatDateBR(viewingPrintBudget.createdAt)}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Dados do Cliente</h3>
            <p className="font-bold text-slate-900 text-sm">{viewingPrintBudget.clientName}</p>
            <p className="text-slate-700">Contato: {viewingPrintBudget.clientPhone} • {viewingPrintBudget.clientEmail}</p>
            <p className="text-slate-600 text-xs">{viewingPrintBudget.clientAddress}</p>
          </div>

          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Escopo do Projeto</h3>
            <p className="text-sm font-semibold text-slate-900 bg-cyan-50/50 p-3 rounded-lg border border-cyan-100">
              {viewingPrintBudget.title}
            </p>
          </div>

          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Composição de Materiais e Serviços</h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">Item / Descrição</th>
                  <th className="py-2.5 px-2">Tipo</th>
                  <th className="py-2.5 px-2 text-center">Qtd</th>
                  <th className="py-2.5 px-2 text-right">Unitário</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {viewingPrintBudget.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3 font-semibold text-slate-900">{it.name}</td>
                    <td className="py-2 px-2 text-slate-600">{it.type === 'service' ? 'Serviço' : 'Equipamento'}</td>
                    <td className="py-2 px-2 text-center font-mono">{it.quantity}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(it.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-2 px-3 text-right text-slate-600">Total de Equipamentos:</td>
                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(viewingPrintBudget.partsValue)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-2 px-3 text-right text-slate-600">Total de Mão de Obra Especializada:</td>
                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(viewingPrintBudget.laborValue)}</td>
                </tr>
                {viewingPrintBudget.discountValue > 0 && (
                  <tr>
                    <td colSpan={4} className="py-2 px-3 text-right text-emerald-700">Desconto Especial Concedido:</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">-{formatCurrency(viewingPrintBudget.discountValue)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-slate-900 bg-slate-100">
                  <td colSpan={4} className="py-3 px-3 text-right text-sm font-black text-slate-900 uppercase">Valor Total do Projeto:</td>
                  <td className="py-3 px-3 text-right font-mono text-base font-black text-slate-950">
                    {formatCurrency(viewingPrintBudget.totalValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <div>
              <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-1">Condições de Pagamento</h4>
              <p className="text-slate-800 font-semibold">{viewingPrintBudget.paymentTerms}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-1">Validade & Prazos</h4>
              <p className="text-slate-800">Proposta válida por <strong>{viewingPrintBudget.validityDays} dias</strong> a partir da data de emissão.</p>
            </div>
          </div>

          {viewingPrintBudget.notes && (
            <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
              <strong>Observações Técnicas:</strong> {viewingPrintBudget.notes}
            </div>
          )}

          <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs">
            <div>
              <p className="font-bold text-slate-900">{company.name}</p>
              <p className="text-slate-500">Departamento Comercial</p>
            </div>
            <div className="text-right border-t border-slate-400 pt-1 w-64">
              <p className="font-bold text-slate-900">De Acordo do Cliente</p>
              <p className="text-slate-500">{viewingPrintBudget.clientName}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Orçamentos & Propostas
          </h1>
          <p className="text-xs text-slate-400">
            Envio rápido pelo WhatsApp, aprovação de propostas e conversão em O.S
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewBudget}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número, cliente ou projeto..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
            <option value="convertido_em_os">Convertido em O.S</option>
          </select>
        </div>
      </div>

      {/* Budgets List */}
      {filteredBudgets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400 text-xs">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          Nenhum orçamento encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBudgets.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-cyan-400">{b.budgetNumber}</span>
                  {getStatusBadge(b.status)}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {formatDateBR(b.createdAt)}
                  </span>
                  <span className="font-mono font-bold text-white text-base">
                    {formatCurrency(b.totalValue)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Cliente</p>
                  <p className="text-sm font-bold text-white">{b.clientName}</p>
                  <p className="text-xs text-slate-400">{b.clientPhone}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Projeto / Objeto</p>
                  <p className="text-xs text-slate-200 font-medium">{b.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {b.items.length} itens inclusos • {b.paymentTerms}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  {b.status === 'pendente' && (
                    <button
                      type="button"
                      onClick={() => onUpdateBudget({ ...b, status: 'aprovado' })}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 rounded-lg hover:bg-emerald-900/60 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Marcar como Aprovado
                    </button>
                  )}

                  {b.status === 'aprovado' && (
                    <button
                      type="button"
                      onClick={() => onConvertToOS(b)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Converter em Ordem de Serviço
                    </button>
                  )}

                  {b.status === 'convertido_em_os' && (
                    <span className="text-xs text-cyan-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      O.S Gerada com sucesso
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={isProcessingPdf}
                    onClick={() => handleSendPDFToWhatsApp(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                    title="Mandar o orçamento em PDF direto para o WhatsApp do cliente"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    PDF no WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(b)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    title="Baixar Arquivo PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Baixar
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingPrintBudget(b)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    title="Visualizar Proposta / Imprimir"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    Ver
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditBudget(b)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Editar Orçamento"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {onDeleteBudget && (
                    <button
                      type="button"
                      onClick={() => setBudgetToDelete(b)}
                      className="p-1.5 bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-800/60 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Orçamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shrink-0 mt-0.5">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{toastMsg.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toastMsg.desc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal to Delete Budget */}
      {budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Orçamento</h3>
                <p className="text-xs text-slate-400">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Orçamento:</span>
                <span className="font-mono font-bold text-cyan-400">{budgetToDelete.budgetNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-semibold text-white">{budgetToDelete.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Projeto:</span>
                <span className="text-slate-200 truncate max-w-[200px]">{budgetToDelete.title}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Valor Total:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(budgetToDelete.totalValue)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteBudget && budgetToDelete) {
                    onDeleteBudget(budgetToDelete.id);
                    setBudgetToDelete(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
