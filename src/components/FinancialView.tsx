import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Barcode, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Share2, 
  Building2, 
  Users, 
  HardHat, 
  Percent, 
  Shield, 
  Key, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Fuel,
  Package,
  Calendar,
  Lock,
  Unlock,
  BookOpen
} from 'lucide-react';
import { 
  FinancialTransaction, 
  FinancialOperator, 
  Client, 
  Technician, 
  WorkOrder, 
  CompanySettings, 
  CurrentUser, 
  TransactionCategory, 
  PaymentMethod 
} from '../types';
import { formatCurrency, formatDateBR, generateWhatsAppLink } from '../utils/storage';
import { downloadCashFlowReportPDF, downloadReceiptPDF, downloadBoletoPDF } from '../utils/financialPdfGenerator';
import { downloadFinancialManualPDF } from '../utils/manualPdfGenerator';
import { BillingModal } from './BillingModal';

interface FinancialViewProps {
  transactions: FinancialTransaction[];
  financialOperators: FinancialOperator[];
  clients: Client[];
  technicians: Technician[];
  workOrders: WorkOrder[];
  company: CompanySettings;
  currentUser: CurrentUser;
  onSaveTransaction: (transaction: FinancialTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSaveFinancialOperator: (operator: FinancialOperator) => void;
  onDeleteFinancialOperator: (id: string) => void;
  onSaveCompany: (company: CompanySettings) => void;
  onSwitchToFinancialUser?: (op: FinancialOperator) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  transactions = [],
  financialOperators = [],
  clients = [],
  technicians = [],
  workOrders = [],
  company,
  currentUser,
  onSaveTransaction,
  onDeleteTransaction,
  onSaveFinancialOperator,
  onDeleteFinancialOperator,
  onSaveCompany,
  onSwitchToFinancialUser,
}) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.isMasterAuth;
  const isFinancialOp = currentUser.role === 'financial';
  const opPerms = isFinancialOp ? {
    canManagePayables: true,
    canManageReceivables: true,
    canIssueBoletosPix: true,
    canViewDRE: true,
    canManageCommissions: true,
  } : {
    canManagePayables: true,
    canManageReceivables: true,
    canIssueBoletosPix: true,
    canViewDRE: true,
    canManageCommissions: true,
  };

  // Subtabs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'receivables' | 'payables' | 'commissions' | 'team' | 'settings'>('overview');

  // Modals
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingTargetWorkOrder, setBillingTargetWorkOrder] = useState<WorkOrder | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<TransactionCategory>('pecas_fornecedores');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDueDate, setExpenseDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>('pix');
  const [expenseStatus, setExpenseStatus] = useState<'pendente' | 'pago'>('pago');

  // Operator Modal State
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<FinancialOperator | null>(null);
  const [opName, setOpName] = useState('');
  const [opEmail, setOpEmail] = useState('');
  const [opPhone, setOpPhone] = useState('');
  const [opPassword, setOpPassword] = useState('123');
  const [opCanPayables, setOpCanPayables] = useState(true);
  const [opCanReceivables, setOpCanReceivables] = useState(true);
  const [opCanBoletosPix, setOpCanBoletosPix] = useState(true);
  const [opCanDRE, setOpCanDRE] = useState(true);
  const [opCanCommissions, setOpCanCommissions] = useState(true);
  const [opCanDownloadManual, setOpCanDownloadManual] = useState(true);
  const [manualFeedback, setManualFeedback] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago' | 'atrasado'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Financial Company Settings State
  const [pixKeyType, setPixKeyType] = useState(company?.pixKeyType || 'cnpj');
  const [pixKey, setPixKey] = useState(company?.pixKey || company?.cnpj || '11.601.831/0001-35');
  const [pixBeneficiary, setPixBeneficiary] = useState(company?.pixBeneficiaryName || company?.tradeName || 'MPS Telefonia & Segurança');
  const [pixCity, setPixCity] = useState(company?.pixCity || 'Rio de Janeiro');
  const [bankName, setBankName] = useState(company?.bankName || 'Banco Itaú S.A. (341-7)');
  const [bankAgency, setBankAgency] = useState(company?.bankAgency || '0450');
  const [bankAccount, setBankAccount] = useState(company?.bankAccount || '12345-6');
  const [defaultCommissionRate, setDefaultCommissionRate] = useState(company?.defaultTechnicianCommissionRate ?? 15);
  const [boletoInstructions, setBoletoInstructions] = useState(
    company?.defaultBoletoInstructions || 'Referente a prestação de serviços técnicos de segurança eletrônica.'
  );
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  // KPIs
  const metrics = useMemo(() => {
    let totalReceitasPagas = 0;
    let totalReceitasPendentes = 0;
    let totalDespesasPagas = 0;
    let totalDespesasPendentes = 0;
    let totalVisitasAvulsas = 0;
    let totalComissoesPendentes = 0;
    let totalComissoesPagas = 0;

    transactions.forEach((t) => {
      if (t.type === 'receita') {
        if (t.status === 'pago') totalReceitasPagas += t.amount;
        else if (t.status === 'pendente' || t.status === 'atrasado') totalReceitasPendentes += t.amount;

        if (t.isAvulso) totalVisitasAvulsas += t.amount;

        if (t.commissionAmount) {
          if (t.status === 'pago') totalComissoesPagas += t.commissionAmount;
          else totalComissoesPendentes += t.commissionAmount;
        }
      } else {
        if (t.status === 'pago') totalDespesasPagas += t.amount;
        else if (t.status === 'pendente' || t.status === 'atrasado') totalDespesasPendentes += t.amount;
      }
    });

    const saldoLiquido = totalReceitasPagas - totalDespesasPagas;

    return {
      totalReceitasPagas,
      totalReceitasPendentes,
      totalDespesasPagas,
      totalDespesasPendentes,
      saldoLiquido,
      totalVisitasAvulsas,
      totalComissoesPendentes,
      totalComissoesPagas,
    };
  }, [transactions]);

  // Filtered lists
  const receivables = useMemo(() => {
    return transactions.filter((t) => t.type === 'receita');
  }, [transactions]);

  const payables = useMemo(() => {
    return transactions.filter((t) => t.type === 'despesa');
  }, [transactions]);

  const filteredReceivables = useMemo(() => {
    return receivables.filter((t) => {
      const matchSearch =
        (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.workOrderNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'avulso' && t.isAvulso) ||
        (categoryFilter === 'os' && !t.isAvulso);
      return matchSearch && matchStatus && matchCategory;
    });
  }, [receivables, searchTerm, statusFilter, categoryFilter]);

  const filteredPayables = useMemo(() => {
    return payables.filter((t) => {
      const matchSearch =
        (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payables, searchTerm, statusFilter]);

  // Commissions grouping
  const technicianCommissions = useMemo(() => {
    const map = new Map<string, { tech: Technician | null; pending: number; paid: number; items: FinancialTransaction[] }>();

    transactions
      .filter((t) => t.commissionAmount && t.technicianName)
      .forEach((t) => {
        const key = t.technicianId || t.technicianName || 'Técnico';
        if (!map.has(key)) {
          const matched = technicians.find((tech) => tech.id === t.technicianId || tech.name === t.technicianName) || null;
          map.set(key, { tech: matched, pending: 0, paid: 0, items: [] });
        }
        const record = map.get(key)!;
        record.items.push(t);
        if (t.status === 'pago') {
          record.paid += t.commissionAmount || 0;
        } else {
          record.pending += t.commissionAmount || 0;
        }
      });

    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      name: data.tech?.name || key,
      phone: data.tech?.phone,
      pending: data.pending,
      paid: data.paid,
      total: data.pending + data.paid,
      items: data.items,
    }));
  }, [transactions, technicians]);

  // Handlers
  const handleQuickMarkPaid = (t: FinancialTransaction) => {
    onSaveTransaction({
      ...t,
      status: 'pago',
      paymentDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) return;

    const newExpense: FinancialTransaction = {
      id: `trans-desp-${Date.now()}`,
      tenantId: company?.id || 'tenant-mps-telefonia',
      type: 'despesa',
      title: expenseTitle,
      category: expenseCategory,
      amount: expenseAmount,
      dueDate: expenseDueDate,
      paymentDate: expenseStatus === 'pago' ? expenseDueDate : undefined,
      status: expenseStatus,
      paymentMethod: expenseMethod,
      supplierName: expenseSupplier,
      createdAt: new Date().toISOString(),
    };

    onSaveTransaction(newExpense);
    setIsExpenseModalOpen(false);
    setExpenseTitle('');
    setExpenseAmount(0);
    setExpenseSupplier('');
  };

  const handleSaveOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName.trim() || !opEmail.trim()) return;

    const newOp: FinancialOperator = {
      id: editingOperator?.id || `fin-op-${Date.now()}`,
      tenantId: company?.id || 'tenant-mps-telefonia',
      name: opName,
      email: opEmail,
      phone: opPhone,
      password: opPassword || '123',
      active: true,
      avatarColor: 'from-emerald-600 to-teal-600',
      canManagePayables: opCanPayables,
      canManageReceivables: opCanReceivables,
      canIssueBoletosPix: opCanBoletosPix,
      canViewDRE: opCanDRE,
      canManageCommissions: opCanCommissions,
      canDownloadManual: opCanDownloadManual,
      createdAt: editingOperator?.createdAt || new Date().toISOString(),
    };

    onSaveFinancialOperator(newOp);
    setIsOperatorModalOpen(false);
    setEditingOperator(null);
  };

  const handleOpenEditOperator = (op: FinancialOperator) => {
    setEditingOperator(op);
    setOpName(op.name);
    setOpEmail(op.email);
    setOpPhone(op.phone);
    setOpPassword(op.password || '123');
    setOpCanPayables(op.canManagePayables !== false);
    setOpCanReceivables(op.canManageReceivables !== false);
    setOpCanBoletosPix(op.canIssueBoletosPix !== false);
    setOpCanDRE(op.canViewDRE !== false);
    setOpCanCommissions(op.canManageCommissions !== false);
    setOpCanDownloadManual(op.canDownloadManual !== false);
    setIsOperatorModalOpen(true);
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanySettings = {
      ...company,
      pixKeyType: pixKeyType as any,
      pixKey,
      pixBeneficiaryName: pixBeneficiary,
      pixCity,
      bankName,
      bankAgency,
      bankAccount,
      defaultTechnicianCommissionRate: Number(defaultCommissionRate),
      defaultBoletoInstructions: boletoInstructions,
    };
    onSaveCompany(updated);
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
      {/* Top Banner / Access Control Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-900/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Módulo Financeiro & Cobrança
              </h2>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                Acesso Restrito ao Dono & Financeiro
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Gestão de caixa, emissão de Pix instantâneo, boletos registrados, contas a pagar e comissões técnicas
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Manual Financeiro (PDF) */}
          {(isAdmin || (!currentUser.financialData || currentUser.financialData.canDownloadManual !== false)) ? (
            <button
              type="button"
              onClick={() => {
                downloadFinancialManualPDF(company);
                setManualFeedback('Manual do Operador Financeiro baixado em PDF com sucesso!');
                setTimeout(() => setManualFeedback(null), 4000);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Baixar Manual Oficial do Operador Financeiro em PDF"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Manual Financeiro (PDF)</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Manual Bloqueado pelo ADM
            </span>
          )}

          <button
            type="button"
            onClick={() => downloadCashFlowReportPDF(transactions, company)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-sm"
            title="Baixar Demonstrativo Financeiro e Fluxo de Caixa completo em PDF"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar DRE (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBillingTargetWorkOrder(null);
              setEditingTransaction(null);
              setIsBillingModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-emerald-950/40"
          >
            <QrCode className="w-4 h-4" />
            <span>Emitir Pix & Boleto</span>
          </button>
        </div>
      </div>

      {/* Manual Feedback Alert */}
      {manualFeedback && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{manualFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setManualFeedback(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Visão Geral & Fluxo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('receivables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'receivables'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          <span>Contas a Receber ({receivables.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('payables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'payables'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-red-400" />
          <span>Contas a Pagar ({payables.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('commissions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'commissions'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Percent className="w-4 h-4 text-amber-400" />
          <span>Comissões Técnicas</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveSubTab('team')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'team'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Equipe Financeira ({financialOperators.length})</span>
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>Chave Pix & Banco</span>
          </button>
        )}
      </div>

      {/* SUBTAB 1: Visão Geral / DRE */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Saldo Líquido */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Saldo em Caixa</span>
                <span className={`w-2.5 h-2.5 rounded-full ${metrics.saldoLiquido >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
              <div className="mt-3">
                <span className={`text-2xl font-black ${metrics.saldoLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(metrics.saldoLiquido)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Resultado Líquido Atual</p>
              </div>
            </div>

            {/* Receitas Recebidas */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Total Recebido</span>
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white">{formatCurrency(metrics.totalReceitasPagas)}</span>
                <p className="text-[11px] text-emerald-400 mt-1">✓ Pagamentos Confirmados</p>
              </div>
            </div>

            {/* A Receber Pendente */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Contas a Receber</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-cyan-300">{formatCurrency(metrics.totalReceitasPendentes)}</span>
                <p className="text-[11px] text-slate-400 mt-1">Boletos e Pix em aberto</p>
              </div>
            </div>

            {/* Despesas Pagas */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Despesas Pagas</span>
                <ArrowUpRight className="w-4 h-4 text-red-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-red-400">{formatCurrency(metrics.totalDespesasPagas)}</span>
                <p className="text-[11px] text-slate-500 mt-1">Peças, combustível e comissões</p>
              </div>
            </div>

            {/* A Pagar Pendente */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>A Pagar Pendente</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-amber-400">{formatCurrency(metrics.totalDespesasPendentes)}</span>
                <p className="text-[11px] text-slate-500 mt-1">Contas e fornecedores a vencer</p>
              </div>
            </div>
          </div>

          {/* Quick Action Banner: Visitas Avulsas e Cobrança */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Recebimento de Atendimentos & Visitas Avulsas
                </h4>
                <p className="text-xs text-slate-400">
                  Total faturado em atendimentos avulsos no local:{' '}
                  <span className="font-bold text-amber-400">{formatCurrency(metrics.totalVisitasAvulsas)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setBillingTargetWorkOrder(null);
                  setEditingTransaction(null);
                  setIsBillingModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cobrar Visita Avulsa</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-red-400" />
                <span>Lançar Despesa</span>
              </button>
            </div>
          </div>

          {/* Recent Operations Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Receivables */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">Recebimentos Recentes</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('receivables')}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Ver todos ({receivables.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {receivables.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate max-w-[200px]">{t.title}</span>
                        {t.isAvulso && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-800 rounded">
                            Avulso
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {t.clientName || 'Cliente'} • Venc: {formatDateBR(t.dueDate)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-400 text-sm block">{formatCurrency(t.amount)}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          t.status === 'pago'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {t.status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payables */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-red-400" />
                  <h3 className="font-bold text-white text-sm">Despesas Operacionais Recentes</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('payables')}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Ver todas ({payables.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {payables.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-white text-xs truncate max-w-[200px] block">{t.title}</span>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {t.supplierName || 'Fornecedor'} • Venc: {formatDateBR(t.dueDate)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-red-400 text-sm block">- {formatCurrency(t.amount)}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          t.status === 'pago'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {t.status === 'pago' ? 'Pago' : 'A Pagar'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Contas a Receber */}
      {activeSubTab === 'receivables' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por cliente, título ou O.S..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="all">Todos os Status</option>
                <option value="pago">Apenas Pagos</option>
                <option value="pendente">Apenas Pendentes</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="all">Todas as Origens</option>
                <option value="os">Ordens de Serviço (O.S)</option>
                <option value="avulso">Visitas Avulsas no Local</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setBillingTargetWorkOrder(null);
                  setEditingTransaction(null);
                  setIsBillingModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Cobrança</span>
              </button>
            </div>
          </div>

          {/* Receivables Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Origem / Título</th>
                    <th className="py-3 px-4">Cliente / Sacado</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Técnico / Comissão</th>
                    <th className="py-3 px-4 text-right">Ações de Cobrança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredReceivables.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Nenhum recebimento localizado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredReceivables.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white block">{t.title}</span>
                            {t.isAvulso ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                Visita Avulsa
                              </span>
                            ) : t.workOrderNumber ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                #{t.workOrderNumber}
                              </span>
                            ) : null}
                          </div>
                          {t.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[240px] mt-0.5">{t.description}</p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-200 block truncate max-w-[180px]">
                            {t.clientName || 'Cliente'}
                          </span>
                          {t.avulsoClientInfo?.phone && (
                            <span className="text-[10px] text-slate-400">{t.avulsoClientInfo.phone}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {formatDateBR(t.dueDate)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-emerald-400 text-sm">{formatCurrency(t.amount)}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          {t.status === 'pago' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Quitado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Em Aberto
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {t.technicianName ? (
                            <div>
                              <span className="text-slate-300 font-semibold block">{t.technicianName}</span>
                              <span className="text-[10px] text-teal-400">
                                {formatCurrency(t.commissionAmount || 0)} ({t.commissionPercent || 15}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.status !== 'pago' && (
                              <button
                                type="button"
                                onClick={() => handleQuickMarkPaid(t)}
                                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 text-emerald-400 hover:text-white transition-colors"
                                title="Dar baixa / Marcar como Quitado"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => downloadReceiptPDF(t, company)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Baixar Recibo em PDF"
                            >
                              <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadBoletoPDF(t, company)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Baixar Boleto Bancário em PDF"
                            >
                              <Barcode className="w-3.5 h-3.5 text-blue-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingTransaction(t);
                                setIsBillingModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Editar / Abrir tela de Pix e Boleto"
                            >
                              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => onDeleteTransaction(t.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
                                title="Excluir lançamento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Contas a Pagar */}
      {activeSubTab === 'payables' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar despesa por fornecedor ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Despesa</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Descrição da Despesa</th>
                    <th className="py-3 px-4">Fornecedor / Favorecido</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredPayables.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Nenhuma despesa cadastrada.
                      </td>
                    </tr>
                  ) : (
                    filteredPayables.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{t.title}</td>
                        <td className="py-3.5 px-4 text-slate-300">{t.supplierName || 'Geral'}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                            {t.category === 'pecas_fornecedores'
                              ? 'Peças & Fornecedores'
                              : t.category === 'combustivel'
                              ? 'Combustível Frota'
                              : t.category === 'comissao_tecnico'
                              ? 'Comissão Técnico'
                              : 'Despesa Operacional'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{formatDateBR(t.dueDate)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-red-400 text-sm">
                          - {formatCurrency(t.amount)}
                        </td>
                        <td className="py-3.5 px-4">
                          {t.status === 'pago' ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              ✓ Pago
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.status !== 'pago' && (
                              <button
                                type="button"
                                onClick={() => handleQuickMarkPaid(t)}
                                className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold"
                              >
                                Marcar Pago
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => onDeleteTransaction(t.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Comissões Técnicas */}
      {activeSubTab === 'commissions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 block">Comissões Pendentes de Pagamento</span>
              <span className="text-2xl font-black text-amber-400 mt-2 block">
                {formatCurrency(metrics.totalComissoesPendentes)}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 block">Comissões Pagas</span>
              <span className="text-2xl font-black text-emerald-400 mt-2 block">
                {formatCurrency(metrics.totalComissoesPagas)}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 block">Taxa Padrão Configurada</span>
              <span className="text-2xl font-black text-teal-400 mt-2 block">
                {company?.defaultTechnicianCommissionRate ?? 15}%
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm">Apuração por Técnico em Campo</h3>

            <div className="space-y-3">
              {technicianCommissions.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Nenhuma comissão apurada ainda. Lance cobranças de O.S ou Visitas Avulsas com técnicos vinculados.
                </p>
              ) : (
                technicianCommissions.map((rec) => (
                  <div
                    key={rec.key}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                        <HardHat className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{rec.name}</h4>
                        <p className="text-xs text-slate-400">
                          {rec.items.length} atendimentos registrados
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">A Pagar:</span>
                        <span className="font-extrabold text-amber-400 text-sm">
                          {formatCurrency(rec.pending)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Já Pago:</span>
                        <span className="font-extrabold text-emerald-400 text-sm">
                          {formatCurrency(rec.paid)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Equipe Financeira */}
      {activeSubTab === 'team' && isAdmin && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-sm">Operadores da Equipe Financeira</h3>
              <p className="text-xs text-slate-400">
                Usuários com acesso estrito ao financeiro e emissão de cobranças
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingOperator(null);
                setOpName('');
                setOpEmail('');
                setOpPhone('');
                setOpPassword('123');
                setIsOperatorModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Operador Financeiro</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {financialOperators.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-slate-500 text-xs">
                Nenhum operador financeiro cadastrado ainda.
              </div>
            ) : (
              financialOperators.map((op) => (
                <div
                  key={op.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{op.name}</h4>
                        <p className="text-xs text-slate-400">{op.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onSwitchToFinancialUser && (
                        <button
                          type="button"
                          onClick={() => onSwitchToFinancialUser(op)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold hover:bg-emerald-900 transition-colors"
                          title="Entrar como este operador"
                        >
                          Acessar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditOperator(op)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                        title="Editar permissões"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteFinancialOperator(op.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400"
                        title="Remover operador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                    <div>
                      <span>• Contas a Pagar: </span>
                      <span className="font-bold text-white">{op.canManagePayables !== false ? 'Sim' : 'Não'}</span>
                    </div>
                    <div>
                      <span>• Contas a Receber: </span>
                      <span className="font-bold text-white">{op.canManageReceivables !== false ? 'Sim' : 'Não'}</span>
                    </div>
                    <div>
                      <span>• Pix e Boletos: </span>
                      <span className="font-bold text-white">{op.canIssueBoletosPix !== false ? 'Sim' : 'Não'}</span>
                    </div>
                    <div>
                      <span>• Fluxo / DRE: </span>
                      <span className="font-bold text-white">{op.canViewDRE !== false ? 'Sim' : 'Não'}</span>
                    </div>
                    <div>
                      <span>• Manual em PDF: </span>
                      <span className={`font-bold ${op.canDownloadManual !== false ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {op.canDownloadManual !== false ? 'Liberado' : 'Bloqueado'}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Acesso ao Manual de Cobrança</span>
                      <button
                        type="button"
                        onClick={() => {
                          const isUnlocked = op.canDownloadManual !== false;
                          onSaveFinancialOperator({
                            ...op,
                            canDownloadManual: !isUnlocked,
                          });
                          setManualFeedback(`Manual do operador ${op.name} ${!isUnlocked ? 'LIBERADO' : 'BLOQUEADO'} com sucesso!`);
                          setTimeout(() => setManualFeedback(null), 3500);
                        }}
                        className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          op.canDownloadManual !== false
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-red-950 hover:text-red-300'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {op.canDownloadManual !== false ? '✓ Manual Liberado (Bloquear)' : '🔒 Liberar Manual'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 6: Chave Pix & Banco */}
      {activeSubTab === 'settings' && isAdmin && (
        <form onSubmit={handleSaveCompanySettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base">Configurações de Cobrança: Pix & Dados Bancários</h3>
              <p className="text-xs text-slate-400">
                Informações utilizadas na geração de QR Code Pix, Boletos FEBRABAN e recibos
              </p>
            </div>
            {savedSettingsSuccess && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-xl">
                ✓ Salvo com sucesso!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chave Pix */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo da Chave Pix:
              </label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="cnpj">CNPJ</option>
                <option value="cpf">CPF</option>
                <option value="telefone">Celular / Telefone</option>
                <option value="email">E-mail</option>
                <option value="aleatoria">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chave Pix da Empresa:
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Beneficiário Pix (Máx 25 carac.):
              </label>
              <input
                type="text"
                value={pixBeneficiary}
                onChange={(e) => setPixBeneficiary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cidade do Beneficiário (Para EMVCo Pix):
              </label>
              <input
                type="text"
                value={pixCity}
                onChange={(e) => setPixCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Banco & Conta */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Banco para Boletos:
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Agência:</label>
                <input
                  type="text"
                  value={bankAgency}
                  onChange={(e) => setBankAgency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Conta Corrente:</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Comissão Padrão dos Técnicos (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={defaultCommissionRate}
                onChange={(e) => setDefaultCommissionRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold text-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Instruções Padrão de Juros/Multa no Boleto:
              </label>
              <input
                type="text"
                value={boletoInstructions}
                onChange={(e) => setBoletoInstructions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg"
            >
              Salvar Configurações de Cobrança
            </button>
          </div>
        </form>
      )}

      {/* MODAL 1: BillingModal (Pix & Boleto) */}
      {isBillingModalOpen && (
        <BillingModal
          isOpen={isBillingModalOpen}
          onClose={() => {
            setIsBillingModalOpen(false);
            setBillingTargetWorkOrder(null);
            setEditingTransaction(null);
          }}
          company={company}
          workOrder={billingTargetWorkOrder}
          clients={clients}
          technicians={technicians}
          initialData={editingTransaction}
          onSaveTransaction={onSaveTransaction}
        />
      )}

      {/* MODAL 2: Nova Despesa Operacional */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateExpense}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-400" />
                Lançar Despesa Operacional
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição: *</label>
              <input
                type="text"
                required
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="Ex: Combustível semana 2, Bobina de cabos Intelbras"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria:</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="pecas_fornecedores">Peças & Fornecedores</option>
                  <option value="combustivel">Combustível da Frota</option>
                  <option value="ferramentas">Ferramentas & Equipamentos</option>
                  <option value="comissao_tecnico">Comissão de Técnico</option>
                  <option value="aluguel_escritorio">Aluguel / Escritório</option>
                  <option value="outras_despesas">Outras Despesas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fornecedor:</label>
                <input
                  type="text"
                  value={expenseSupplier}
                  onChange={(e) => setExpenseSupplier(e.target.value)}
                  placeholder="Nome do fornecedor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$): *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={expenseAmount || ''}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-red-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Data / Vencimento:</label>
                <input
                  type="date"
                  value={expenseDueDate}
                  onChange={(e) => setExpenseDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Pagamento:</label>
                <select
                  value={expenseMethod}
                  onChange={(e) => setExpenseMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="pix">Pix</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="boleto">Boleto</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Situação:</label>
                <select
                  value={expenseStatus}
                  onChange={(e) => setExpenseStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="pago">Já Pago</option>
                  <option value="pendente">A Pagar (Pendente)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Salvar Despesa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Operador Financeiro */}
      {isOperatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveOperator}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                {editingOperator ? 'Editar Operador Financeiro' : 'Cadastrar Operador Financeiro'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOperatorModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo: *</label>
              <input
                type="text"
                required
                value={opName}
                onChange={(e) => setOpName(e.target.value)}
                placeholder="Ex: Juliana Costa"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail: *</label>
                <input
                  type="email"
                  required
                  value={opEmail}
                  onChange={(e) => setOpEmail(e.target.value)}
                  placeholder="financeiro@empresa.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp:</label>
                <input
                  type="text"
                  value={opPhone}
                  onChange={(e) => setOpPhone(e.target.value)}
                  placeholder="(21) 99999-9999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Senha de Acesso: *</label>
              <input
                type="text"
                required
                value={opPassword}
                onChange={(e) => setOpPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Permissões de Acesso:</span>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opCanReceivables}
                  onChange={(e) => setOpCanReceivables(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Gerenciar Contas a Receber
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opCanPayables}
                  onChange={(e) => setOpCanPayables(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Gerenciar Contas a Pagar
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opCanBoletosPix}
                  onChange={(e) => setOpCanBoletosPix(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Emitir Boletos e Pix de Atendimentos
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opCanDRE}
                  onChange={(e) => setOpCanDRE(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Visualizar DRE / Fluxo de Caixa
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opCanCommissions}
                  onChange={(e) => setOpCanCommissions(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Gerenciar Comissões Técnicas
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2 border-t border-slate-800">
                <input
                  type="checkbox"
                  checked={opCanDownloadManual}
                  onChange={(e) => setOpCanDownloadManual(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  Liberar Download do Manual Financeiro (PDF)
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsOperatorModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Salvar Operador
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
