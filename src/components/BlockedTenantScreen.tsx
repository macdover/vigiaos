import React, { useState } from 'react';
import { CompanySettings, TenantAccount } from '../types';
import { 
  ShieldAlert, 
  Lock, 
  MessageSquare, 
  CreditCard, 
  KeyRound, 
  Building2, 
  ArrowRight, 
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { generateWhatsAppLink } from '../utils/storage';

interface BlockedTenantScreenProps {
  company: CompanySettings;
  masterPhone?: string;
  onOpenMasterLogin: () => void;
  onSelectAnotherCompany?: (tenantId: string) => void;
  availableTenants?: TenantAccount[];
  onLogout?: () => void;
  isMasterLogged?: boolean;
}

export const BlockedTenantScreen: React.FC<BlockedTenantScreenProps> = ({
  company,
  masterPhone = '19998765432',
  onOpenMasterLogin,
  onSelectAnotherCompany,
  availableTenants = [],
  onLogout,
  isMasterLogged = false,
}) => {
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);

  const messageText = `*Solicitação de Regularização - Sistema SegurOS*\n\n` +
    `*Empresa:* ${company.name || company.tradeName}\n` +
    `*CNPJ:* ${company.cnpj || 'Não informado'}\n` +
    `*Plano:* ${company.plan ? company.plan.toUpperCase() : 'MASTER'}\n\n` +
    `Olá! Sou responsável pela empresa e gostaria de efetuar o pagamento da mensalidade pendente para restabelecer o acesso ao sistema. Poderia me enviar a chave PIX?`;

  const whatsappUrl = generateWhatsAppLink(masterPhone, messageText);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-red-500 selection:text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Notice */}
      <div className="w-full max-w-xl mb-4 flex items-center justify-between px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-300">{company.tradeName || company.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {isMasterLogged && (
            <button
              type="button"
              onClick={onOpenMasterLogin}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-950/40 hover:bg-amber-950/80 border border-amber-800/60 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Painel Master
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Sair da Conta
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 relative">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-xl shadow-red-950/60 ring-4 ring-red-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 inline-flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" /> Acesso Suspenso por Inadimplência
            </span>
            <h1 className="text-2xl font-black text-white mt-3">
              Sistema Temporariamente Bloqueado
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
              O acesso aos módulos de Ordens de Serviço, estoque e aplicativo dos técnicos está suspenso devido a pendência financeira na mensalidade do seu plano.
            </p>
          </div>

          {/* Details Box */}
          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Licença / Empresa:</span>
              <span className="font-bold text-white">{company.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Plano Contratado:</span>
              <span className="font-bold uppercase text-cyan-400">Plano {company.plan || 'MASTER'}</span>
            </div>
            <div className="flex justify-between items-start pt-0.5">
              <span className="text-slate-400">Motivo informado:</span>
              <span className="font-medium text-amber-300 text-right max-w-[280px]">
                {company.blockedReason || 'Mensalidade pendente de quitação. Efetue o pagamento para liberação imediata.'}
              </span>
            </div>
          </div>

          {/* Call to action */}
          <div className="w-full pt-2 space-y-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Regularizar Mensalidade via WhatsApp
            </a>

            <p className="text-[11px] text-slate-400">
              Assim que o comprovante Pix for enviado ao suporte, seu acesso e o de todos os seus técnicos é desbloqueado no mesmo instante.
            </p>
          </div>

          {/* Switcher for testing/demo */}
          {availableTenants.length > 0 && onSelectAnotherCompany && (
            <div className="w-full pt-4 border-t border-slate-800/80 text-left">
              <button
                type="button"
                onClick={() => setShowCompanySwitcher(!showCompanySwitcher)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <span>Alternar Empresa Licenciada (Demonstração):</span>
                <span className="text-cyan-400 font-semibold">{showCompanySwitcher ? 'Fechar' : 'Ver Empresas'}</span>
              </button>

              {showCompanySwitcher && (
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {availableTenants.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectAnotherCompany(t.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between border transition-all cursor-pointer ${
                        t.id === company.id
                          ? 'bg-red-950/40 border-red-800/60 text-red-300'
                          : t.status === 'ativo'
                          ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold block text-white truncate">{t.tradeName}</span>
                        <span className="text-[10px] text-slate-400 uppercase">Plano {t.plan}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.status === 'ativo' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
