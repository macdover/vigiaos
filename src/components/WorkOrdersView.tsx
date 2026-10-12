import React, { useState } from 'react';
import { 
  WorkOrder, 
  Technician, 
  OSStatus, 
  OSPriority,
  CurrentUser,
  CompanySettings 
} from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Wrench, 
  Calendar, 
  MapPin, 
  User, 
  HardHat, 
  Camera, 
  PenTool, 
  Printer, 
  Share2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Send,
  LayoutGrid,
  Table,
  Phone,
  FileDown,
  FileText,
  X,
  QrCode,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDateBR, generateWhatsAppLink } from '../utils/storage';
import { DispatchOSModal } from './DispatchOSModal';
import { downloadWorkOrdersHistoryPDF } from '../utils/pdfGenerator';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  technicians: Technician[];
  currentUser?: CurrentUser;
  company?: CompanySettings;
  onOpenNewOS: () => void;
  onSelectOS: (os: WorkOrder) => void;
  onEditOS: (os: WorkOrder) => void;
  onPrintOS: (os: WorkOrder) => void;
  onDeleteOS?: (osId: string) => void;
  onOpenBillingModal?: (os: WorkOrder) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  technicians,
  currentUser,
  company,
  onOpenNewOS,
  onSelectOS,
  onEditOS,
  onPrintOS,
  onDeleteOS,
  onOpenBillingModal,
}) => {
  const isAdmin = currentUser ? currentUser.role === 'admin' : true;
  const isSupervisor = currentUser?.role === 'supervisor';
  const supervisorPerms = currentUser?.supervisorPermissions;
  const canCreateOS = isSupervisor ? supervisorPerms?.canCreateOS !== false : true;
  const canExportReports = isSupervisor ? supervisorPerms?.canExportReports !== false : true;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [osToDelete, setOsToDelete] = useState<WorkOrder | null>(null);
  const [showAdminBlockedAlert, setShowAdminBlockedAlert] = useState(false);
  const [dispatchingOS, setDispatchingOS] = useState<WorkOrder | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportMode, setExportMode] = useState<'filtered' | 'all'>('filtered');
  const [exportDateRange, setExportDateRange] = useState<'all' | '7days' | '30days' | 'this_month'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const requestDeleteOS = (os: WorkOrder) => {
    if (!isAdmin) {
      setShowAdminBlockedAlert(true);
      return;
    }
    setOsToDelete(os);
  };

  const confirmDeleteOS = () => {
    if (!osToDelete) return;
    if (!isAdmin) {
      setShowAdminBlockedAlert(true);
      setOsToDelete(null);
      return;
    }
    if (onDeleteOS) {
      onDeleteOS(osToDelete.id);
    }
    setOsToDelete(null);
  };

  const filteredOrders = workOrders.filter((os) => {
    const matchesSearch = 
      os.osNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.clientAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || os.status === statusFilter;
    const matchesTech = techFilter === 'all' || os.assignedTechnicianIds.includes(techFilter);
    const matchesPriority = priorityFilter === 'all' || os.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesTech && matchesPriority;
  });

  const handleExportHistoryPDF = (useCurrentFilters = true) => {
    let listToExport = useCurrentFilters ? filteredOrders : workOrders;

    if (exportDateRange !== 'all') {
      const now = new Date();
      listToExport = listToExport.filter(os => {
        if (!os.scheduledDate && !os.createdAt) return true;
        const osDate = new Date(os.scheduledDate || os.createdAt);
        if (isNaN(osDate.getTime())) return true;
        
        if (exportDateRange === '7days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return osDate >= sevenDaysAgo;
        } else if (exportDateRange === '30days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return osDate >= thirtyDaysAgo;
        } else if (exportDateRange === 'this_month') {
          return osDate.getMonth() === now.getMonth() && osDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    if (listToExport.length === 0) {
      setToastMessage('Nenhuma Ordem de Serviço encontrada para os filtros selecionados.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const currentCompany: CompanySettings = company || {
      name: 'MPS Telefonia & Segurança',
      tradeName: 'MPS Telefonia & Segurança',
      cnpj: '',
      phone: '',
      email: '',
      address: '',
      plan: 'master',
      status: 'ativo',
    };

    const fileName = downloadWorkOrdersHistoryPDF(
      listToExport,
      technicians,
      currentCompany,
      {
        statusFilter: useCurrentFilters ? statusFilter : undefined,
        techIdFilter: useCurrentFilters ? techFilter : undefined,
        searchTerm: useCurrentFilters ? searchTerm : undefined,
      }
    );

    setIsExportModalOpen(false);
    setToastMessage(`Relatório do Histórico de O.S. exportado com sucesso: ${fileName}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getStatusBadge = (status: OSStatus) => {
    switch (status) {
      case 'aberta':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Aberta</span>;
      case 'em_deslocamento':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">Em Deslocamento</span>;
      case 'em_andamento':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Em Execução</span>;
      case 'aguardando_peca':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Aguardando Peça</span>;
      case 'concluida':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Concluída</span>;
      case 'cancelada':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Cancelada</span>;
    }
  };

  const getPriorityBadge = (priority: OSPriority) => {
    switch (priority) {
      case 'urgente':
        return <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-red-500/20 text-red-400 border border-red-500/30">Urgente</span>;
      case 'alta':
        return <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">Alta</span>;
      case 'media':
        return <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Média</span>;
      case 'baixa':
        return <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-slate-700 text-slate-400">Baixa</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-600/80 rounded-xl text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-emerald-900/50"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Ordens de Serviço (O.S)
          </h1>
          <p className="text-xs text-slate-400">
            Gerenciamento geral de atendimentos, agendamentos e equipes em campo
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop View Switcher: Cards vs Table */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualização em Tabela para Computador / PC"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabela (PC)</span>
            </button>
          </div>

          {canExportReports && (
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
              title="Exportar Relatório / Histórico de O.S. em PDF"
            >
              <FileDown className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Exportar Histórico PDF</span>
              <span className="sm:hidden">Histórico PDF</span>
            </button>
          )}

          {canCreateOS && (
            <button
              type="button"
              onClick={onOpenNewOS}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Abertura de O.S
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search text */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por O.S, cliente, endereço ou serviço..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="aberta">Abertas</option>
              <option value="em_deslocamento">Em Deslocamento</option>
              <option value="em_andamento">Em Execução</option>
              <option value="aguardando_peca">Aguardando Peça</option>
              <option value="concluida">Concluídas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="all">Todos os Técnicos</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List Table / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400 text-xs">
          <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          Nenhuma Ordem de Serviço encontrada com os filtros atuais.
        </div>
      ) : viewMode === 'table' ? (
        /* Desktop Table View for Office PC */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3.5">O.S / Tipo</th>
                  <th className="p-3.5">Status / Prioridade</th>
                  <th className="p-3.5">Cliente & Local</th>
                  <th className="p-3.5">Data / Hora</th>
                  <th className="p-3.5">Técnico</th>
                  <th className="p-3.5 text-right">Valor Total</th>
                  <th className="p-3.5 text-center">Encaminhar & Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((os) => {
                  const assigned = technicians.filter(t => os.assignedTechnicianIds.includes(t.id));
                  return (
                    <tr key={os.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-cyan-400">{os.osNumber}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{os.type.replace('_', ' ')}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(os.status)}
                          {getPriorityBadge(os.priority)}
                        </div>
                      </td>
                      <td className="p-3.5 max-w-[220px]">
                        <div className="font-bold text-white truncate">{os.clientName}</div>
                        <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{os.clientAddress}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-mono text-slate-300">
                        <div>{formatDateBR(os.scheduledDate)}</div>
                        <div className="text-[10px] text-slate-400">{os.scheduledTime}</div>
                      </td>
                      <td className="p-3.5">
                        {assigned.length === 0 ? (
                          <span className="text-amber-400 italic text-[11px]">Sem técnico</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assigned.map(t => (
                              <span key={t.id} className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-200 border border-slate-700">
                                {t.name.split(' ')[0]}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                        {formatCurrency(os.totalValue)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDispatchingOS(os)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
                            title="Encaminhar para o Técnico via WhatsApp (Web/PC)"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Encaminhar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectOS(os)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditOS(os)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Editar O.S"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onPrintOS(os)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Imprimir / PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-300" />
                          </button>

                          <button
                            type="button"
                            onClick={() => requestDeleteOS(os)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isAdmin
                                ? 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer'
                                : 'bg-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
                            }`}
                            title={isAdmin ? "Excluir O.S" : "Apenas ADM pode excluir"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View (Mobile & Responsive) */
        <div className="space-y-3">
          {filteredOrders.map((os) => {
            const assigned = technicians.filter(t => os.assignedTechnicianIds.includes(t.id));
            const hasPhotos = os.photos.length > 0;
            const hasSignature = !!os.signature;

            return (
              <div
                key={os.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-cyan-400">{os.osNumber}</span>
                    {getStatusBadge(os.status)}
                    {getPriorityBadge(os.priority)}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {os.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      {formatDateBR(os.scheduledDate)} {os.scheduledTime}
                    </span>
                    <span className="font-mono font-bold text-white text-sm">
                      {formatCurrency(os.totalValue)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  {/* Client and location */}
                  <div className="md:col-span-1">
                    <p className="text-sm font-bold text-white mb-0.5">{os.clientName}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{os.clientAddress}</span>
                    </p>
                  </div>

                  {/* Service Scope */}
                  <div className="md:col-span-1">
                    <p className="text-xs text-slate-300 line-clamp-2 bg-slate-950/40 p-2 rounded border border-slate-800/60">
                      {os.description}
                    </p>
                  </div>

                  {/* Assigned Technicians */}
                  <div className="md:col-span-1 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <HardHat className="w-3 h-3 text-cyan-400" />
                      Técnicos Atribuídos:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {assigned.length === 0 ? (
                        <span className="text-xs text-amber-400 italic">Sem técnico atribuído</span>
                      ) : (
                        assigned.map(t => (
                          <span key={t.id} className="text-[11px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                            {t.name.split(' ')[0]}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Controls / Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                      hasPhotos ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <Camera className="w-3 h-3" />
                      {os.photos.length} Fotos
                    </span>

                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                      hasSignature ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <PenTool className="w-3 h-3" />
                      {hasSignature ? 'Assinado com dedo' : 'Sem Assinatura'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Cobrar Pix & Boleto button */}
                    {onOpenBillingModal && (
                      <button
                        type="button"
                        onClick={() => onOpenBillingModal(os)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/60 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                        title="Emitir Cobrança Pix & Boleto para este Atendimento"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cobrar Pix/Boleto</span>
                      </button>
                    )}

                    {/* Encaminhar para Técnico WhatsApp button */}
                    <button
                      type="button"
                      onClick={() => setDispatchingOS(os)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
                      title="Encaminhar O.S para Técnico via WhatsApp (Web/PC)"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Encaminhar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectOS(os)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      Detalhes
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditOS(os)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Editar O.S"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onPrintOS(os)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Imprimir / PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-300" />
                    </button>

                    <button
                      type="button"
                      onClick={() => requestDeleteOS(os)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isAdmin
                          ? 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer'
                          : 'bg-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
                      }`}
                      title={isAdmin ? "Excluir Ordem de Serviço (ADM)" : "Apenas o Administrador pode excluir O.S"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete OS Confirmation Modal (ADM Only) */}
      {osToDelete && (
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
                <h3 className="text-base font-bold text-white">Excluir Ordem de Serviço</h3>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-400 font-black text-sm">{osToDelete.osNumber}</span>
                <span className="text-white font-mono font-bold">{formatCurrency(osToDelete.totalValue)}</span>
              </div>
              <p className="text-slate-200 font-semibold">{osToDelete.clientName}</p>
              <p className="text-[11px] text-slate-400 line-clamp-1">{osToDelete.description}</p>
              {osToDelete.photos.length > 0 && (
                <p className="text-[10px] text-amber-400">Contém {osToDelete.photos.length} fotos anexadas</p>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir esta O.S? Todos os apontamentos de materiais, serviços, relatórios técnicos, fotos e assinaturas serão apagados em definitivo do sistema.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOsToDelete(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteOS}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Confirmar Exclusão Definitiva
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
                <h3 className="text-base font-bold text-white">Ação Restrita a Administradores</h3>
                <p className="text-xs text-amber-400 font-medium">Permissão Insuficiente</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Por auditoria e controle financeiro, a exclusão de Ordens de Serviço é permitida <strong>exclusivamente para o Administrador da empresa (ADM)</strong>. Técnicos não têm permissão para deletar atendimentos.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAdminBlockedAlert(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch OS to Technician Modal */}
      {dispatchingOS && (
        <DispatchOSModal
          os={dispatchingOS}
          technicians={technicians}
          company={company}
          isOpen={!!dispatchingOS}
          onClose={() => setDispatchingOS(null)}
        />
      )}

      {/* Export Work Orders History Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Exportar Histórico de O.S (PDF)</h3>
                  <p className="text-xs text-slate-400">Relatório técnico com laudos, técnicos e valores</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics of filtered / total */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">O.S. a Exportar</span>
                <span className="text-white font-bold text-sm">
                  {exportMode === 'filtered' ? filteredOrders.length : workOrders.length}
                </span>
                <span className="text-slate-500 block text-[10px]">
                  {exportMode === 'filtered' ? 'Com filtros ativos' : 'Base total'}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Concluídas</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {(exportMode === 'filtered' ? filteredOrders : workOrders).filter(o => o.status === 'concluida').length}
                </span>
                <span className="text-slate-500 block text-[10px]">Finalizadas</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[11px]">Faturamento</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {formatCurrency((exportMode === 'filtered' ? filteredOrders : workOrders).filter(o => o.status === 'concluida').reduce((acc, o) => acc + (o.totalValue || 0), 0))}
                </span>
                <span className="text-slate-500 block text-[10px]">Serviços concluídos</span>
              </div>
            </div>

            <div className="space-y-3.5 mb-6 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Alcance da Exportação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportMode('filtered')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      exportMode === 'filtered'
                        ? 'bg-cyan-950/50 border-cyan-500 text-white font-semibold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="block text-xs">Filtros da Tela ({filteredOrders.length})</span>
                    <span className="block text-[10px] text-slate-400">
                      {statusFilter !== 'all' ? `Status: ${statusFilter}` : 'Todos os status'}
                      {techFilter !== 'all' ? ` • Técnico filtrado` : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportMode('all')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      exportMode === 'all'
                        ? 'bg-cyan-950/50 border-cyan-500 text-white font-semibold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="block text-xs">Histórico Completo ({workOrders.length})</span>
                    <span className="block text-[10px] text-slate-400">Exporta todas as O.S. cadastradas</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Período de Agendamento</label>
                <select
                  value={exportDateRange}
                  onChange={(e) => setExportDateRange(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">Todo o Período Disponível</option>
                  <option value="7days">Últimos 7 dias</option>
                  <option value="30days">Últimos 30 dias</option>
                  <option value="this_month">Mês Atual</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleExportHistoryPDF(exportMode === 'filtered')}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Gerar Relatório em PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
