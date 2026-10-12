import React, { useState, useEffect } from 'react';
import { Technician, Supervisor, SupervisorPermissions, WorkOrder, CurrentUser, CompanySettings, TechnicianLocation, FinancialOperator } from '../types';
import { PLAN_CONFIGS } from '../data/initialData';
import { 
  HardHat, 
  Plus, 
  Phone, 
  Mail, 
  Edit3, 
  Trash2,
  CheckCircle2, 
  Wrench, 
  Clock, 
  UserCheck, 
  X, 
  Check, 
  ArrowRight,
  Crown,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  MapPin,
  Compass,
  Navigation,
  ExternalLink,
  Radio,
  FileText,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Sliders,
  Send,
  Shield,
  Eye,
  EyeOff,
  UserCog,
  Lock,
  Unlock,
  BookOpen,
  Download,
  Sparkles,
  Users
} from 'lucide-react';
import { TenantAccount } from '../types';
import { formatDateBR, generateWhatsAppLink, DEFAULT_SUPERVISOR_PERMISSIONS } from '../utils/storage';
import { apiFetchTechnicianLocations } from '../utils/apiSync';
import { 
  downloadAdminManualPDF, 
  downloadTechnicianManualPDF, 
  downloadFinancialManualPDF, 
  downloadAllManualsPDF 
} from '../utils/manualPdfGenerator';

