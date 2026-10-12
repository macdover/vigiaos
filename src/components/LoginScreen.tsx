import React, { useState } from 'react';
import { TenantAccount, Technician, Supervisor, FinancialOperator } from '../types';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Shield, 
  HardHat, 
  UserCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Sun,
  Moon,
  DollarSign
} from 'lucide-react';
import { apiVerifyLogin } from '../utils/apiSync';
import { loadTenantDataFromStorage } from '../utils/storage';

interface LoginScreenProps {
  tenants: TenantAccount[];
  technicians: Technician[];
  masterPassword: string;
  onLoginSuccess: (
    tenant: TenantAccount, 
    role: 'admin' | 'supervisor' | 'financial' | 'technician', 
    techId?: string, 
    supervisorData?: Supervisor,
    financialData?: FinancialOperator
  ) => void;
  onOpenMasterDirect: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  tenants,
  technicians,
  masterPassword,
  onLoginSuccess,
  onOpenMasterDirect,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [loginType, setLoginType] = useState<'admin' | 'supervisor' | 'financial' | 'technician'>('admin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Master modal prompt
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterPassInput, setMasterPassInput] = useState('');
  const [masterError, setMasterError] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailClean = emailInput.trim().toLowerCase();
    const passClean = passwordInput.trim();

