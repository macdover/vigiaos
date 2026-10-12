import React from 'react';
import { 
  ShieldCheck, 
  Wrench, 
  UserCheck, 
  ChevronDown, 
  HardHat, 
  FileText, 
  Clock,
  Users,
  Package,
  LayoutDashboard,
  Building2,
  Crown,
  KeyRound,
  LogOut,
  Sun,
  Moon,
  Shield,
  DollarSign,
  BookOpen
} from 'lucide-react';
import { CurrentUser, Technician, WorkOrder, CompanySettings } from '../types';
import { PLAN_CONFIGS } from '../data/initialData';
import { 
  downloadAdminManualPDF, 
  downloadTechnicianManualPDF, 
  downloadFinancialManualPDF 
} from '../utils/manualPdfGenerator';

interface HeaderProps {
  currentUser: CurrentUser;
  onUserChange: (user: CurrentUser) => void;
  technicians: Technician[];
  workOrders: WorkOrder[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  company: CompanySettings;
  onLogout?: () => void;
  isMasterLogged?: boolean;
  onOpenChangeAdminPassword?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  technicians,
  workOrders,
  activeTab,
  onTabChange,
  company,
  onLogout,
  isMasterLogged = false,
  onOpenChangeAdminPassword,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [techDropdownOpen, setTechDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTechDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTechnician = currentUser.role === 'technician' 
    ? technicians.find(t => t.id === currentUser.technicianId) || technicians[0]
    : null;

  const totalOpenOS = workOrders.filter(o => o.status !== 'concluida' && o.status !== 'cancelada').length;
  const planInfo = PLAN_CONFIGS[company.plan || 'master'];
  const isSupervisor = currentUser.role === 'supervisor';
  const supervisorPerms = currentUser.supervisorPermissions;

  const adminTabs = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'work_orders', label: 'Ordens de Serviço', icon: Wrench, badge: totalOpenOS },
    { id: 'financial', label: 'Financeiro & Pix', icon: DollarSign },
    { id: 'budgets', label: 'Orçamentos', icon: FileText },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'inventory', label: 'Estoque & Serviços', icon: Package },
    { id: 'team', label: 'Equipe', icon: HardHat },
    { id: 'company_settings', label: 'Empresa & Planos', icon: Building2 },
    ...(isMasterLogged ? [{ id: 'master_saas', label: 'Painel Master (Dono)', icon: KeyRound, isSpecial: true }] : []),
  ];

  const financialTabs = [
    { id: 'financial', label: 'Financeiro & Pix', icon: DollarSign },
    { id: 'work_orders', label: 'Ordens de Serviço', icon: Wrench, badge: totalOpenOS },
    { id: 'clients', label: 'Clientes', icon: Users },
  ];

  const supervisorTabs = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'work_orders', label: 'Ordens de Serviço', icon: Wrench, badge: totalOpenOS },
    ...(supervisorPerms?.canAccessFinancial ? [{ id: 'financial', label: 'Financeiro & Pix', icon: DollarSign }] : []),
    ...(supervisorPerms?.canCreateBudgets !== false ? [{ id: 'budgets', label: 'Orçamentos', icon: FileText }] : []),
    { id: 'clients', label: 'Clientes', icon: Users },
    ...(supervisorPerms?.canManageInventory !== false ? [{ id: 'inventory', label: 'Estoque & Serviços', icon: Package }] : []),
    { id: 'team', label: 'Equipe', icon: HardHat },
  ];

  const currentNavTabs = currentUser.role === 'admin' 
    ? adminTabs 
    : currentUser.role === 'financial'
    ? financialTabs
    : isSupervisor 
    ? supervisorTabs 
    : [];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3 w-full">
          {/* Logo & Identity (White-Label Enabled) */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0 shrink" 
            onClick={() => onTabChange(currentUser.role === 'admin' ? 'dashboard' : 'my_os')}
          >
            {company.logoUrl ? (
              <div className="h-9 px-1.5 min-w-[36px] max-w-[90px] sm:max-w-[160px] rounded-lg bg-slate-950 p-1 border border-slate-700/80 flex items-center justify-center overflow-hidden shadow-md shrink-0">
                <img 
                  src={company.logoUrl} 
                  alt={company.tradeName || 'Logo'} 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30 shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[220px]">
                  {company.tradeName || 'VigiaOS'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 hidden md:inline-block shrink-0">
                  Segurança Eletrônica
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden lg:block truncate max-w-[320px]">
                {company.name || 'O.S • Orçamentos • Assinatura Digital • Modo Técnico'}
              </p>
            </div>
          </div>

          {/* Right Section: Plan Badge + Role Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0" ref={dropdownRef}>
            {/* Quick Plan Indicator (Admin) */}
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => onTabChange('company_settings')}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  company.plan === 'full'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/50'
                    : company.plan === 'pro'
                    ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 hover:bg-purple-900/50'
                    : 'bg-blue-950/80 text-cyan-300 border-cyan-500/50 hover:bg-blue-900/50'
                }`}
                title="Clique para gerenciar plano e limites"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{planInfo.name}</span>
              </button>
            )}

            {/* Quick Access to Master SaaS Owner (ONLY if master is logged in) */}
            {isMasterLogged && (
              <button
                type="button"
                onClick={() => onTabChange('master_saas')}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 ${
                  activeTab === 'master_saas'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-amber-900/50'
                    : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/40 hover:border-amber-400'
                }`}
                title="Painel Master do Dono do SaaS"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Painel Master</span>
              </button>
            )}

            {/* Theme Mode Toggle (Diurno / Noturno) */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm shrink-0"
                title={theme === 'light' ? "Mudar para Modo Noturno (Escuro)" : "Mudar para Modo Diurno (Claro)"}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="hidden md:inline">Modo Noturno</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="hidden md:inline">Modo Diurno</span>
                  </>
                )}
              </button>
            )}

            {/* Alterar Senha Button (Available on top bar on md+ screens; always accessible inside dropdown on all screens) */}
            {currentUser.role === 'admin' && onOpenChangeAdminPassword && (
              <button
                type="button"
                onClick={onOpenChangeAdminPassword}
                title="Alterar Senha do Administrador"
                className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-slate-900/90 hover:bg-cyan-950/50 text-cyan-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Alterar Senha</span>
              </button>
            )}

            {/* Profile Dropdown Button */}
            <div className="relative flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTechDropdownOpen(!techDropdownOpen)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer shrink-0 ${
                  currentUser.role === 'admin'
                    ? 'bg-gradient-to-r from-blue-900/60 to-indigo-900/60 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
                    : currentUser.role === 'financial'
                    ? 'bg-gradient-to-r from-emerald-900/70 to-teal-900/60 text-emerald-300 border-emerald-500/50 hover:border-emerald-400'
                    : currentUser.role === 'supervisor'
                    ? 'bg-gradient-to-r from-purple-900/70 to-indigo-900/60 text-purple-300 border-purple-500/50 hover:border-purple-400'
                    : 'bg-gradient-to-r from-amber-950/80 to-amber-900/60 text-amber-300 border-amber-500/50 hover:border-amber-400'
                }`}
              >
                {currentUser.role === 'admin' ? (
                  <>
                    <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="hidden md:inline text-slate-300">Perfil:</span>
                    <span className="font-bold text-white hidden sm:inline">Administrador</span>
                    <span className="font-bold text-white sm:hidden">Admin</span>
                  </>
                ) : currentUser.role === 'financial' ? (
                  <>
                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="hidden md:inline text-emerald-300">Perfil:</span>
                    <span className="font-bold text-white max-w-[110px] truncate">
                      {currentUser.financialOperatorName ? currentUser.financialOperatorName.split(' ')[0] : 'Financeiro'}
                    </span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-bold hidden sm:inline">Fin</span>
                  </>
                ) : currentUser.role === 'supervisor' ? (
                  <>
                    <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="hidden md:inline text-purple-300">Perfil:</span>
                    <span className="font-bold text-white max-w-[110px] truncate">
                      {currentUser.supervisorName ? currentUser.supervisorName.split(' ')[0] : 'Supervisor'}
                    </span>
                    <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1 py-0.2 rounded font-bold hidden sm:inline">Sup</span>
                  </>
                ) : (
                  <>
                    <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="hidden md:inline text-amber-300">Modo Técnico:</span>
                    <span className="font-bold text-white max-w-[70px] sm:max-w-[130px] truncate">
                      {currentTechnician?.name.split(' ')[0] || 'Técnico'}
                    </span>
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Profile Selection Dropdown */}
              {techDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-slate-200">
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Alternar Modo de Acesso
                  </div>

                  {/* Admin Option (when logged in as admin) */}
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        onUserChange({ role: 'admin' });
                        setTechDropdownOpen(false);
                        onTabChange('dashboard');
                      }}
                      className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer bg-cyan-950/60 text-cyan-200 border border-cyan-800/60"
                    >
                      <div className="p-2 rounded-lg bg-cyan-900/40 text-cyan-400 mt-0.5">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          Administrador (Dono)
                          <span className="text-[10px] bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">Ativo</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Acesso total irrestrito: O.S, técnicos, supervisores, orçamentos, clientes e finanças.
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Financial Operator Option (when logged in as financial) */}
                  {currentUser.role === 'financial' && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-sm text-white">{currentUser.financialOperatorName || 'Operador Financeiro'}</span>
                        <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">Ativo</span>
                      </div>
                      <p className="text-[11px] text-emerald-300/80">
                        Acesso exclusivo ao módulo financeiro, contas a pagar/receber, emissão de Pix e boletos.
                      </p>
                    </div>
                  )}

                  {/* Supervisor Option (when logged in as supervisor) */}
                  {currentUser.role === 'supervisor' && (
                    <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span className="font-bold text-sm text-white">{currentUser.supervisorName || 'Supervisor'}</span>
                        <span className="text-[10px] bg-purple-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">Ativo</span>
                      </div>
                      <p className="text-[11px] text-purple-300/80">
                        Perfil com permissões operacionais delegadas pelo dono da empresa.
                      </p>
                    </div>
                  )}

                  {/* Alterar Senha do Administrador Button inside dropdown */}
                  {currentUser.role === 'admin' && onOpenChangeAdminPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setTechDropdownOpen(false);
                        onOpenChangeAdminPassword();
                      }}
                      className="w-full mt-1.5 text-left flex items-center gap-2.5 px-3 py-2 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-700/50 text-cyan-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                    >
                      <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Alterar Minha Senha de Administrador</span>
                    </button>
                  )}

                  {/* Central de Manuais Option for Admin */}
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTechDropdownOpen(false);
                        onTabChange('team');
                      }}
                      className="w-full mt-1.5 text-left flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Central de Manuais em PDF</span>
                    </button>
                  )}

                  {/* Manual download option for logged in Technician */}
                  {currentUser.role === 'technician' && currentTechnician?.canDownloadManual !== false && (
                    <button
                      type="button"
                      onClick={() => {
                        downloadTechnicianManualPDF(company);
                        setTechDropdownOpen(false);
                      }}
                      className="w-full mt-1.5 text-left flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/50 text-amber-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                    >
                      <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Baixar Meu Manual (PDF)</span>
                    </button>
                  )}

                  {/* Manual download option for logged in Financial */}
                  {currentUser.role === 'financial' && (!currentUser.financialData || currentUser.financialData.canDownloadManual !== false) && (
                    <button
                      type="button"
                      onClick={() => {
                        downloadFinancialManualPDF(company);
                        setTechDropdownOpen(false);
                      }}
                      className="w-full mt-1.5 text-left flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Baixar Meu Manual (PDF)</span>
                    </button>
                  )}

                  <div className="my-1.5 border-t border-slate-800" />
                  
                  {/* Option to switch to technician view */}
                  {(currentUser.role === 'admin' || (isSupervisor && supervisorPerms?.canEnterTechnicianMode !== false)) && (
                    <>
                      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                        <span>Modo Técnico (Campo)</span>
                        <span className="text-[10px] font-normal text-slate-400">Ver visão do colaborador</span>
                      </div>

                      {/* List of Technicians */}
                      <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                        {technicians.map((tech) => {
                          const isSelected = currentUser.role === 'technician' && currentUser.technicianId === tech.id;
                          const activeCount = workOrders.filter(
                            o => o.assignedTechnicianIds.includes(tech.id) && o.status !== 'concluida' && o.status !== 'cancelada'
                          ).length;

                          return (
                            <button
                              key={tech.id}
                              type="button"
                              onClick={() => {
                                onUserChange({ 
                                  role: 'technician', 
                                  technicianId: tech.id,
                                  supervisorId: currentUser.supervisorId,
                                  supervisorName: currentUser.supervisorName,
                                  supervisorPermissions: currentUser.supervisorPermissions
                                });
                                setTechDropdownOpen(false);
                                onTabChange('my_os');
                              }}
                              className={`w-full text-left flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-950/60 text-amber-200 border border-amber-800/60 font-semibold'
                                  : 'hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tech.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                                  {tech.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-white font-medium truncate max-w-[130px]">{tech.name}</div>
                                  <div className="text-[10px] text-slate-400">{tech.specialty}</div>
                                </div>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeCount > 0 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500'}`}>
                                {activeCount} O.S
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Master SaaS Option in Dropdown (ONLY if already authenticated as Master) */}
                  {isMasterLogged && (
                    <>
                      <div className="my-1.5 border-t border-slate-800" />
                      <button
                        type="button"
                        onClick={() => {
                          setTechDropdownOpen(false);
                          onTabChange('master_saas');
                        }}
                        className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                          activeTab === 'master_saas'
                            ? 'bg-amber-950/70 text-amber-200 border border-amber-500/50'
                            : 'hover:bg-amber-950/40 border border-amber-500/20 text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-amber-900/40 text-amber-400 mt-0.5">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                            Painel do Dono (Master)
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Gerenciar empresas clientes e cobranças.
                          </p>
                        </div>
                      </button>
                    </>
                  )}

                  {/* Sair / Logout Option */}
                  {onLogout && (
                    <>
                      <div className="my-1.5 border-t border-slate-800" />
                      <button
                        type="button"
                        onClick={() => {
                          setTechDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer font-bold text-xs"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Sair da Empresa (Encerrar Sessão)</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar for Admin & Supervisor */}
        {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
          <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
            {currentNavTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              const isSpecial = (t as any).isSpecial;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTabChange(t.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? isSpecial
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-900/40'
                        : isSupervisor
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                        : 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                      : isSpecial
                      ? 'text-amber-300 bg-amber-950/30 border border-amber-500/30 hover:bg-amber-900/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  {t.badge !== undefined && t.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white text-slate-900' : 'bg-slate-800 text-cyan-400'
                    }`}>
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Role Notice Banner when in Technician mode */}
      {currentUser.role === 'technician' && currentTechnician && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/70 to-slate-900 border-t border-amber-800/50 px-4 py-2 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                <strong>Modo Técnico Restrito:</strong> Você está conectado como <strong>{currentTechnician.name}</strong>. Apenas as O.S atribuídas a você são exibidas.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (currentUser.supervisorId || currentUser.supervisorPermissions) {
                  onUserChange({ 
                    role: 'supervisor',
                    supervisorId: currentUser.supervisorId,
                    supervisorName: currentUser.supervisorName,
                    supervisorPermissions: currentUser.supervisorPermissions
                  });
                  onTabChange('dashboard');
                } else {
                  onUserChange({ role: 'admin' });
                  onTabChange('dashboard');
                }
              }}
              className="px-2.5 py-1 bg-amber-900 hover:bg-amber-800 text-amber-200 border border-amber-700/60 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
            >
              {currentUser.supervisorId || currentUser.supervisorPermissions ? 'Voltar para Modo Supervisor' : 'Voltar para Modo Admin'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
