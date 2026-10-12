import React, { useState, useEffect } from 'react';
import { CompanySettings, PlanTier, Technician, Client } from '../types';
import { PLAN_CONFIGS } from '../data/initialData';
import { 
  Building2, 
  Sparkles, 
  Upload, 
  Trash2, 
  Check, 
  ShieldCheck, 
  HardHat, 
  Users, 
  DollarSign, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Crown,
  FileText,
  Lock,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  KeyRound
} from 'lucide-react';
import { compressImage, formatCurrency } from '../utils/storage';
import { TenantAccount } from '../types';

interface CompanyPlanSettingsViewProps {
  company: CompanySettings;
  technicians: Technician[];
  clients: Client[];
  onSaveCompany: (updatedCompany: CompanySettings) => void;
  currentTenant?: TenantAccount;
  onOpenChangeAdminPassword?: () => void;
}

export const CompanyPlanSettingsView: React.FC<CompanyPlanSettingsViewProps> = ({
  company,
  technicians,
  clients,
  onSaveCompany,
  currentTenant,
  onOpenChangeAdminPassword,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'plans'>('branding');

  // Form states
  const [name, setName] = useState(company.name);
  const [tradeName, setTradeName] = useState(company.tradeName);
  const [cnpj, setCnpj] = useState(company.cnpj);
  const [phone, setPhone] = useState(company.phone);
  const [whatsapp, setWhatsapp] = useState(company.whatsapp);
  const [email, setEmail] = useState(company.email);
  const [address, setAddress] = useState(company.address);
  const [warrantyTerms, setWarrantyTerms] = useState(company.warrantyTerms);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');
  const [allowTechnicianBudgets, setAllowTechnicianBudgets] = useState(company.allowTechnicianBudgets !== false);
  const [enableGpsTracking, setEnableGpsTracking] = useState(company.enableGpsTracking !== false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Keep form inputs synchronized if company changes (e.g. on tenant switch or sync)
  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setTradeName(company.tradeName || '');
      setCnpj(company.cnpj || '');
      setPhone(company.phone || '');
      setWhatsapp(company.whatsapp || '');
      setEmail(company.email || '');
      setAddress(company.address || '');
      setWarrantyTerms(company.warrantyTerms || '');
      setLogoUrl(company.logoUrl || '');
      setAllowTechnicianBudgets(company.allowTechnicianBudgets !== false);
      setEnableGpsTracking(company.enableGpsTracking !== false);
    }
  }, [
    company.id,
    company.name,
    company.tradeName,
    company.cnpj,
    company.phone,
    company.whatsapp,
    company.email,
    company.address,
    company.warrantyTerms,
    company.logoUrl,
    company.allowTechnicianBudgets,
    company.enableGpsTracking,
  ]);

  // Upgrade modal state
  const [selectedPlanToSwitch, setSelectedPlanToSwitch] = useState<PlanTier | null>(null);

  const currentPlanConfig = PLAN_CONFIGS[company.plan || 'master'];
  const activeTechCount = technicians.filter(t => t.active).length;
  const activeClientCount = clients.length;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image for localStorage performance
      const compressed = await compressImage(file, 400, 0.85);
      setLogoUrl(compressed);
    } catch (err) {
      console.error('Erro ao carregar logo:', err);
      alert('Não foi possível processar a imagem do logotipo. Tente outro arquivo.');
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated: CompanySettings = {
      ...company,
      name: name.trim(),
      tradeName: tradeName.trim(),
      cnpj: cnpj.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      address: address.trim(),
      warrantyTerms: warrantyTerms.trim(),
      logoUrl: logoUrl,
      allowTechnicianBudgets: allowTechnicianBudgets,
      enableGpsTracking: enableGpsTracking,
    };

    onSaveCompany(updated);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSwitchPlan = (tier: PlanTier) => {
    const updated: CompanySettings = {
      ...company,
      plan: tier,
      planRenewalDate: company.planRenewalDate || '2026-10-15',
    };
    onSaveCompany(updated);
    setSelectedPlanToSwitch(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-cyan-400" />
              Empresa, Marca & Planos de Assinatura
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure o logotipo e dados da sua empresa (White-Label) e gerencie seu plano de assinatura e limites.
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${currentPlanConfig.badgeColor} text-white font-bold`}>
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Plano Ativo</span>
            <span className="text-sm font-bold text-white">{currentPlanConfig.name}</span>
          </div>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'branding'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Logotipo & Dados da Empresa
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('plans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'plans'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Crown className="w-4 h-4" />
          Planos & Limites de Cadastro
        </button>
      </div>

      {/* TAB 1: Branding & Company Info */}
      {activeSubTab === 'branding' && (
        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* Logo upload card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  Logotipo da Empresa (White-Label)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Este logotipo será impresso no topo de todas as Ordens de Serviço, nos Orçamentos e no cabeçalho do sistema.
                </p>
              </div>

              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover Logo
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Preview Box */}
              <div className="w-44 h-32 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center p-2 relative overflow-hidden shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo da Empresa"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-3 text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                    <span className="text-[11px] block font-semibold">Sem Logotipo</span>
                    <span className="text-[9px] text-slate-600">Usando ícone padrão</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Escolher Imagem do Computador ou Celular</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  Formatos recomendados: PNG transparente, JPEG ou WEBP. A imagem é redimensionada e otimizada automaticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Company Data Fields */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Dados Cadastrais da Empresa
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Razão Social *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: SegurMax Segurança Eletrônica Ltda"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome Fantasia *</label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: SegurMax Segurança"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">CNPJ *</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Telefone Fixo</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 3456-7890"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">WhatsApp Comercial / Suporte *</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">E-mail de Contato</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@suaempresa.com.br"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Termos e Condições de Garantia Padrão (Exibido nas O.S e Orçamentos)
                </label>
                <textarea
                  rows={3}
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  placeholder="Garantia de 12 meses para equipamentos e 90 dias para mão de obra..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Seção de Permissões da Equipe & GPS habilitados pelo Dono */}
              <div className="sm:col-span-2 pt-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Permissões da Equipe de Campo (Configuração do Dono)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowTechnicianBudgets}
                        onChange={(e) => setAllowTechnicianBudgets(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <span className="font-bold text-white text-xs block">
                          Permitir Emissão de Orçamentos por Técnicos
                        </span>
                        <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                          Habilita a aba de orçamentos no app do celular para os técnicos enviarem propostas em PDF no WhatsApp do cliente direto da visita técnica.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableGpsTracking}
                        onChange={(e) => setEnableGpsTracking(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <span className="font-bold text-white text-xs block">
                          Monitoramento de GPS dos Técnicos em Tempo Real
                        </span>
                        <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                          Transmite as coordenadas do celular dos técnicos para que o dono da empresa saiba onde cada funcionário está em tempo real.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Seção de Credenciais e Senha do Administrador */}
              <div className="sm:col-span-2 pt-2">
                <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Acesso & Senha do Administrador
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Login: <span className="text-cyan-300 font-mono font-semibold">{currentTenant?.adminLoginUser || email || company.email || 'admin'}</span> • Senha: <span className="text-slate-300 font-mono">••••••</span>
                      </p>
                    </div>
                  </div>
                  {onOpenChangeAdminPassword && (
                    <button
                      type="button"
                      onClick={onOpenChangeAdminPassword}
                      className="px-4 py-2 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 hover:text-white border border-cyan-700/50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
                    >
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      Alterar Senha do Administrador
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {saveSuccess ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Dados da empresa e logotipo salvos com sucesso!
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Os dados atualizados serão aplicados em todos os comprovantes emitidos.
                </span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Plans & Limits */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          {/* Current Usage Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Assinatura Ativa</span>
                <h2 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                  {currentPlanConfig.name}
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Status: Ativo
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Renovação agendada para: {company.planRenewalDate || '15/10/2026'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Mensalidade:</span>
                <span className="text-xl font-black text-white font-mono">
                  {formatCurrency(currentPlanConfig.priceMonthly)}
                  <span className="text-xs text-slate-400 font-normal"> /mês</span>
                </span>
              </div>
            </div>

            {/* Usage Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Technicians Usage */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-amber-400" />
                    Funcionários / Técnicos de Campo
                  </span>
                  <span className="font-mono font-bold text-white">
                    {activeTechCount} / {currentPlanConfig.maxTechnicians ?? 'Ilimitado'}
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      currentPlanConfig.maxTechnicians && activeTechCount >= currentPlanConfig.maxTechnicians
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-amber-500 to-cyan-500'
                    }`}
                    style={{
                      width: currentPlanConfig.maxTechnicians
                        ? `${Math.min(100, (activeTechCount / currentPlanConfig.maxTechnicians) * 100)}%`
                        : '30%',
                    }}
                  />
                </div>

                <p className="text-[10px] text-slate-400 mt-2">
                  {currentPlanConfig.maxTechnicians
                    ? `Restam ${Math.max(0, currentPlanConfig.maxTechnicians - activeTechCount)} vagas de técnicos neste plano.`
                    : 'Sem limite de técnicos para sua empresa.'}
                </p>
              </div>

              {/* Clients Usage */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Clientes Cadastrados
                  </span>
                  <span className="font-mono font-bold text-white">
                    {activeClientCount} / {currentPlanConfig.maxClients ?? 'Ilimitado'}
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      currentPlanConfig.maxClients && activeClientCount >= currentPlanConfig.maxClients
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{
                      width: currentPlanConfig.maxClients
                        ? `${Math.min(100, (activeClientCount / currentPlanConfig.maxClients) * 100)}%`
                        : '25%',
                    }}
                  />
                </div>

                <p className="text-[10px] text-slate-400 mt-2">
                  {currentPlanConfig.maxClients
                    ? `Restam ${Math.max(0, currentPlanConfig.maxClients - activeClientCount)} cadastros de clientes neste plano.`
                    : 'Cadastros ilimitados de clientes, condomínios e indústrias.'}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Escolha ou Alterne seu Plano
            </h3>
            <p className="text-xs text-slate-400">
              Você pode alterar o plano a qualquer momento conforme o crescimento da sua equipe de técnicos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {(['master', 'pro', 'full'] as PlanTier[]).map((tierKey) => {
                const plan = PLAN_CONFIGS[tierKey];
                const isCurrent = company.plan === tierKey;

                return (
                  <div
                    key={tierKey}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                      isCurrent
                        ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/50 ring-1 ring-cyan-500'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                        Mais Popular
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-black text-white">{plan.name}</h4>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gradient-to-r ${plan.badgeColor} text-white`}>
                          {tierKey.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-4 min-h-[36px]">
                        {plan.description}
                      </p>

                      <div className="mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Mensalidade</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white font-mono">
                            {formatCurrency(plan.priceMonthly)}
                          </span>
                          <span className="text-xs text-slate-400 font-normal">/mês</span>
                        </div>
                        <span className="text-[11px] font-bold text-cyan-400 mt-1 block">
                          Taxa de Adesão: {formatCurrency(plan.setupFee)}
                        </span>
                      </div>

                      {/* Main Limits Highlight */}
                      <div className="space-y-2 mb-4 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                          <span className="text-slate-300 font-semibold">Técnicos:</span>
                          <span className="font-bold text-amber-400 font-mono">
                            {plan.maxTechnicians ? `Até ${plan.maxTechnicians} funcionários` : 'ILIMITADO'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                          <span className="text-slate-300 font-semibold">Clientes:</span>
                          <span className="font-bold text-cyan-400 font-mono">
                            {plan.maxClients ? `Até ${plan.maxClients} clientes` : 'ILIMITADO'}
                          </span>
                        </div>
                      </div>

                      {/* Features checklist */}
                      <ul className="space-y-2 text-xs text-slate-300 mb-6">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px]">
                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      {isCurrent ? (
                        <div className="w-full py-2.5 rounded-xl bg-slate-800 text-cyan-400 text-xs font-bold text-center border border-cyan-500/30">
                          ✓ Seu Plano Atual
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedPlanToSwitch(tierKey)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold text-center shadow-lg transition-all cursor-pointer"
                        >
                          Ativar {plan.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Switch Plan Confirmation Modal */}
      {selectedPlanToSwitch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${PLAN_CONFIGS[selectedPlanToSwitch].badgeColor} text-white`}>
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirmar Alteração de Plano</h3>
                <p className="text-xs text-slate-400">
                  Mudar para o {PLAN_CONFIGS[selectedPlanToSwitch].name}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Novo Valor Mensal:</span>
                <span className="font-bold text-white font-mono">
                  {formatCurrency(PLAN_CONFIGS[selectedPlanToSwitch].priceMonthly)} /mês
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Taxa de Adesão / Setup:</span>
                <span className="font-bold text-cyan-400 font-mono">
                  {formatCurrency(PLAN_CONFIGS[selectedPlanToSwitch].setupFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Limite de Técnicos:</span>
                <span className="font-bold text-amber-400">
                  {PLAN_CONFIGS[selectedPlanToSwitch].maxTechnicians ? `Até ${PLAN_CONFIGS[selectedPlanToSwitch].maxTechnicians}` : 'ILIMITADO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Limite de Clientes:</span>
                <span className="font-bold text-cyan-400">
                  {PLAN_CONFIGS[selectedPlanToSwitch].maxClients ? `Até ${PLAN_CONFIGS[selectedPlanToSwitch].maxClients}` : 'ILIMITADO'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ao ativar, os novos limites entrarão em vigor imediatamente na sua conta e o logotipo e dados da sua empresa serão preservados.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlanToSwitch(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPlan(selectedPlanToSwitch)}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Confirmar Ativação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
