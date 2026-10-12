import React from 'react';
import { PlanTier, CompanySettings } from '../types';
import { PLAN_CONFIGS } from '../data/initialData';
import { X, Crown, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../utils/storage';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  company: CompanySettings;
  onUpgrade: (newTier: PlanTier) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  company,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const currentPlan = PLAN_CONFIGS[company.plan || 'master'];
  const higherTiers: PlanTier[] = company.plan === 'master' ? ['pro', 'full'] : ['full'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Alert */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
              Limite de Capacidade do {currentPlan.name}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Selecione o plano ideal para liberar mais capacidade:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {higherTiers.map((tierKey) => {
              const plan = PLAN_CONFIGS[tierKey];
              return (
                <div
                  key={tierKey}
                  className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-white text-sm">{plan.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r ${plan.badgeColor} text-white`}>
                        {tierKey.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-lg font-black text-white font-mono mb-1">
                      {formatCurrency(plan.priceMonthly)}
                      <span className="text-xs text-slate-400 font-normal"> /mês</span>
                    </div>
                    <div className="text-[10px] text-cyan-400 font-semibold mb-2">
                      Taxa de Adesão / Implantação: {formatCurrency(plan.setupFee)}
                    </div>

                    <ul className="text-[11px] text-slate-300 space-y-1.5">
                      <li className="flex items-center gap-1.5 font-bold text-amber-300">
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                        <span>{plan.maxTechnicians ? `Até ${plan.maxTechnicians} técnicos` : 'Técnicos ILIMITADOS'}</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-cyan-300">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{plan.maxClients ? `Até ${plan.maxClients} clientes` : 'Clientes ILIMITADOS'}</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-slate-400">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Controle exclusivo de ADM para excluir O.S e itens</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-slate-400">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>White-label e suporte prioritário</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpgrade(tierKey);
                      onClose();
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Fazer Upgrade para {plan.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-500">
          <span>Sem fidelidade. Altere ou cancele a qualquer momento.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-semibold"
          >
            Continuar no plano atual
          </button>
        </div>
      </div>
    </div>
  );
};