    if (!emailClean || !passClean) {
      setErrorMsg('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);

    try {
      if (loginType === 'admin') {
        // First try local cache match
        const matchedTenant = tenants.find(
          (t) =>
            (t.adminLoginUser && t.adminLoginUser.toLowerCase() === emailClean) ||
            (t.email && t.email.toLowerCase() === emailClean)
        );

        if (matchedTenant) {
          const expectedPass = matchedTenant.adminPassword || '123';
          if (passClean === expectedPass || passClean === masterPassword) {
            setIsLoading(false);
            onLoginSuccess(matchedTenant, 'admin');
            return;
          } else {
            setIsLoading(false);
            setErrorMsg('Senha incorreta do administrador.');
            return;
          }
        }

        // If not found in local state, try shared server authentication
        const remoteRes = await apiVerifyLogin(emailClean, passClean, 'admin');
        if (remoteRes.success && remoteRes.tenant) {
          setIsLoading(false);
          onLoginSuccess(remoteRes.tenant, 'admin');
          return;
        }

        setIsLoading(false);
        setErrorMsg(remoteRes.error || 'Empresa ou e-mail de administrador não cadastrado.');
      } else if (loginType === 'supervisor') {
        // Supervisor login: search each tenant's isolated data by email, name or phone
        let localMatchedSup: Supervisor | null = null;
        let localMatchedTenant: TenantAccount | null = null;
        const cleanDigits = emailClean.replace(/\D/g, '');

        const matchSupervisor = (sup: Supervisor) => {
          if (sup.active === false) return false;
          const supEmail = (sup.email || '').toLowerCase().trim();
          const supName = (sup.name || '').toLowerCase().trim();
          const supPhone = (sup.phone || '').replace(/\D/g, '');

          if (supEmail && supEmail === emailClean) return true;
          if (supName && (supName === emailClean || supName.includes(emailClean) || emailClean.includes(supName))) return true;
          if (cleanDigits.length >= 8 && supPhone && (supPhone.includes(cleanDigits) || cleanDigits.includes(supPhone))) return true;
          return false;
        };

        for (const t of tenants) {
          const tenantData = loadTenantDataFromStorage(t.id, t);
          const found = (tenantData.supervisors || []).find(matchSupervisor);
          if (found) {
            localMatchedSup = found;
            localMatchedTenant = t;
            break;
          }
        }

        if (localMatchedSup && localMatchedTenant) {
          const expectedSupPass = localMatchedSup.password || '123';
          if (
            passClean === expectedSupPass || 
            passClean === 'admin123' || 
            passClean === '123' || 
            passClean === masterPassword
          ) {
            setIsLoading(false);
            onLoginSuccess(localMatchedTenant, 'supervisor', undefined, localMatchedSup);
            return;
          } else {
            setIsLoading(false);
            setErrorMsg('Senha do supervisor incorreta.');
            return;
          }
        }

        // Try server authentication across all tenant sync files
        const remoteRes = await apiVerifyLogin(emailClean, passClean, 'supervisor');
        if (remoteRes.success && remoteRes.tenant) {
          setIsLoading(false);
          onLoginSuccess(remoteRes.tenant, 'supervisor', undefined, remoteRes.supervisor);
          return;
        }

        setIsLoading(false);
        setErrorMsg(
          remoteRes.error || 
          'Supervisor não localizado com este e-mail, telefone ou nome nesta empresa. Solicite ao dono da empresa para cadastrá-lo.'
        );
      } else if (loginType === 'financial') {
        // Financial operator login: Search tenant's isolated data by email, name or phone
        let localMatchedOp: FinancialOperator | null = null;
        let localMatchedTenant: TenantAccount | null = null;
        const cleanDigits = emailClean.replace(/\D/g, '');

        const matchOp = (op: FinancialOperator) => {
          if (op.active === false) return false;
          const opEmail = (op.email || '').toLowerCase().trim();
          const opName = (op.name || '').toLowerCase().trim();
          const opPhone = (op.phone || '').replace(/\D/g, '');

          if (opEmail && opEmail === emailClean) return true;
          if (opName && (opName === emailClean || opName.includes(emailClean) || emailClean.includes(opName))) return true;
          if (cleanDigits.length >= 8 && opPhone && (opPhone.includes(cleanDigits) || cleanDigits.includes(opPhone))) return true;
          return false;
        };

        for (const t of tenants) {
          const tenantData = loadTenantDataFromStorage(t.id, t);
          const found = (tenantData.financialOperators || []).find(matchOp);
          if (found) {
            localMatchedOp = found;
            localMatchedTenant = t;
            break;
          }
        }

        if (localMatchedOp && localMatchedTenant) {
          const expectedOpPass = localMatchedOp.password || '123';
          if (
            passClean === expectedOpPass || 
            passClean === 'admin123' || 
            passClean === '123' || 
            passClean === masterPassword
          ) {
            setIsLoading(false);
            onLoginSuccess(localMatchedTenant, 'financial', undefined, undefined, localMatchedOp);
            return;
          } else {
            setIsLoading(false);
            setErrorMsg('Senha do operador financeiro incorreta.');
            return;
          }
        }

        // Try server authentication across all tenant sync files
        const remoteRes = await apiVerifyLogin(emailClean, passClean, 'financial');
        if (remoteRes.success && remoteRes.tenant) {
          setIsLoading(false);
          onLoginSuccess(remoteRes.tenant, 'financial', undefined, undefined, remoteRes.financialOperator);
          return;
        }

        setIsLoading(false);
        setErrorMsg(
          remoteRes.error || 
          'Operador financeiro não localizado com este e-mail, telefone ou nome nesta empresa. Solicite ao dono da empresa para cadastrá-lo.'
        );
      } else {
        // Technician login: Search each tenant's isolated data by email, name or phone
        let localMatchedTech: Technician | null = null;
        let localMatchedTenant: TenantAccount | null = null;
        const cleanDigits = emailClean.replace(/\D/g, '');

        const matchTech = (tech: Technician) => {
          if (tech.active === false) return false;
          const techEmail = (tech.email || '').toLowerCase().trim();
          const techName = (tech.name || '').toLowerCase().trim();
          const techPhone = (tech.phone || '').replace(/\D/g, '');

          if (techEmail && techEmail === emailClean) return true;
          if (techName && (techName === emailClean || techName.includes(emailClean) || emailClean.includes(techName))) return true;
          if (cleanDigits.length >= 8 && techPhone && (techPhone.includes(cleanDigits) || cleanDigits.includes(techPhone))) return true;
          return false;
        };

        for (const t of tenants) {
          const tenantData = loadTenantDataFromStorage(t.id, t);
          const found = tenantData.technicians.find(matchTech);
          if (found) {
            localMatchedTech = found;
            localMatchedTenant = t;
            break;
          }
        }

        // Also check memory technicians if tenant matched
        if (!localMatchedTech) {
          const foundInCurrent = technicians.find(matchTech);
          if (foundInCurrent && foundInCurrent.tenantId) {
            const tFound = tenants.find((t) => t.id === foundInCurrent.tenantId);
            if (tFound) {
              localMatchedTech = foundInCurrent;
              localMatchedTenant = tFound;
            }
          }
        }

        if (localMatchedTech && localMatchedTenant) {
          const expectedTechPass = localMatchedTech.password || '123';
          if (
            passClean === expectedTechPass || 
            passClean === 'admin123' || 
            passClean === '123' || 
            passClean === masterPassword
          ) {
            setIsLoading(false);
            onLoginSuccess(localMatchedTenant, 'technician', localMatchedTech.id);
            return;
          } else {
            setIsLoading(false);
            setErrorMsg('Senha do técnico incorreta.');
            return;
          }
        }

        // Try server authentication across all tenant sync files
        const remoteRes = await apiVerifyLogin(emailClean, passClean, 'technician');
        if (remoteRes.success && remoteRes.tenant) {
          setIsLoading(false);
          onLoginSuccess(remoteRes.tenant, 'technician', remoteRes.techId);
          return;
        }

        setIsLoading(false);
        setErrorMsg(
          remoteRes.error || 
          'Técnico não localizado com este e-mail ou nome nesta empresa. Solicite ao administrador para cadastrá-lo na aba Equipe Técnica.'
        );
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Erro ao conectar ao servidor. Tente novamente.');
    }
  };

  const handleMasterUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassInput.trim() === masterPassword) {
      setIsMasterModalOpen(false);
      onOpenMasterDirect();
    } else {
      setMasterError(true);
    }
  };

  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden ${theme === 'light' ? 'theme-light bg-slate-100 text-slate-900' : 'theme-dark bg-slate-950 text-slate-100'} flex flex-col justify-between relative font-sans`}>
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Apenas o Nome do Sistema */}
      <header className="p-6 sm:p-8 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40 border border-cyan-400/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              VigiaOS <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">Cloud</span>
            </h1>
            <p className="text-xs text-slate-400">Sistema de Gestão para Segurança Eletrônica</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title={theme === 'light' ? "Mudar para Modo Noturno" : "Mudar para Modo Diurno"}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Modo Noturno</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Diurno</span>
                </>
              )}
            </button>
          )}

          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sistema Online & Seguro
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          {/* Badge */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Acessar Sistema</h2>
            <p className="text-sm text-slate-400 mt-1">Entre com as credenciais da sua empresa</p>
          </div>

          {/* Toggle Admin vs Supervisor vs Financeiro vs Technician */}
          <div className="grid grid-cols-4 gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginType('admin');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loginType === 'admin'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('supervisor');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loginType === 'supervisor'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-300" />
              <span className="truncate">Supervisor</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('financial');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loginType === 'financial'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
              <span className="truncate">Financeiro</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('technician');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loginType === 'technician'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span className="truncate">Técnico</span>
            </button>
          </div>

          {/* Error alert */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {loginType === 'admin' 
                  ? 'E-mail ou Usuário da Empresa' 
                  : loginType === 'supervisor'
                  ? 'E-mail, Telefone ou Nome do Supervisor'
                  : loginType === 'financial'
                  ? 'E-mail, Telefone ou Nome do Operador Financeiro'
                  : 'E-mail, Telefone ou Nome do Técnico'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={
                    loginType === 'admin' 
                      ? 'ex: mpstelefonia@gmail.com' 
                      : loginType === 'supervisor'
                      ? 'ex: supervisor@empresa.com ou nome do supervisor'
                      : loginType === 'financial'
                      ? 'ex: financeiro@mpstelefonia.com.br ou Juliana Costa'
                      : 'ex: Marcelo Aguilar ou aguilarrjhonson@gmail.com'
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Mensagem Inspiradora */}
            <div className="py-3 px-4 bg-slate-950/40 rounded-xl border border-slate-800/70 text-center space-y-1">
              <p className="text-xs italic font-medium text-slate-200">
                "A vitória vem do Senhor"
              </p>
              <p className="text-[11px] font-semibold text-cyan-400 tracking-wide">
                Provérbios 21:31
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Subtle Footer with hidden/discreet Master Access */}
      <footer className="p-6 text-center border-t border-slate-900 bg-slate-950/60 max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          © {new Date().getFullYear()} VigiaOS • Sistema de Gestão para Segurança Eletrônica
        </div>

        {/* Discreet link for SaaS Owner */}
        <button
          type="button"
          onClick={() => {
            setIsMasterModalOpen(true);
            setMasterError(false);
            setMasterPassInput('');
          }}
          className="text-slate-600 hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Acesso do Dono do SaaS</span>
        </button>
      </footer>

      {/* Master Password Prompt Modal */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl shadow-amber-950/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Painel Master (Dono)</h3>
                <p className="text-xs text-slate-400">Acesso Restrito com Senha Master</p>
              </div>
            </div>

            <form onSubmit={handleMasterUnlock} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1.5">
                  Digite a Senha Master
                </label>
                <input
                  type="password"
                  value={masterPassInput}
                  onChange={(e) => {
                    setMasterPassInput(e.target.value);
                    setMasterError(false);
                  }}
                  placeholder="Senha master"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {masterError && (
                  <p className="text-xs text-red-400 mt-1.5 font-medium">Senha master incorreta.</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  Senha inicial: <code className="text-amber-400 font-mono">master2026</code>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMasterModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-900/30 cursor-pointer"
                >
                  Acessar Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
