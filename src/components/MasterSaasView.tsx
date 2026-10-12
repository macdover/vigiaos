import React, { useState } from 'react';
import { 
  TenantAccount, 
  TenantStatus, 
  PlanTier, 
  CompanySettings 
} from '../types';
import { PLAN_CONFIGS } from '../data/initialData';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Unlock, 
  Building2, 
  Plus, 
  Search, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  Calendar, 
  Server, 
  Database, 
  Globe, 
  Smartphone, 
  Cloud, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles,
  LogOut,
  ChevronRight,
  FileCode,
  Layers,
  Megaphone
} from 'lucide-react';
import { formatCurrency, formatDateBR, generateWhatsAppLink } from '../utils/storage';
import { MarketingKitView } from './MarketingKitView';

interface MasterSaasViewProps {
  tenants: TenantAccount[];
  currentTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  onUpdateTenantStatus: (tenantId: string, status: TenantStatus, reason?: string) => void;
  onSaveTenant: (tenant: TenantAccount) => void;
  onDeleteTenant: (tenantId: string) => void;
  masterPassword: string;
  onChangeMasterPassword: (newPass: string) => void;
  onExitMaster: () => void;
  onOpenMarketingKit?: () => void;
}

export const MasterSaasView: React.FC<MasterSaasViewProps> = ({
  tenants,
  currentTenantId,
  onSelectTenant,
  onUpdateTenantStatus,
  onSaveTenant,
  onDeleteTenant,
  masterPassword,
  onChangeMasterPassword,
  onExitMaster,
  onOpenMarketingKit,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Active view inside master
  const [activeMasterTab, setActiveMasterTab] = useState<'companies' | 'marketing_kit' | 'sales_guide' | 'hosting_guide' | 'settings'>('companies');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Modals
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [tenantToBlock, setTenantToBlock] = useState<TenantAccount | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('Mensalidade pendente de quitação no sistema.');
  const [tenantToDelete, setTenantToDelete] = useState<TenantAccount | null>(null);

  // Password change modal
  const [isPassChangeModalOpen, setIsPassChangeModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passFeedback, setPassFeedback] = useState<string | null>(null);

  // New tenant form fields
  const [newTradeName, setNewTradeName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newPlan, setNewPlan] = useState<PlanTier>('pro');
  const [newDueDate, setNewDueDate] = useState<number>(10);
  const [newAdminPassword, setNewAdminPassword] = useState('123');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === masterPassword) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTradeName.trim() || !newOwnerName.trim()) return;

    const planData = PLAN_CONFIGS[newPlan];
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(newDueDate);

    const newTenant: TenantAccount = {
      id: `tenant-${Date.now()}`,
      tradeName: newTradeName.trim(),
      name: newCompanyName.trim() || newTradeName.trim(),
      cnpj: newCnpj.trim() || '00.000.000/0001-00',
      ownerName: newOwnerName.trim(),
      email: newEmail.trim() || 'contato@empresa.com.br',
      phone: newPhone.trim() || '(11) 9999-9999',
      whatsapp: newWhatsapp.replace(/\D/g, '') || '11999999999',
      plan: newPlan,
      status: 'ativo',
      monthlyFee: planData.priceMonthly,
      setupFeePaid: true,
      dueDateDay: newDueDate,
      nextPaymentDate: nextMonth.toISOString().split('T')[0],
      subscriptionStartDate: today.toISOString().split('T')[0],
      adminLoginUser: newEmail.trim() || 'contato@empresa.com.br',
      adminPassword: newAdminPassword.trim() || '123',
      techniciansCount: 1,
      clientsCount: 0,
      workOrdersCount: 0,
      createdAt: today.toISOString(),
    };

    onSaveTenant(newTenant);
    setIsNewTenantModalOpen(false);

    // Reset form
    setNewTradeName('');
    setNewCompanyName('');
    setNewCnpj('');
    setNewOwnerName('');
    setNewEmail('');
    setNewPhone('');
    setNewWhatsapp('');
  };

  const handleConfirmBlock = () => {
    if (!tenantToBlock) return;
    onUpdateTenantStatus(tenantToBlock.id, 'bloqueado', blockReasonInput);
    setTenantToBlock(null);
  };

  const handleConfirmUnblock = (tenant: TenantAccount) => {
    onUpdateTenantStatus(tenant.id, 'ativo');
  };

  const handleChangePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPassFeedback('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassFeedback('A confirmação de senha não coincide.');
      return;
    }
    onChangeMasterPassword(newPassword);
    setPassFeedback(null);
    setIsPassChangeModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    alert('Senha Master atualizada com sucesso!');
  };

  // Metrics calculations
  const totalActiveTenants = tenants.filter(t => t.status === 'ativo').length;
  const totalBlockedTenants = tenants.filter(t => t.status === 'bloqueado' || t.status === 'inadimplente').length;
  const totalMRR = tenants
    .filter(t => t.status === 'ativo')
    .reduce((sum, t) => sum + (t.monthlyFee || 0), 0);
  const totalSetupRevenue = tenants.reduce((sum, t) => sum + (t.setupFeePaid ? 150 : 0), 0);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch = 
      t.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cnpj.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPlan = planFilter === 'all' || t.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
        <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-amber-950/60 ring-4 ring-amber-500/20">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white">Painel Master do Dono do SaaS</h1>
            <p className="text-xs text-slate-400">
              Gestão Centralizada de Empresas Licenciadas, Bloqueio por Inadimplência e Cobrança
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Digite a Senha Master:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Senha Master do Proprietário"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 pr-10 ${
                    passwordError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-700 focus:border-amber-400 focus:ring-amber-500/20'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordError ? (
                <p className="text-[11px] text-red-400 mt-1.5 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Senha incorreta. Tente novamente.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Senha padrão inicial: <strong className="text-amber-400 font-mono">master2026</strong> (você pode alterá-la depois).
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Acessar Painel Master
            </button>

            <button
              type="button"
              onClick={onExitMaster}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Voltar para o Sistema da Empresa
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Master Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-lg shadow-amber-950/60">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Painel Master do Dono do SaaS</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Você tem o controle total de todas as empresas clientes que compram suas licenças.
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveMasterTab('marketing_kit')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer ${
                activeMasterTab === 'marketing_kit'
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/40'
              }`}
            >
              <Megaphone className="w-4 h-4 text-purple-200" />
              Kit de Divulgação & Pôsteres
            </button>

            <button
              type="button"
              onClick={() => setIsNewTenantModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Nova Empresa Cliente
            </button>

            <button
              type="button"
              onClick={() => setIsPassChangeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              Alterar Senha Master
            </button>

            <button
              type="button"
              onClick={onExitMaster}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair do Painel Master
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Faturamento Mensal (MRR)
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">
              {formatCurrency(totalMRR)}<span className="text-xs font-normal text-slate-400">/mês</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Soma das empresas ativas pagantes</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Empresas Licenciadas
            </span>
            <div className="text-lg sm:text-xl font-bold text-white mt-1">
              {tenants.length} <span className="text-xs text-slate-400 font-normal">empresas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">{totalActiveTenants} ativas • {totalBlockedTenants} com pendência</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Arrecadação de Adesões
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-1">
              {formatCurrency(totalSetupRevenue)}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">R$ 150,00 cobrados por setup</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Bloqueados por Falta de Pagamento
            </span>
            <div className="text-lg sm:text-xl font-bold text-red-400 mt-1">
              {totalBlockedTenants}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Acesso suspenso até regularização</p>
          </div>
        </div>
      </div>

      {/* Master Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveMasterTab('companies')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'companies'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gestão de Empresas & Bloqueio ({tenants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMasterTab('marketing_kit')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'marketing_kit'
              ? 'border-purple-400 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4 text-purple-400" />
          <span>Kit de Divulgação & Pôsteres</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMasterTab('sales_guide')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'sales_guide'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Como Vender este Sistema (Guia Comercial)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMasterTab('hosting_guide')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'hosting_guide'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Onde Hospedar, Domínio & Bancos de Dados</span>
        </button>
      </div>

      {/* TAB 1: COMPANIES LIST & MANAGEMENT */}
      {activeMasterTab === 'companies' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar empresa por nome fantasia, razão social, CNPJ ou responsável..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2"
              >
                <option value="all">Todos os Status</option>
                <option value="ativo">Apenas Ativos (Em dia)</option>
                <option value="bloqueado">Apenas Bloqueados (Inadimplentes)</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2"
              >
                <option value="all">Todos os Planos</option>
                <option value="master">Plano Master (R$ 80)</option>
                <option value="pro">Plano Pro (R$ 180)</option>
                <option value="full">Plano Full (R$ 350)</option>
              </select>
            </div>
          </div>

          {/* Tenants Cards / Table */}
          <div className="space-y-3">
            {filteredTenants.map((t) => {
              const isCurrentlyActiveInApp = t.id === currentTenantId;
              const isBlocked = t.status === 'bloqueado' || t.status === 'inadimplente';
              const planConfig = PLAN_CONFIGS[t.plan];

              const cobrançaMessage = `*Aviso de Vencimento - Sistema SegurOS*\n\n` +
                `Olá, ${t.ownerName}! Tudo bem?\n` +
                `Passando para lembrar que a mensalidade do sistema da sua empresa (*${t.tradeName}*) está programada para vencimento no dia ${t.dueDateDay}.\n\n` +
                `*Plano Contratado:* ${planConfig.name}\n` +
                `*Valor:* ${formatCurrency(t.monthlyFee)}\n\n` +
                `Para efetuar o pagamento via PIX, utilize nossa chave CNPJ. Qualquer dúvida estou à disposição!`;

              const whatsappCobrançaUrl = generateWhatsAppLink(t.whatsapp, cobrançaMessage);

              return (
                <div
                  key={t.id}
                  className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isBlocked 
                      ? 'border-red-500/50 bg-red-950/10' 
                      : isCurrentlyActiveInApp
                      ? 'border-amber-500/60 bg-amber-950/10 ring-1 ring-amber-500/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 shadow-md ${
                      isBlocked
                        ? 'bg-red-900/50 text-red-400 border border-red-700/50'
                        : 'bg-gradient-to-br from-slate-800 to-slate-700 text-white border border-slate-600'
                    }`}>
                      {t.tradeName.charAt(0)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-base">{t.tradeName}</h3>
                        {isCurrentlyActiveInApp && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                            Empresa Selecionada no App
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isBlocked
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {isBlocked ? 'Bloqueado (Inadimplente)' : 'Ativo (Em Dia)'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-semibold uppercase">
                          {t.plan} • {formatCurrency(t.monthlyFee)}/mês
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">
                        <strong>Razão Social:</strong> {t.name} • <strong>CNPJ:</strong> {t.cnpj}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap pt-0.5">
                        <span><strong>Dono / Contato:</strong> {t.ownerName}</span>
                        <span><strong>WhatsApp:</strong> {t.whatsapp}</span>
                        <span className="text-amber-400">
                          <strong>Vencimento:</strong> Todo dia {t.dueDateDay}
                        </span>
                        <span className="text-slate-400">
                          <strong>Estrutura:</strong> {t.techniciansCount} técnicos • {t.clientsCount} clientes
                        </span>
                      </div>

                      {/* Login info for Master */}
                      <div className="mt-2 py-1 px-2.5 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-3 flex-wrap">
                        <span className="text-slate-400 font-semibold">Credenciais de Acesso do Cliente:</span>
                        <span>Login: <code className="text-cyan-300 font-mono">{t.adminLoginUser || t.email}</code></span>
                        <span>Senha: <code className="text-amber-300 font-mono font-bold">{t.adminPassword || '123'}</code></span>
                      </div>

                      {isBlocked && t.blockedReason && (
                        <div className="mt-2 p-2 bg-red-950/60 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span><strong>Motivo do Bloqueio:</strong> {t.blockedReason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for SaaS Owner */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-center shrink-0">
                    {/* Enter / Impersonate as this company */}
                    <button
                      type="button"
                      onClick={() => onSelectTenant(t.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCurrentlyActiveInApp
                          ? 'bg-amber-900/60 text-amber-200 border border-amber-700/60 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title="Entrar no sistema como esta empresa para suporte técnico ou teste"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isCurrentlyActiveInApp ? 'Ativa no Navegador' : 'Acessar como esta Empresa'}
                    </button>

                    {/* WhatsApp Billing Button */}
                    <a
                      href={whatsappCobrançaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-xl transition-colors"
                      title="Enviar cobrança / lembrete via WhatsApp com texto pronto"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    {/* Block or Unblock toggle */}
                    {isBlocked ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmUnblock(t)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                        title="Desbloquear acesso desta empresa (pagamento recebido)"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Desbloquear (Pix Pago)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTenantToBlock(t);
                          setBlockReasonInput('Mensalidade do plano pendente de pagamento.');
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/60 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        title="Bloquear sistema por falta de pagamento"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Bloquear Acesso
                      </button>
                    )}

                    {/* Delete Tenant */}
                    <button
                      type="button"
                      onClick={() => setTenantToDelete(t)}
                      className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                      title="Excluir Empresa Licenciada definitivamente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: COMMERCIAL SALES GUIDE (Exclusive for SaaS Owner) */}
      {activeMasterTab === 'sales_guide' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
              <TrendingUp className="w-5 h-5" />
              Estratégia Completa: Como Vender este Sistema e Faturar com Mensalidades (SaaS)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Guia Prático para Transformar o VigiaOS em um Negócio Altamente Lucrativo
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Empresas de segurança eletrônica (CFTV, alarmes, portões automáticos, interfonia e cerca elétrica) sofrem todos os dias com ordens de serviço em papel perdidas, falta de comprovação de serviços prestados e técnicos desorganizados na rua. O VigiaOS resolve exatamente essas dores.
            </p>
          </div>

          {/* 4 Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 font-black text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-bold text-white">Modelo de Cobrança Recorrente (Assinatura)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Você vende o software como um serviço mensal (SaaS). Cobre diretamente dos donos das empresas através de boleto, cartão de crédito recorrente ou Pix.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong>Plano Master:</strong> R$ 80,00/mês (empresas com até 5 técnicos + 1 ADM).</li>
                <li><strong>Plano Pro:</strong> R$ 180,00/mês (empresas médias com até 15 técnicos + 3 ADM).</li>
                <li><strong>Plano Full:</strong> R$ 350,00/mês (grandes empresas com técnicos e clientes ilimitados).</li>
                <li><strong>Taxa de Adesão / Implantação:</strong> R$ 150,00 cobrada na entrada para configurar logotipo e treinamento.</li>
                <li><strong>Controle de Exclusão:</strong> Somente o Administrador (ADM) da empresa pode excluir clientes, técnicos e Ordens de Serviço.</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 font-black text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-bold text-white">Os 4 Maiores Argumentos de Venda</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Quando você for apresentar para o dono da empresa de segurança, foque no que ele ganha:
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong>Assinatura no dedo do cliente:</strong> Acaba com clientes que dizem <em>"o técnico não veio"</em> ou <em>"não autorizei a troca da peça"</em>.</li>
                <li><strong>Fotos de Antes e Depois:</strong> Prova fotográfica jurídica do serviço bem executado e do equipamento funcionando.</li>
                <li><strong>Orçamentos no WhatsApp em 1 minuto:</strong> Propostas profissionais prontas que aumentam a taxa de fechamento.</li>
                <li><strong>Modo Técnico Restrito:</strong> O técnico não mexe nos custos nem vê clientes de outros técnicos.</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 font-black text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-bold text-white">Como Prospectar Seus Primeiros Clientes</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Você não precisa gastar rios de dinheiro em anúncios para conseguir clientes:
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Abra o <strong>Google Maps</strong> na sua cidade e busque: <em>"Instalação de Câmeras"</em>, <em>"Segurança Eletrônica"</em>, <em>"Cerca Elétrica"</em>, <em>"Controle de Acesso"</em>.</li>
                <li>Mande uma mensagem no WhatsApp da empresa ou ligue pedindo para falar com o responsável técnico ou dono.</li>
                <li>Ofereça <strong>7 a 15 dias de teste grátis</strong> sem compromisso para ele colocar 1 técnico para usar no campo.</li>
                <li>Ao ver o cliente assinando na tela do celular, o dono não quer mais voltar para o bloco de papel.</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-black text-sm flex items-center justify-center">
                4
              </div>
              <h3 className="text-sm font-bold text-white">Simulação de Faturamento Mensal (MRR)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                A grande vantagem do modelo SaaS é que o cliente paga todo mês:
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">10 empresas no Plano Master (R$ 80,00):</span>
                  <span className="font-bold text-cyan-400 font-mono">R$ 800,00 /mês</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">20 empresas (15 Master + 5 Pro):</span>
                  <span className="font-bold text-cyan-400 font-mono">R$ 2.100,00 /mês</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Taxa de Adesão (20 x R$ 150,00):</span>
                  <span className="font-bold text-amber-400 font-mono">+ R$ 3.000,00 (Setup)</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold">
                  <span className="text-white">50 empresas ativas (mistas):</span>
                  <span className="text-emerald-400 font-mono text-sm">~R$ 7.500 a R$ 12.000 /mês</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOSTING & DATABASE GUIDE (Answers user questions directly) */}
      {activeMasterTab === 'hosting_guide' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-cyan-950 text-cyan-400 rounded-xl border border-cyan-800">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Como Colocar no Ar, Hospedar e Estruturar o Banco de Dados</h2>
                <p className="text-xs text-slate-400">
                  Guia prático para você comercializar este sistema como SaaS para empresas de segurança e CFTV.
                </p>
              </div>
            </div>

            {/* Section 1: Onde Hospedar */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                1. Onde Hospedo este Site?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
                    <Cloud className="w-4 h-4" /> Google Cloud Run (Nativo)
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Você pode publicar <strong>com 1 clique direto no botão "Deploy"</strong> do menu superior do Google AI Studio. Ele gera uma URL HTTPS rápida, com certificado SSL gratuito e servidor seguro rodando 24h por dia na nuvem do Google.
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-semibold inline-block">
                    Recomendado para início imediato
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4" /> Vercel ou Netlify
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Basta baixar os arquivos do projeto (Export ZIP) e importar no GitHub. A Vercel conecta ao GitHub e faz deploy automático com alta velocidade e suporte a domínio personalizado gratuito.
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold inline-block">
                    Custo zero no plano inicial
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-purple-400 text-sm flex items-center gap-1.5">
                    <Server className="w-4 h-4" /> VPS Próprio (DigitalOcean / Hetzner)
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Para quem deseja controle total do servidor Linux rodando Docker ou Node.js, com painel tipo CloudPanel ou CapRover, custando a partir de US$ 5/mês.
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold inline-block">
                    Para operações em grande escala
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Como as pessoas acessam e Como configurar o vigiaos.com.br */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                2. Como Apontar o seu Domínio Oficial vigiaos.com.br (Registro.br)
              </h3>
              <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 space-y-4 text-xs">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Domínio Adquirido: <code className="font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800 text-white">vigiaos.com.br</code>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  Para que qualquer pessoa ou instalador que digitar <strong>vigiaos.com.br</strong> ou <strong>www.vigiaos.com.br</strong> abra diretamente este seu sistema com cadeado de segurança verde (SSL), siga este passo a passo dentro do Registro.br:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                      1. Acessar o Registro.br
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Entre na sua conta no <strong>registro.br</strong>, clique sobre o domínio <strong>vigiaos.com.br</strong> e role a página até a seção <strong>"DNS"</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                      2. Clicar em "Editar Zona"
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Clique em <strong>"Configurar Endereçamento"</strong> ou <strong>"Editar Zona"</strong> (modo avançado de DNS do Registro.br).
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                      3. Adicionar as Entradas DNS
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Adicione uma entrada <strong>CNAME</strong> com nome <code className="text-white">www</code> apontando para o endereço de publicação da sua nuvem.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-semibold text-white block">Tabela de Apontamento DNS Recomendada para o Registro.br:</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-1 px-2">Tipo</th>
                          <th className="py-1 px-2">Nome / Entrada</th>
                          <th className="py-1 px-2">Dados / Destino</th>
                          <th className="py-1 px-2">Objetivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        <tr>
                          <td className="py-1.5 px-2 text-cyan-300 font-bold">CNAME</td>
                          <td className="py-1.5 px-2 text-white">www</td>
                          <td className="py-1.5 px-2 text-amber-300 font-bold text-[10px]">url-do-seu-servidor</td>
                          <td className="py-1.5 px-2 text-slate-400 font-sans">Acessar por www.vigiaos.com.br</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2 text-emerald-300 font-bold">CNAME ou A</td>
                          <td className="py-1.5 px-2 text-white">@ (ou raiz)</td>
                          <td className="py-1.5 px-2 text-amber-300 font-bold text-[10px]">IP ou Redirecionamento</td>
                          <td className="py-1.5 px-2 text-slate-400 font-sans">Acessar por vigiaos.com.br</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-[11px] text-cyan-200">
                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Instalação no Celular (PWA):</strong> Quando os técnicos acessarem <strong>https://vigiaos.com.br</strong> pelo celular, basta clicar em "Adicionar à tela de início" para virar um app completo com o logo do VigiaOS.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Aonde fica o banco de dados */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                3. Aonde Ficará o Banco de Dados dos Cadastros dos Clientes?
              </h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  O sistema foi desenhado no formato <strong>Multi-Tenant (Múltiplas Empresas Isoladas)</strong>. Isso significa que cada empresa que compra o sistema recebe um identificador único (<code className="text-amber-300 font-mono">companyId / tenantId</code>).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="font-bold text-cyan-400 block mb-1">Opção Cloud: Firebase Firestore</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Banco de dados NoSQL gerenciado pelo Google, com sincronização em tempo real. As coleções de clientes, ordens de serviço e fotos ficam salvas nos servidores de alta segurança da Google Cloud com backups diários automáticos.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="font-bold text-purple-400 block mb-1">Opção Relacional: PostgreSQL / Supabase</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Banco relacional com isolamento rigoroso por linha (Row Level Security). A Empresa A nunca tem permissão para enxergar ou listar os clientes ou técnicos da Empresa B.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-emerald-200 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Segurança LGPD:</strong> Se uma empresa cancelar o plano ou você exclui-la no Painel Master, todos os dados vinculados ao <code className="font-mono font-bold">tenantId</code> dela podem ser apagados em definitivo com 1 comando.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MARKETING KIT & PROMOTIONAL POSTERS (MASTER SAAS OWNER ONLY) */}
      {activeMasterTab === 'marketing_kit' && (
        <div className="space-y-4">
          <MarketingKitView onBack={() => setActiveMasterTab('companies')} />
        </div>
      )}

      {/* Modal: New Tenant Signup */}
      {isNewTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-950 text-cyan-400 rounded-xl border border-cyan-800">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cadastrar Nova Empresa Licenciada</h3>
                  <p className="text-xs text-slate-400">Ative uma empresa que comprou seu sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTenantModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Nome Fantasia da Empresa *</label>
                  <input
                    type="text"
                    value={newTradeName}
                    onChange={(e) => setNewTradeName(e.target.value)}
                    placeholder="Ex: Alfa CFTV & Alarmes"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Razão Social Completa</label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Ex: Alfa Segurança Eletrônica Ltda"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={newCnpj}
                    onChange={(e) => setNewCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Nome do Dono / Responsável *</label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">E-mail para Acesso (Login ADM)</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Ex: contato@alfacftv.com.br"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Senha Inicial do Cliente</label>
                  <input
                    type="text"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Ex: 123 ou tech2026"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">WhatsApp para Cobrança</label>
                <input
                  type="text"
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  placeholder="Ex: 11999998888 (com DDD)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              {/* Plan Choice */}
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Plano Contratado:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['master', 'pro', 'full'] as PlanTier[]).map((tier) => {
                    const cfg = PLAN_CONFIGS[tier];
                    const isSelected = newPlan === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setNewPlan(tier)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/50 border-amber-400 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold block text-white text-xs">{cfg.name}</span>
                        <span className="text-amber-400 font-mono font-bold text-xs">{formatCurrency(cfg.priceMonthly)}/mês</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Dia do Vencimento da Mensalidade</label>
                <select
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value={5}>Todo dia 05 de cada mês</option>
                  <option value={10}>Todo dia 10 de cada mês</option>
                  <option value={15}>Todo dia 15 de cada mês</option>
                  <option value={20}>Todo dia 20 de cada mês</option>
                  <option value={25}>Todo dia 25 de cada mês</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Taxa de Adesão Inicial de <strong>R$ 150,00</strong> considerada como faturada.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTenantModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg shadow"
                >
                  Criar e Liberar Licença
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Block Tenant for Inadimplência */}
      {tenantToBlock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/50 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  Bloqueio de Inadimplência
                </span>
                <h3 className="text-base font-bold text-white">Suspender Acesso da Empresa</h3>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">Empresa a ser bloqueada:</span>
              <p className="text-white font-bold text-sm">{tenantToBlock.tradeName}</p>
              <p className="text-slate-400">Responsável: {tenantToBlock.ownerName} • WhatsApp: {tenantToBlock.whatsapp}</p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-slate-300 font-semibold">
                Mensagem que aparecerá na tela do cliente bloqueado:
              </label>
              <textarea
                value={blockReasonInput}
                onChange={(e) => setBlockReasonInput(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ao confirmar o bloqueio, nenhum funcionário ou técnico desta empresa conseguirá acessar as Ordens de Serviço. Uma tela vermelha de pendência financeira será exibida com seu botão de WhatsApp para que efetuem o pagamento.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTenantToBlock(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Confirmar Bloqueio Imediato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Tenant */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/60 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 text-red-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  Exclusão Definitiva de Empresa
                </span>
                <h3 className="text-base font-bold text-white">Excluir Empresa Licenciada</h3>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">Empresa:</span>
              <p className="text-white font-bold text-sm">{tenantToDelete.tradeName}</p>
              <p className="text-slate-400">CNPJ: {tenantToDelete.cnpj}</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir esta empresa do seu sistema? Esta ação cancela o contrato da licença e remove o acesso definitivamente.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTenantToDelete(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTenant(tenantToDelete.id);
                  setTenantToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Master Password */}
      {isPassChangeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Alterar Senha Master</h3>
                <p className="text-xs text-slate-400">Defina sua chave de acesso exclusiva de Dono</p>
              </div>
            </div>

            <form onSubmit={handleChangePassSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nova Senha Master:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirme a Nova Senha:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  required
                />
              </div>

              {passFeedback && (
                <p className="text-red-400 text-[11px] font-medium">{passFeedback}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPassChangeModalOpen(false);
                    setPassFeedback(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow"
                >
                  Salvar Nova Senha Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