interface TeamViewProps {
  technicians: Technician[];
  supervisors?: Supervisor[];
  financialOperators?: FinancialOperator[];
  workOrders: WorkOrder[];
  currentUser?: CurrentUser;
  onSaveTechnician: (tech: Technician) => void;
  onDeleteTechnician?: (techId: string) => void;
  onSwitchToTech: (techId: string) => void;
  onSaveSupervisor?: (supervisor: Supervisor) => void;
  onDeleteSupervisor?: (supId: string) => void;
  onSwitchToSupervisor?: (supId: string) => void;
  onSaveFinancialOperator?: (operator: FinancialOperator) => void;
  company?: CompanySettings;
  onSaveCompany?: (updatedCompany: CompanySettings) => void;
  onTriggerUpgrade?: (title: string, message: string) => void;
  currentTenant?: TenantAccount;
  onOpenChangeAdminPassword?: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  technicians,
  supervisors = [],
  financialOperators = [],
  workOrders,
  currentUser,
  onSaveTechnician,
  onDeleteTechnician,
  onSwitchToTech,
  onSaveSupervisor,
  onDeleteSupervisor,
  onSwitchToSupervisor,
  onSaveFinancialOperator,
  company,
  onSaveCompany,
  onTriggerUpgrade,
  currentTenant,
  onOpenChangeAdminPassword,
}) => {
  const isAdmin = currentUser ? currentUser.role === 'admin' : true;

  // Sub tabs: technicians list, supervisors list, GPS live monitoring, team permissions, operator manuals
  const [activeSubTab, setActiveSubTab] = useState<'technicians' | 'supervisors' | 'gps' | 'permissions' | 'manuais'>('technicians');

  // Technician Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [techToDelete, setTechToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showAdminBlockedAlert, setShowAdminBlockedAlert] = useState(false);

  // Supervisor Modal states
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [supervisorToDelete, setSupervisorToDelete] = useState<Supervisor | null>(null);

  // Supervisor Form states
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supPassword, setSupPassword] = useState('123');
  const [showSupPassword, setShowSupPassword] = useState(false);
  const [supActive, setSupActive] = useState(true);
  const [supPermissions, setSupPermissions] = useState<SupervisorPermissions>(DEFAULT_SUPERVISOR_PERMISSIONS);

  // Technician Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123');
  const [specialty, setSpecialty] = useState('CFTV IP & Redes');
  const [avatarColor, setAvatarColor] = useState('from-blue-600 to-indigo-600');
  const [canCreateBudgets, setCanCreateBudgets] = useState<boolean>(true);
  const [canDownloadManual, setCanDownloadManual] = useState<boolean>(true);

  // Manuals Feedback State
  const [manualFeedback, setManualFeedback] = useState<string | null>(null);

  // Live GPS tracking data state
  const [liveLocations, setLiveLocations] = useState<Record<string, TechnicianLocation | null>>({});
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);
  const [lastGpsSyncTime, setLastGpsSyncTime] = useState<Date>(new Date());
  const [selectedTechOnMap, setSelectedTechOnMap] = useState<Technician | null>(null);

  const activeTenantId = currentTenant?.id || company?.id || 'demo-tenant';
  const companyTechnicians = activeTenantId
    ? technicians.filter((t) => !t.tenantId || t.tenantId === activeTenantId)
    : technicians;

  const currentPlan = company ? PLAN_CONFIGS[company.plan || 'master'] : PLAN_CONFIGS.master;
  const activeTechs = companyTechnicians.filter(t => t.active);
  const isAtLimit = currentPlan.maxTechnicians !== null && activeTechs.length >= currentPlan.maxTechnicians;

  // Global company permission toggles
  const allowBudgets = company?.allowTechnicianBudgets !== false;
  const enableGps = company?.enableGpsTracking !== false;

  // -------------------------------------------------------------
  // Poll live GPS locations from backend periodically
  // -------------------------------------------------------------
  const fetchLiveLocations = async () => {
    if (!activeTenantId) return;
    setIsRefreshingGps(true);
    try {
      const result = await apiFetchTechnicianLocations(activeTenantId);
      if (result && Array.isArray(result)) {
        const map: Record<string, TechnicianLocation | null> = {};
        result.forEach((item) => {
          map[item.id] = item.lastLocation || null;
        });
        setLiveLocations((prev) => ({ ...prev, ...map }));
        setLastGpsSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Error fetching live technician locations:', err);
    } finally {
      setIsRefreshingGps(false);
    }
  };

  useEffect(() => {
    fetchLiveLocations();
    const interval = setInterval(() => {
      fetchLiveLocations();
    }, 15000); // refresh every 15s

    return () => clearInterval(interval);
  }, [activeTenantId]);

  const openNewTech = () => {
    if (isAtLimit && onTriggerUpgrade) {
      onTriggerUpgrade(
        `Limite de Funcionários Atingido (${activeTechs.length}/${currentPlan.maxTechnicians})`,
        `Seu ${currentPlan.name} tem limite de até ${currentPlan.maxTechnicians} funcionários + 01 ADM. Para cadastrar mais colaboradores de campo, faça o upgrade para o Plano Pro (até 15 técnicos) ou Plano Full (ilimitado).`
      );
      return;
    }

    setEditingTech(null);
    setName('');
    setPhone('');
    setEmail('');
    setPassword('123');
    setSpecialty('CFTV & Redes');
    setAvatarColor('from-cyan-600 to-blue-600');
    setCanCreateBudgets(true);
    setCanDownloadManual(true);
    setIsModalOpen(true);
  };

  const openEditTech = (t: Technician) => {
    setEditingTech(t);
    setName(t.name);
    setPhone(t.phone);
    setEmail(t.email);
    setPassword(t.password || '123');
    setSpecialty(t.specialty);
    setAvatarColor(t.avatarColor);
    setCanCreateBudgets(t.canCreateBudgets !== false);
    setCanDownloadManual(t.canDownloadManual !== false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveTechnician({
      id: editingTech?.id || `tech-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password: password.trim() || '123',
      tenantId: activeTenantId,
      specialty: specialty.trim(),
      avatarColor,
      active: true,
      canCreateBudgets: canCreateBudgets,
      canDownloadManual: canDownloadManual,
      lastLocation: editingTech?.lastLocation || null
    });
    setIsModalOpen(false);
  };

  const handleToggleAllowBudgets = () => {
    if (!company || !onSaveCompany) return;
    const updated: CompanySettings = {
      ...company,
      allowTechnicianBudgets: !allowBudgets,
    };
    onSaveCompany(updated);
  };

  const handleToggleEnableGps = () => {
    if (!company || !onSaveCompany) return;
    const updated: CompanySettings = {
      ...company,
      enableGpsTracking: !enableGps,
    };
    onSaveCompany(updated);
  };

  const requestDeleteTech = (techId: string, techName: string) => {
    if (!isAdmin) {
      setShowAdminBlockedAlert(true);
      return;
    }
    setTechToDelete({ id: techId, name: techName });
  };

  const confirmDeleteTech = () => {
    if (!techToDelete) return;
    if (!isAdmin) {
      setShowAdminBlockedAlert(true);
      setTechToDelete(null);
      return;
    }
    if (onDeleteTechnician) {
      onDeleteTechnician(techToDelete.id);
    }
    if (isModalOpen && editingTech?.id === techToDelete.id) {
      setIsModalOpen(false);
    }
    setTechToDelete(null);
  };

  const companySupervisors = activeTenantId
    ? (supervisors || []).filter((s) => !s.tenantId || s.tenantId === activeTenantId)
    : (supervisors || []);

  const companyFinancialOperators = activeTenantId
    ? (financialOperators || []).filter((o) => !o.tenantId || o.tenantId === activeTenantId)
    : (financialOperators || []);

  // -------------------------------------------------------------
  // Manuals Download & Access Liberation Handlers
  // -------------------------------------------------------------
  const handleToggleTechManual = (tech: Technician) => {
    const isCurrentlyUnlocked = tech.canDownloadManual !== false;
    onSaveTechnician({
      ...tech,
      canDownloadManual: !isCurrentlyUnlocked,
    });
    setManualFeedback(`Manual do técnico "${tech.name}" ${!isCurrentlyUnlocked ? 'LIBERADO' : 'BLOQUEADO'} com sucesso!`);
    setTimeout(() => setManualFeedback(null), 3500);
  };

  const handleToggleFinManual = (op: FinancialOperator) => {
    if (!onSaveFinancialOperator) return;
    const isCurrentlyUnlocked = op.canDownloadManual !== false;
    onSaveFinancialOperator({
      ...op,
      canDownloadManual: !isCurrentlyUnlocked,
    });
    setManualFeedback(`Manual do operador financeiro "${op.name}" ${!isCurrentlyUnlocked ? 'LIBERADO' : 'BLOQUEADO'} com sucesso!`);
    setTimeout(() => setManualFeedback(null), 3500);
  };

  const handleBulkUnlockTechs = (unlock: boolean) => {
    companyTechnicians.forEach((t) => {
      onSaveTechnician({ ...t, canDownloadManual: unlock });
    });
    setManualFeedback(`Manuais de todos os ${companyTechnicians.length} técnicos ${unlock ? 'LIBERADOS' : 'BLOQUEADOS'} com sucesso!`);
    setTimeout(() => setManualFeedback(null), 4000);
  };

  const handleBulkUnlockFin = (unlock: boolean) => {
    if (!onSaveFinancialOperator) return;
    companyFinancialOperators.forEach((op) => {
      onSaveFinancialOperator({ ...op, canDownloadManual: unlock });
    });
    setManualFeedback(`Manuais de todos os operadores financeiros ${unlock ? 'LIBERADOS' : 'BLOQUEADOS'} com sucesso!`);
    setTimeout(() => setManualFeedback(null), 4000);
  };

  const handleDownloadAdminManual = () => {
    try {
      downloadAdminManualPDF(company);
      setManualFeedback('Manual do Administrador baixado em PDF com sucesso!');
      setTimeout(() => setManualFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadTechManual = () => {
    try {
      downloadTechnicianManualPDF(company);
      setManualFeedback('Manual do Técnico em Campo baixado em PDF com sucesso!');
      setTimeout(() => setManualFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadFinManual = () => {
    try {
      downloadFinancialManualPDF(company);
      setManualFeedback('Manual do Operador Financeiro baixado em PDF com sucesso!');
      setTimeout(() => setManualFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadAllManuals = () => {
    try {
      downloadAllManualsPDF(company);
      setManualFeedback('Iniciado o download do pacote com todos os 3 Manuais Oficiais da empresa!');
      setTimeout(() => setManualFeedback(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const openNewSupervisor = () => {
    setEditingSupervisor(null);
    setSupName('');
    setSupEmail('');
    setSupPhone('');
    setSupPassword('123');
    setShowSupPassword(false);
    setSupActive(true);
    setSupPermissions({ ...DEFAULT_SUPERVISOR_PERMISSIONS });
    setIsSupervisorModalOpen(true);
  };

  const openEditSupervisor = (s: Supervisor) => {
    setEditingSupervisor(s);
    setSupName(s.name);
    setSupEmail(s.email);
    setSupPhone(s.phone);
    setSupPassword(s.password || '123');
    setShowSupPassword(false);
    setSupActive(s.active !== false);
    setSupPermissions({
      ...DEFAULT_SUPERVISOR_PERMISSIONS,
      ...s.permissions,
      canDeleteTechnician: false,
    });
    setIsSupervisorModalOpen(true);
  };

  const handleSaveSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    if (!onSaveSupervisor) return;

    onSaveSupervisor({
      id: editingSupervisor?.id || `sup-${Date.now()}`,
      tenantId: activeTenantId,
      name: supName.trim(),
      email: supEmail.trim(),
      phone: supPhone.trim(),
      password: supPassword.trim() || '123',
      active: supActive,
      avatarColor: 'from-purple-600 to-indigo-600',
      permissions: {
        ...supPermissions,
        canDeleteTechnician: false,
      },
      createdAt: editingSupervisor?.createdAt || new Date().toISOString()
    });
    setIsSupervisorModalOpen(false);
  };

  const confirmDeleteSupervisor = () => {
    if (!supervisorToDelete) return;
    if (!isAdmin) {
      setShowAdminBlockedAlert(true);
      setSupervisorToDelete(null);
      return;
    }
    if (onDeleteSupervisor) {
      onDeleteSupervisor(supervisorToDelete.id);
    }
    setSupervisorToDelete(null);
  };

  const colorPresets = [
    { label: 'Ciano / Azul', value: 'from-cyan-600 to-blue-600' },
    { label: 'Esmeralda / Verde', value: 'from-emerald-600 to-teal-600' },
    { label: 'Âmbar / Laranja', value: 'from-amber-500 to-orange-600' },
    { label: 'Roxo / Violeta', value: 'from-purple-600 to-violet-600' },
    { label: 'Ciano / Sky', value: 'from-cyan-600 to-sky-600' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-400" />
            Gestão da Equipe Técnica & Campo
          </h1>
          <p className="text-xs text-slate-400">
            Controle de técnicos, supervisores de equipe, GPS em tempo real e liberação de orçamentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'supervisors' ? (
            isAdmin && (
              <button
                type="button"
                onClick={openNewSupervisor}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Supervisor
              </button>
            )
          ) : (
            (isAdmin || (currentUser?.role === 'supervisor' && currentUser.supervisorPermissions?.canCreateTechnician !== false)) && (
              <button
                type="button"
                onClick={openNewTech}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Técnico
              </button>
            )
          )}
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('technicians')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'technicians'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <HardHat className="w-4 h-4" />
          Colaboradores ({companyTechnicians.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('supervisors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'supervisors'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-purple-400" />
          👔 Supervisores ({companySupervisors.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('gps')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'gps'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          🛰️ Rastreamento GPS ao Vivo
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
            {companyTechnicians.filter(t => (liveLocations[t.id] || t.lastLocation)?.isOnline).length} Online
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'permissions'
              ? 'bg-slate-700 text-white shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          Permissões & Orçamentos
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('manuais')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'manuais'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-emerald-900/40'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          📚 Manuais & Liberação (PDF)
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
            {companyTechnicians.filter(t => t.canDownloadManual !== false).length}/{companyTechnicians.length} Lib.
          </span>
        </button>
      </div>

      {/* Manual Action Toast Feedback */}
      {manualFeedback && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{manualFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setManualFeedback(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Plan Capacity Indicator */}
      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
        isAtLimit 
          ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' 
          : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-2">
          <Crown className={`w-4 h-4 ${isAtLimit ? 'text-amber-400' : 'text-cyan-400'}`} />
          <span>
            <strong>Capacidade do {currentPlan.name}:</strong>{' '}
            <span className="font-mono font-bold text-white">
              {activeTechs.length} de {currentPlan.maxTechnicians ?? 'Ilimitado'}
            </span>{' '}
            técnicos ativos cadastrados.
            {isAtLimit && <span className="text-amber-400 font-bold ml-1.5">(Limite Máximo Atingido)</span>}
          </span>
        </div>

        {currentPlan.maxTechnicians !== null && onTriggerUpgrade && (
          <button
            type="button"
            onClick={() => onTriggerUpgrade(
              'Aumentar Capacidade de Técnicos',
              'Faça o upgrade para o Plano Pro (até 15 técnicos) ou Plano Full (técnicos e clientes ilimitados) para expandir sua operação.'
            )}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline shrink-0 cursor-pointer text-left sm:text-right"
          >
            Fazer Upgrade de Plano →
          </button>
        )}
      </div>

      {/* SUB-TAB 1: TECHNICIANS LIST */}
      {activeSubTab === 'technicians' && (
        <div className="space-y-4">
          {/* Administrador do Sistema Card */}
          {isAdmin && (
            <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Administrador do Sistema</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      Acesso Total
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Login: <span className="text-cyan-300 font-mono font-medium">{currentTenant?.adminLoginUser || company?.email || 'admin'}</span> • Gerencia equipe, clientes, orçamentos e relatórios
                  </p>
                </div>
              </div>

              {onOpenChangeAdminPassword && (
                <button
                  type="button"
                  onClick={onOpenChangeAdminPassword}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/90 hover:bg-cyan-950/60 text-cyan-300 hover:text-white border border-cyan-700/50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  Alterar Senha do Administrador
                </button>
              )}
            </div>
          )}

          {/* Technicians Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companyTechnicians.length === 0 ? (
              <div className="col-span-full py-12 px-4 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <HardHat className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Nenhum técnico cadastrado nesta empresa</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Cadastre os colaboradores da sua equipe para delegar ordens de serviço e acompanhar a localização deles em tempo real.
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openNewTech}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Primeiro Técnico
                  </button>
                )}
              </div>
            ) : (
              companyTechnicians.map((t) => {
                const techOrders = workOrders.filter(o => o.assignedTechnicianIds.includes(t.id));
                const pendingOrders = techOrders.filter(o => o.status !== 'concluida' && o.status !== 'cancelada');
                const completedOrders = techOrders.filter(o => o.status === 'concluida');
                const loc = liveLocations[t.id] || t.lastLocation;
                const hasGps = !!loc?.latitude;

                return (
                  <div
                    key={t.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white">{t.name}</h3>
                              {hasGps ? (
                                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  GPS Ativo
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                                  GPS em Espera
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-cyan-400 font-medium">{t.specialty}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditTech(t)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Editar Técnico e Permissões"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteTech(t.id, t.name)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isAdmin
                                ? 'text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-500/20 cursor-pointer'
                                : 'text-slate-600 bg-slate-900 opacity-60 cursor-not-allowed'
                            }`}
                            title={isAdmin ? "Excluir Técnico (ADM)" : "Apenas o Administrador pode excluir técnicos"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 my-3">
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t.phone}</span>
                        </p>
                        <p className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t.email}</span>
                        </p>
                        {t.canCreateBudgets !== false ? (
                          <p className="flex items-center gap-2 text-emerald-400 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pode emitir orçamentos em campo
                          </p>
                        ) : (
                          <p className="flex items-center gap-2 text-slate-500 text-[11px]">
                            <X className="w-3.5 h-3.5" />
                            Apenas executa ordens de serviço
                          </p>
                        )}

                        {t.canDownloadManual !== false ? (
                          <div className="flex items-center justify-between text-emerald-400 text-[11px] font-medium pt-1 border-t border-slate-800/60">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              Manual Liberado no Celular
                            </span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleToggleTechManual(t)}
                                className="text-[10px] text-slate-400 hover:text-amber-300 underline cursor-pointer"
                              >
                                Bloquear
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-amber-400 text-[11px] font-medium pt-1 border-t border-slate-800/60">
                            <span className="flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              Manual Bloqueado
                            </span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleToggleTechManual(t)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-bold cursor-pointer"
                              >
                                Liberar Manual
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* GPS Quick Link */}
                      {hasGps && loc && (
                        <div className="my-2 p-2 bg-slate-950/70 border border-cyan-500/30 rounded-lg flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-mono text-[11px]">
                              {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                            </span>
                            <span className="text-[10px] text-slate-500">(±{loc.accuracy || 10}m)</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            Google Maps <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Counters */}
                      <div className="grid grid-cols-2 gap-2 my-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">O.S Pendentes</span>
                          <span className="text-base font-bold text-amber-400 font-mono">{pendingOrders.length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">O.S Finalizadas</span>
                          <span className="text-base font-bold text-emerald-400 font-mono">{completedOrders.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action: Switch to this technician */}
                    <div className="pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => onSwitchToTech(t.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                      >
                        <HardHat className="w-4 h-4 text-amber-400" />
                        <span>Acessar Modo Técnico como {t.name.split(' ')[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: SUPERVISORS LIST & PERMISSIONS */}
      {activeSubTab === 'supervisors' && (
        <div className="space-y-4">
          {/* Header Card for Supervisors */}
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-950/50 shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Supervisores da Empresa & Permissões Customizadas</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                      Hierarquia de Gestão
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Dê autonomia aos seus supervisores para gerenciar a rotina operacional da empresa. Cada supervisor possui permissões específicas liberadas pelo Dono da Empresa.
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={openNewSupervisor}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/50 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Supervisor
                </button>
              )}
            </div>

            {/* Inviolable Security Rule Banner */}
            <div className="mt-4 p-3 bg-purple-950/50 border border-purple-500/30 rounded-xl flex items-center gap-3 text-xs text-purple-200">
              <Lock className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Regra de Segurança do VigiaOS:</strong> Supervisores têm autonomia para coordenar chamados, alterar técnicos de O.S, incluir clientes e materiais, mas <strong>NUNCA podem excluir técnicos</strong> do sistema. A exclusão de técnicos é restrita exclusivamente ao Dono da Empresa.
              </span>
            </div>
          </div>

          {/* Supervisors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companySupervisors.length === 0 ? (
              <div className="col-span-full py-12 px-4 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
                  <UserCog className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Nenhum supervisor cadastrado nesta empresa</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Cadastre supervisores para delegar tarefas operacionais. Você define exatamente o que cada supervisor pode ou não fazer.
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openNewSupervisor}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Primeiro Supervisor
                  </button>
                )}
              </div>
            ) : (
              companySupervisors.map((s) => {
                const perms = s.permissions || DEFAULT_SUPERVISOR_PERMISSIONS;

                return (
                  <div
                    key={s.id}
                    className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
                  >
                    <div>
                      {/* Top Bar of Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white">{s.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                s.active !== false
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {s.active !== false ? 'Supervisor Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <p className="text-xs text-purple-400 font-medium">Acesso Operacional Delegado</p>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditSupervisor(s)}
                              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Editar Permissões do Supervisor"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSupervisorToDelete(s)}
                              className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Supervisor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1.5 text-xs text-slate-300 my-3">
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-purple-400" />
                          <span>{s.phone}</span>
                          {s.phone && (
                            <a
                              href={generateWhatsAppLink(s.phone, `Olá ${s.name}, tudo bem? Mensagem da gerência VigiaOS.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-emerald-400 hover:underline font-semibold ml-1"
                            >
                              WhatsApp
                            </a>
                          )}
                        </p>
                        <p className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-purple-400" />
                          <span>{s.email}</span>
                        </p>
                        {isAdmin && (
                          <p className="flex items-center gap-2 text-slate-400">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span>Senha de login: <span className="font-mono text-slate-200 font-bold">{s.password || '123'}</span></span>
                          </p>
                        )}
                      </div>

                      {/* Rule Badge */}
                      <div className="my-2.5 p-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                          <Lock className="w-3.5 h-3.5" />
                          Excluir Técnicos:
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/50 font-bold text-[10px]">
                          PROIBIDO (Exclusivo Dono)
                        </span>
                      </div>

                      {/* Permissions List Grid */}
                      <div className="my-3 space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-xs">
                        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-purple-400" />
                          Permissões Habilitadas
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {perms.canChangeTechInOS !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canChangeTechInOS !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Alterar técnico da O.S
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {perms.canCreateOS !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canCreateOS !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Adicionar O.S p/ técnicos
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {perms.canEnterTechnicianMode !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canEnterTechnicianMode !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Entrar no modo técnico
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {perms.canCreateClient !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canCreateClient !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Incluir cliente novo
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {perms.canEditClient !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canEditClient !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Editar cadastro clientes
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {perms.canCreateTechnician !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canCreateTechnician !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Cadastrar técnico
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {perms.canAddItemsToOS !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canAddItemsToOS !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Incluir material/serviço O.S
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {perms.canCreateBudgets !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canCreateBudgets !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Emitir orçamentos
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {perms.canExportReports !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canExportReports !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Exportar relatórios PDF
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {perms.canViewGPS !== false ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={perms.canViewGPS !== false ? 'text-slate-200' : 'text-slate-500'}>
                              Ver GPS da equipe
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    {isAdmin && (
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openEditSupervisor(s)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5 text-purple-400" />
                          <span>Configurar Permissões</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LIVE GPS MONITORING */}
      {activeSubTab === 'gps' && (
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                Painel de Localização GPS em Tempo Real
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhe o deslocamento da sua frota e técnicos de campo diretamente no mapa
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 font-mono">
                Sincronizado: {lastGpsSyncTime.toLocaleTimeString()}
              </span>
              <button
                type="button"
                onClick={fetchLiveLocations}
                disabled={isRefreshingGps}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingGps ? 'animate-spin' : ''}`} />
                Atualizar Agora
              </button>
            </div>
          </div>

          {/* GPS Map Simulation & Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Mapa de Posições dos Técnicos
              </span>
              <span className="text-xs text-slate-400">
                Clique em qualquer técnico para ver a rota exata
              </span>
            </div>

            {/* Visual Radar / Map Canvas Frame */}
            <div className="relative w-full h-72 sm:h-96 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
              {/* Subtle Grid Lines */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{
                  backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  backgroundPosition: '0 0, 20px 20px'
                }} 
              />

              {/* Central Base Marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                <div className="w-9 h-9 rounded-full bg-cyan-600/30 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
                  <Compass className="w-5 h-5 text-cyan-300" />
                </div>
                <span className="text-[10px] font-bold text-cyan-300 bg-slate-900/90 px-2 py-0.5 rounded-full border border-cyan-500/40 mt-1">
                  Central / Empresa
                </span>
              </div>

              {/* Technician Markers on Map */}
              {companyTechnicians.map((t, idx) => {
                const loc = liveLocations[t.id] || t.lastLocation;
                const hasLoc = !!loc?.latitude;
                
                // Position calculations relative to center for mock placement if coordinates are close
                const angle = (idx / Math.max(1, companyTechnicians.length)) * 2 * Math.PI;
                const radius = 100 + (idx % 3) * 30;
                const posX = hasLoc ? `calc(50% + ${Math.sin(angle) * radius}px)` : 'auto';
                const posY = hasLoc ? `calc(50% - ${Math.cos(angle) * radius}px)` : 'auto';

                if (!hasLoc) return null;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTechOnMap(t)}
                    style={{ left: posX, top: posY }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10 transition-transform hover:scale-110"
                  >
                    <div className="relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.avatarColor} border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-xl`}>
                        {t.name.charAt(0)}
                      </div>
                    </div>
                    <div className="mt-1 bg-slate-900/95 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white whitespace-nowrap shadow-lg flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {t.name.split(' ')[0]}
                    </div>
                  </div>
                );
              })}

              {companyTechnicians.every(t => !(liveLocations[t.id] || t.lastLocation)?.latitude) && (
                <div className="text-center z-10 p-6 max-w-sm bg-slate-900/90 border border-slate-800 rounded-2xl">
                  <Radio className="w-8 h-8 mx-auto text-amber-400 mb-2 animate-pulse" />
                  <h4 className="text-sm font-bold text-white">Aguardando Coordenadas de Campo</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Assim que o técnico abrir o aplicativo de campo no smartphone com o GPS ativado, a localização dele aparecerá aqui automaticamente.
                  </p>
                </div>
              )}
            </div>

            {/* Technicians GPS Status List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status dos Aparelhos da Equipe
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {companyTechnicians.map((t) => {
                  const loc = liveLocations[t.id] || t.lastLocation;
                  const isOnline = !!loc?.latitude;

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isOnline
                          ? 'bg-slate-950/80 border-cyan-500/40 shadow-md'
                          : 'bg-slate-900/50 border-slate-800 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow`}>
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{t.name}</h4>
                            <p className="text-[11px] text-slate-400">{t.specialty}</p>
                          </div>
                        </div>

                        {isOnline ? (
                          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            GPS Ativo
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Aguardando Sinal
                          </span>
                        )}
                      </div>

                      {isOnline && loc ? (
                        <div className="mt-3 space-y-2 pt-2 border-t border-slate-800 text-xs">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Coordenadas:</span>
                            <span className="font-mono text-cyan-300">
                              {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Precisão do Sinal:</span>
                            <span className="text-emerald-400 font-semibold">±{loc.accuracy || 10} metros</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Último Envio:</span>
                            <span className="text-slate-300 font-mono text-[11px]">
                              {loc.timestamp ? formatDateBR(loc.timestamp) : 'Agora'}
                            </span>
                          </div>

                          {/* Action Navigation Buttons */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                            <a
                              href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-colors"
                            >
                              <Navigation className="w-3 h-3" />
                              Google Maps
                            </a>

                            <a
                              href={`https://waze.com/ul?ll=${loc.latitude},${loc.longitude}&navigate=yes`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-bold transition-colors"
                            >
                              <Compass className="w-3 h-3" />
                              Waze
                            </a>

                            <a
                              href={generateWhatsAppLink(t.phone, `Olá ${t.name}, tudo bem? Estou acompanhando sua rota pelo sistema SegurOS.`)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors col-span-2 sm:col-span-1"
                            >
                              <Send className="w-3 h-3" />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Aguardando o técnico abrir o app no celular com o GPS ligado.</span>
                          <a
                            href={generateWhatsAppLink(t.phone, `Olá ${t.name}, por favor acesse o aplicativo da empresa e ative a localização no seu smartphone.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline font-bold shrink-0 ml-2"
                          >
                            Lembrar no WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PERMISSIONS & BUDGET RULES */}
      {activeSubTab === 'permissions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              Regras e Permissões Globais da Equipe (Habilitadas pelo Dono)
            </h2>
            <p className="text-xs text-slate-400">
              Controle quais recursos e ferramentas avançadas seus funcionários podem utilizar durante os atendimentos.
            </p>
          </div>

          <div className="space-y-4">
            {/* Permission 1: Allow Technician Budgets */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Permitir que Técnicos emitam Orçamentos no Aplicativo de Campo
                  </h3>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">
                  Quando ativado, os técnicos podem elaborar propostas comerciais de materiais e mão de obra e enviar o PDF oficial no WhatsApp do cliente direto da visita técnica.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleAllowBudgets}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  allowBudgets
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {allowBudgets ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Habilitado para a Equipe
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Desabilitado
                  </>
                )}
              </button>
            </div>

            {/* Permission 2: GPS Tracking */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    Rastreamento GPS Contínuo dos Técnicos em Campo
                  </h3>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">
                  Quando ativo, o aplicativo transmite a localização dos técnicos durante o horário de trabalho para que o dono da empresa saiba onde cada funcionário está em tempo real.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleEnableGps}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  enableGps
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {enableGps ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    GPS Habilitado
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    GPS Pausado
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: CENTRAL DE MANUAIS OPERACIONAIS & LIBERAÇÃO DE ACESSO */}
      {activeSubTab === 'manuais' && (
        <div className="space-y-6">
          {/* Top Banner & Batch Download */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <BookOpen className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-bold text-white">Central de Manuais Operacionais em PDF</h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  Oficial VigiaOS
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl">
                Documentação completa e procedimentos operacionais padronizados (SOP) em PDF timbrado. 
                O Administrador pode baixar os 3 manuais a qualquer momento e controlar individualmente quem tem permissão para baixá-los.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadAllManuals}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              Baixar Pacote Completo (3 PDFs)
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Manuais Disponíveis</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">03 Manuais Oficiais</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                  PDF A4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Administrador, Técnico e Financeiro</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Acesso dos Técnicos</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-amber-400">
                  {companyTechnicians.filter(t => t.canDownloadManual !== false).length} de {companyTechnicians.length}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  Campo Mobile
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Técnicos com manual liberado no app</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block mb-1">Acesso do Financeiro</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-emerald-400">
                  {companyFinancialOperators.filter(o => o.canDownloadManual !== false).length} de {companyFinancialOperators.length}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Caixa & Cobrança
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Operadores financeiros liberados</p>
            </div>
          </div>

          {/* SEÇÃO 1: 3 CARDS DE DOWNLOAD DIRETO PARA O ADMINISTRADOR */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  1. Downloads Imediatos do Administrador
                </h3>
                <p className="text-xs text-slate-400">
                  Como administrador/dono, você possui acesso irrestrito para baixar e inspecionar qualquer um dos 3 manuais.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Manual do Administrador */}
              <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      GESTOR & DONO
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">Manual do Administrador</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Procedimentos de despacho no WhatsApp, acompanhamento de GPS em tempo real, faturamento Pix/Boleto, gestão de planos e liberação de acessos.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p>• Gestão completa de Ordens de Serviço</p>
                    <p>• Monitoramento de técnicos via satélite</p>
                    <p>• Controle financeiro e limites do plano</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadAdminManual}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Manual ADM (PDF)
                </button>
              </div>

              {/* Card 2: Manual do Técnico de Campo */}
              <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <HardHat className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                      CAMPO MOBILE
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">Manual do Técnico em Campo</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Passo a passo no celular: recebimento do chamado, início do deslocamento GPS, fotos obrigatórias (Antes, Durante, Depois, Equipamento), laudo e assinatura digital.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p>• 8 passos operacionais no smartphone</p>
                    <p>• Coleta de assinatura digital com o dedo</p>
                    <p>• Emissão de orçamentos extras no local</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTechManual}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Manual Técnico (PDF)
                </button>
              </div>

              {/* Card 3: Manual do Operador Financeiro */}
              <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      CAIXA & COBRANÇA
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">Manual do Operador Financeiro</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Emissão de cobranças Pix EMVCo (QR Code / Copia e Cola), boletos bancários FEBRABAN, contas a pagar, comissões de técnicos, visitas avulsas e relatório DRE.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p>• Pix dinâmico e boletos com código de barras</p>
                    <p>• Faturamento de atendimentos e visitas avulsas</p>
                    <p>• Repasse de comissões e baixa de despesas</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadFinManual}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Manual Financeiro (PDF)
                </button>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: LIBERAÇÃO DE ACESSO PARA TÉCNICOS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    2. Liberação de Manual para Técnicos de Campo
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                    {companyTechnicians.filter(t => t.canDownloadManual !== false).length}/{companyTechnicians.length} Liberados
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  O administrador escolhe quais técnicos podem baixar o manual no celular. O botão surge automaticamente no app do técnico liberado.
                </p>
              </div>

              {/* Bulk Actions for Techs */}
              {companyTechnicians.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleBulkUnlockTechs(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Liberar para Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkUnlockTechs(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Bloquear Todos
                  </button>
                </div>
              )}
            </div>

            {companyTechnicians.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800">
                Nenhum técnico cadastrado ainda nesta empresa.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {companyTechnicians.map((tech) => {
                  const isUnlocked = tech.canDownloadManual !== false;

                  return (
                    <div
                      key={tech.id}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isUnlocked
                          ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800 opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tech.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow shrink-0`}>
                          {tech.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{tech.name}</h4>
                            {isUnlocked ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                                🟢 Liberado
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium shrink-0">
                                🔒 Bloqueado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{tech.specialty} • {tech.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTechManual(tech)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isUnlocked
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-red-950 hover:text-red-300 hover:border-red-700'
                              : 'bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500'
                          }`}
                          title={isUnlocked ? "Clique para bloquear o acesso deste técnico" : "Clique para liberar o manual para este técnico"}
                        >
                          {isUnlocked ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Liberado</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Liberar</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadTechManual}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                          title="Baixar Manual do Técnico"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEÇÃO 3: LIBERAÇÃO DE ACESSO PARA OPERADORES FINANCEIROS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    3. Liberação de Manual para Operadores Financeiros
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    {companyFinancialOperators.filter(o => o.canDownloadManual !== false).length}/{companyFinancialOperators.length} Liberados
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  O administrador escolhe quais operadores financeiros terão o manual de cobrança, Pix, boletos e comissões disponível no painel.
                </p>
              </div>

              {/* Bulk Actions for Financial */}
              {companyFinancialOperators.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleBulkUnlockFin(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Liberar para Todo o Financeiro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkUnlockFin(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Bloquear Todos
                  </button>
                </div>
              )}
            </div>

            {companyFinancialOperators.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
                <p>Nenhum operador financeiro cadastrado individualmente ainda.</p>
                <p className="text-slate-500 text-[11px]">
                  Você pode cadastrar operadores financeiros na aba "Financeiro & Pix" &gt; "Operadores" ou utilizar o acesso do Administrador.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {companyFinancialOperators.map((op) => {
                  const isUnlocked = op.canDownloadManual !== false;

                  return (
                    <div
                      key={op.id}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isUnlocked
                          ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800 opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${op.avatarColor || 'from-emerald-600 to-teal-600'} flex items-center justify-center text-white font-bold text-sm shadow shrink-0`}>
                          {op.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{op.name}</h4>
                            {isUnlocked ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                                🟢 Liberado
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium shrink-0">
                                🔒 Bloqueado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{op.email} • {op.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleFinManual(op)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isUnlocked
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-red-950 hover:text-red-300 hover:border-red-700'
                              : 'bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500'
                          }`}
                          title={isUnlocked ? "Clique para bloquear o acesso deste operador" : "Clique para liberar o manual para este operador"}
                        >
                          {isUnlocked ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Liberado</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Liberar</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadFinManual}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                          title="Baixar Manual Financeiro"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Cadastrar / Editar Técnico */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-400" />
                {editingTech ? 'Editar Técnico & Permissões' : 'Cadastrar Novo Técnico'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Alberto da Silva"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (11) 99123-4567"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">E-mail (Login do Técnico)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: carlos@empresa.com.br"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Senha de Acesso do Técnico</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ex: 123 ou tec2026"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Especialidade Principal</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex: CFTV IP, Cerca Elétrica & Alarmes"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  required
                />
              </div>

              {/* Individual Budget Permission */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canCreateBudgets}
                    onChange={(e) => setCanCreateBudgets(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-white block">Permitir emissão de orçamentos por este técnico</span>
                    <span className="text-[11px] text-slate-400">
                      O técnico poderá montar propostas comerciais e mandar PDF no WhatsApp do cliente.
                    </span>
                  </div>
                </label>
              </div>

              {/* Individual Manual Download Permission */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canDownloadManual}
                    onChange={(e) => setCanDownloadManual(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-white block flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      Liberar Download do Manual do Técnico (PDF)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      O técnico terá acesso ao botão de download do manual oficial com procedimentos de campo no celular.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Cor do Avatar</label>
                <div className="grid grid-cols-2 gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setAvatarColor(c.value)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs cursor-pointer ${
                        avatarColor === c.value ? 'border-white bg-slate-800' : 'border-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${c.value}`} />
                      <span className="text-slate-300">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {editingTech && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      requestDeleteTech(editingTech.id, editingTech.name);
                    }}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors ${
                      isAdmin
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer'
                        : 'text-slate-500 opacity-60 cursor-not-allowed'
                    }`}
                    title={isAdmin ? "Excluir este técnico (ADM)" : "Apenas o Administrador pode excluir"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Técnico</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Salvar Técnico
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Technician Confirmation Modal (ADM Only) */}
      {techToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Exclusão por Administrador (ADM)
                </span>
                <h3 className="text-base font-bold text-white">Excluir Técnico</h3>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Técnico:</p>
              <p className="text-white font-bold text-sm">{techToDelete.name}</p>
            </div>

            <p className="text-xs text-slate-300">
              Tem certeza que deseja remover este técnico da sua empresa? As Ordens de Serviço vinculadas permanecerão registradas no histórico.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTechToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteTech}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-red-950"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Blocked Alert Modal */}
      {showAdminBlockedAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Acesso Restrito</span>
                <h3 className="text-base font-bold text-white">Ação Exclusiva de Administrador</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apenas o <strong>Administrador do Sistema</strong> possui autorização para remover técnicos e colaboradores da empresa.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAdminBlockedAlert(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Form Modal (Create / Edit) */}
      {isSupervisorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSupervisor ? 'Editar Supervisor & Permissões' : 'Cadastrar Novo Supervisor'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina os dados de acesso e as permissões individuais deste supervisor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupervisorModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupervisorSubmit} className="space-y-4 pt-4 text-xs">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Nome Completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo (Supervisor)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Telefone / WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="Ex: (21) 98765-4321"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    E-mail de Login <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    placeholder="Ex: supervisor@empresa.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Senha de Acesso <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSupPassword ? 'text' : 'password'}
                      value={supPassword}
                      onChange={(e) => setSupPassword(e.target.value)}
                      placeholder="Senha do supervisor"
                      className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSupPassword(!showSupPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showSupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Status da Conta</span>
                  <span className="text-[11px] text-slate-400">Supervisor ativo pode fazer login e operar o sistema</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSupActive(!supActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    supActive ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      supActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Permissions Section Header & Quick Presets */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      Permissões Específicas do Supervisor
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Marque exatamente o que este supervisor pode acessar ou modificar
                    </p>
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSupPermissions({ ...DEFAULT_SUPERVISOR_PERMISSIONS })}
                      className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      ✨ Padrão Total
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSupPermissions({
                          ...DEFAULT_SUPERVISOR_PERMISSIONS,
                          canCreateTechnician: false,
                          canEditTechnician: false,
                          canManageInventory: false,
                          canCreateBudgets: false,
                          canDeleteClient: false,
                        })
                      }
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-medium cursor-pointer"
                    >
                      📋 Apenas O.S
                    </button>
                  </div>
                </div>

                {/* Granular Permission Toggles */}
                <div className="space-y-2 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 max-h-72 overflow-y-auto">
                  {/* 1. Alterar técnico do chamado */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-cyan-400 mt-0.5">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Alterar técnico do chamado (Despacho de O.S)</span>
                        <span className="text-[11px] text-slate-400">
                          Pode transferir ou trocar o técnico responsável pelas ordens de serviço
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canChangeTechInOS !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canChangeTechInOS: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 2. Adicionar O.S para os técnicos */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer border-t border-slate-900">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Adicionar O.S para os técnicos</span>
                        <span className="text-[11px] text-slate-400">
                          Pode abrir novos chamados técnicos, manutenções e instalações
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canCreateOS !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canCreateOS: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 3. Entrar no modo do técnico */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer border-t border-slate-900">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Entrar no modo do técnico (Visão de Campo)</span>
                        <span className="text-[11px] text-slate-400">
                          Pode alternar para a tela individual do celular de qualquer colaborador
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canEnterTechnicianMode !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canEnterTechnicianMode: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 4. Incluir cliente novo */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer border-t border-slate-900">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Incluir cliente novo</span>
                        <span className="text-[11px] text-slate-400">
                          Pode cadastrar novos clientes residenciais, comerciais e condomínios
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canCreateClient !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canCreateClient: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 5. Editar cadastro de clientes */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer border-t border-slate-900">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Editar cadastro de clientes</span>
                        <span className="text-[11px] text-slate-400">
                          Pode atualizar telefone, WhatsApp, endereço e observações técnicas
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canEditClient !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canEditClient: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 6. Cadastrar técnico */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer border-t border-slate-900">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Cadastrar técnico</span>
                        <span className="text-[11px] text-slate-400">
                          Pode adicionar novos técnicos na equipe da empresa
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canCreateTechnician !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canCreateTechnician: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 7. Incluir material ou serviço nas O.S */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer border-t border-slate-900">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 mt-0.5">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Incluir material ou serviço nas O.S</span>
                        <span className="text-[11px] text-slate-400">
                          Pode adicionar peças, cabos, câmeras, conectores e mão de obra nos chamados
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canAddItemsToOS !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canAddItemsToOS: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 8. Emitir orçamentos */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer border-t border-slate-900">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Emitir e enviar orçamentos</span>
                        <span className="text-[11px] text-slate-400">
                          Pode gerar propostas comerciais com cálculo automático de valores
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canCreateBudgets !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canCreateBudgets: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 9. Exportar relatórios em PDF */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer border-t border-slate-900">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Exportar relatórios & Histórico em PDF</span>
                        <span className="text-[11px] text-slate-400">
                          Pode gerar e baixar relatórios de clientes e histórico de O.S em documento PDF
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canExportReports !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canExportReports: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 10. Acompanhar GPS ao vivo */}
                  <label className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer border-t border-slate-900">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Acompanhar mapa de GPS da equipe</span>
                        <span className="text-[11px] text-slate-400">
                          Pode visualizar a localização em tempo real dos técnicos em deslocamento
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={supPermissions.canViewGPS !== false}
                      onChange={(e) => setSupPermissions(prev => ({ ...prev, canViewGPS: e.target.checked }))}
                      className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                  </label>

                  {/* 11. LOCKED INVIOLABLE RULE: Excluir técnicos */}
                  <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 opacity-90">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 mt-0.5">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-200 text-xs">Excluir técnicos</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 bg-red-500/20 text-red-300 rounded font-bold">
                            Bloqueado
                          </span>
                        </div>
                        <span className="text-[11px] text-red-300/80 block mt-0.5">
                          O supervisor <strong>nunca terá permissão</strong> para excluir técnicos. Esta ação é de exclusividade irrevogável do Dono da Empresa.
                        </span>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded bg-slate-900 text-slate-500 text-[10px] font-mono font-bold mt-1">
                      NÃO
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupervisorModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-purple-950/50"
                >
                  {editingSupervisor ? 'Salvar Alterações' : 'Cadastrar Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Supervisor Confirmation Modal */}
      {supervisorToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Exclusão por Administrador (Dono)
                </span>
                <h3 className="text-base font-bold text-white">Excluir Supervisor</h3>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Supervisor:</p>
              <p className="text-white font-bold text-sm">{supervisorToDelete.name}</p>
              <p className="text-slate-400 text-[11px]">{supervisorToDelete.email}</p>
            </div>

            <p className="text-xs text-slate-300">
              Tem certeza que deseja revogar o acesso e excluir este supervisor? O login deixará de funcionar imediatamente.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSupervisorToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteSupervisor}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-red-950"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
