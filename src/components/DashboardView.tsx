import React from 'react';
import { 
  WorkOrder, 
  Budget, 
  Client, 
  Technician,
  CompanySettings 
} from '../types';
import { PLAN_CONFIGS } from '../data/initialData';
import { 
  Wrench, 
  FileText, 
  Users, 
  HardHat, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Calendar, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Crown,
  Building2,
  Sparkles,
  Radio,
  Navigation
} from 'lucide-react';
import { formatCurrency, formatDateBR, getPriorityLabel } from '../utils/storage';

interface DashboardViewProps {
  workOrders: WorkOrder[];
  budgets: Budget[];
  clients: Client[];
  technicians: Technician[];
  onNavigate: (tab: string) => void;
  onOpenNewOS: () => void;
  onOpenNewBudget: () => void;
  onSelectOS: (os: WorkOrder) => void;
  onSwitchToTech: (techId: string) => void;
  company?: CompanySettings;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workOrders,
  budgets,
  clients,
  technicians,
  onNavigate,
  onOpenNewOS,
  onOpenNewBudget,
  onSelectOS,
  onSwitchToTech,
  company,
}) => {
  const openOrders = workOrders.filter(o => o.status !== 'concluida' && o.status !== 'cancelada');
  const completedOrders = workOrders.filter(o => o.status === 'concluida');
  const totalRevenue = workOrders
    .filter(o => o.status === 'concluida')
    .reduce((sum, o) => sum + o.totalValue, 0);

  const pendingBudgets = budgets.filter(b => b.status === 'pendente');
  const pipelineValue = pendingBudgets.reduce((sum, b) => sum + b.totalValue, 0);

  // Urgent and high priority orders first
  const activeOrders = [...openOrders].sort((a, b) => {
    const pRank = { urgente: 4, alta: 3, media: 2, baixa: 1 };
    return pRank[b.priority] - pRank[a.priority];
  });

  const planConfig = company ? PLAN_CONFIGS[company.plan || 'master'] : PLAN_CONFIGS.master;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {company?.logoUrl ? (
            <div className="h-12 w-12 rounded-xl bg-slate-950 p-1 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow">
              <img src={company.logoUrl} alt={company.tradeName} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {company?.tradeName || 'Painel de Controle'}
              </h1>
              <button
                type="button"
                onClick={() => onNavigate('company_settings')}
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-colors ${
                  company?.plan === 'full'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : company?.plan === 'pro'
                    ? 'bg-purple-950 text-purple-400 border-purple-800'
                    : 'bg-cyan-950 text-cyan-400 border-cyan-800'
                }`}
              >
                <Crown className="w-3 h-3" />
                {planConfig.name}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão operacional em tempo real de CFTV, alarmes, controle de acesso e equipes em campo.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenNewOS}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Abertura de O.S
          </button>
          <button
            type="button"
            onClick={onOpenNewBudget}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            Novo Orçamento
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open OS */}
        <div 
          onClick={() => onNavigate('work_orders')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 shadow-lg cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">O.S em Andamento</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{openOrders.length}</span>
            <span className="text-xs text-amber-400 font-semibold">atendimentos abertos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Ver todas as ordens</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Completed OS */}
        <div 
          onClick={() => onNavigate('work_orders')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 shadow-lg cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">O.S Concluídas</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{completedOrders.length}</span>
            <span className="text-xs text-emerald-400 font-semibold">com assinatura digital</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Histórico finalizado</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturado em O.S</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Serviços executados e comprovados
          </p>
        </div>

        {/* Budgets in Pipeline */}
        <div 
          onClick={() => onNavigate('budgets')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 shadow-lg cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orçamentos Pendentes</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{pendingBudgets.length}</span>
            <span className="text-xs text-cyan-400 font-mono font-semibold">({formatCurrency(pipelineValue)})</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Ver propostas comerciais</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>
      </div>

      {/* Main Grid: Active Field Operations & Quick Tech Switch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Work Orders (2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              Operações em Campo (Atendimentos Ativos)
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('work_orders')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Ver todas ({workOrders.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {activeOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                Nenhuma O.S em aberto no momento.
              </div>
            ) : (
              activeOrders.slice(0, 4).map((os) => {
                const assigned = technicians.filter(t => os.assignedTechnicianIds.includes(t.id));

                return (
                  <div
                    key={os.id}
                    onClick={() => onSelectOS(os)}
                    className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">{os.osNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          os.priority === 'urgente' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          os.priority === 'alta' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          os.priority === 'media' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {getPriorityLabel(os.priority)}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {os.type.replace('_', ' ')}
                        </span>
                      </div>

                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {formatDateBR(os.scheduledDate)} {os.scheduledTime}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {os.clientName}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 my-1 truncate">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{os.clientAddress}</span>
                    </p>

                    <p className="text-xs text-slate-300 line-clamp-1 bg-slate-950/40 p-1.5 rounded border border-slate-800/60 my-2">
                      {os.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5">
                        <HardHat className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-slate-400">
                          {assigned.map(t => t.name.split(' ')[0]).join(', ') || 'Nenhum técnico'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {formatCurrency(os.totalValue)}
                        </span>
                        <span className="text-[11px] text-cyan-400 group-hover:translate-x-1 transition-transform">
                          Ver →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Technicians Status & Quick Testing */}
        <div className="space-y-4">
          {/* GPS Live Monitoring Card for Owner */}
          <div className="bg-gradient-to-br from-blue-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Rastreamento GPS da Frota
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('team')}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                Abrir Mapa →
              </button>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Técnicos com GPS Conectado</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {technicians.filter(t => t.lastLocation?.latitude).length} de {technicians.length} ativos
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('team')}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                <Navigation className="w-3 h-3" />
                Localizar Equipe
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              Técnicos & Acesso Rápido
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('team')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Equipe →
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              O sistema possui <strong>Modo Técnico restrito</strong>. Ao entrar como técnico, o profissional vê <strong>somente as O.S onde foi marcado</strong>, anexa fotos e coleta a assinatura do cliente na tela.
            </p>

            <div className="space-y-2">
              {technicians.map((t) => {
                const assignedCount = workOrders.filter(
                  o => o.assignedTechnicianIds.includes(t.id) && o.status !== 'concluida' && o.status !== 'cancelada'
                ).length;

                return (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{assignedCount} O.S ativas</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSwitchToTech(t.id)}
                      className="text-[11px] px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-800/70 text-amber-300 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Entrar no Modo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick System Summary Box */}
          <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/40 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              Recursos de Segurança Eletrônica
            </div>
            <ul className="text-slate-300 space-y-1.5 text-[11px]">
              <li>✓ <strong>Assinatura na Tela:</strong> O cliente assina com o dedo diretamente no celular.</li>
              <li>✓ <strong>Fotos Técnicas:</strong> Antes, Durante, Depois e Equipamento instalado.</li>
              <li>✓ <strong>Orçamentos com WhatsApp:</strong> Envie propostas prontas em 1 clique.</li>
              <li>✓ <strong>Conversão 1-Clique:</strong> Transforme orçamento aprovado em O.S imediata.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
