import React, { useState } from 'react';
import { Client, WorkOrder, Budget, CurrentUser, Technician, CompanySettings } from '../types';
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Home, 
  Factory, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  FileText, 
  Wrench, 
  X, 
  Check, 
  CheckCircle2,
  Navigation,
  Crown,
  Loader2,
  FileDown,
  History,
  Calendar,
  Clock,
  ExternalLink,
  Printer
} from 'lucide-react';
import { formatCurrency, formatDateBR, generateWhatsAppLink, getPriorityLabel } from '../utils/storage';
import { PLAN_CONFIGS } from '../data/initialData';
import { downloadClientsReportPDF, downloadClientHistoryPDF } from '../utils/pdfGenerator';

interface ClientsViewProps {
  clients: Client[];
  workOrders: WorkOrder[];
  budgets: Budget[];
  currentUser?: CurrentUser;
  technicians?: Technician[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onOpenNewOSWithClient: (clientId: string) => void;
  company?: CompanySettings;
  onTriggerUpgrade?: (title: string, message: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  workOrders,
  budgets,
  currentUser,
  technicians = [],
  onSaveClient,
  onDeleteClient,
  onOpenNewOSWithClient,
  company,
  onTriggerUpgrade,
}) => {
  const isAdmin = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'super_admin') : true;
  const isSupervisor = currentUser?.role === 'supervisor';
  const supervisorPerms = currentUser?.supervisorPermissions;
  const canCreateClient = isSupervisor ? supervisorPerms?.canCreateClient !== false : true;
  const canEditClient = isSupervisor ? supervisorPerms?.canEditClient !== false : true;
  const canCreateOS = isSupervisor ? supervisorPerms?.canCreateOS !== false : true;
  const canExportReports = isSupervisor ? supervisorPerms?.canExportReports !== false : true;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [zipCode, setZipCode] = useState('');
  const [type, setType] = useState<Client['type']>('residencial');
  const [notes, setNotes] = useState('');

  // UI feedback states
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // CEP automatic search
  const handleSearchCep = async (rawCep: string) => {
    const cleanCep = rawCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setIsSearchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setStreet(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.localidade) setCity(data.localidade);
          if (data.uf) setState(data.uf);
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar CEP:', e);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setZipCode(formatted);
    if (digits.length === 8) {
      handleSearchCep(digits);
    }
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 2 && digits.length <= 6) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length > 6 && digits.length <= 10) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 10) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    setPhone(formatted);
  };

  const handleDocumentChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    let formatted = digits;
    if (digits.length <= 11) {
      // CPF
      if (digits.length > 9) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
      else if (digits.length > 6) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      else if (digits.length > 3) formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    } else {
      // CNPJ
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    setDocument(formatted);
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.document.includes(searchTerm) ||
      c.phone.includes(searchTerm) ||
      c.address.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || c.type === selectedType;
    return matchesSearch && matchesType;
  });

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

  const handleExportClientsPDF = (mode: 'all' | 'filtered') => {
    const listToExport = mode === 'filtered' ? filteredClients : clients;
    if (listToExport.length === 0) {
      setToastMessage('Nenhum cliente para exportar.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const fileName = downloadClientsReportPDF(
      listToExport,
      workOrders,
      budgets,
      currentCompany,
      {
        typeFilter: mode === 'filtered' ? selectedType : undefined,
        searchTerm: mode === 'filtered' ? searchTerm : undefined,
      }
    );
    setIsExportModalOpen(false);
    setToastMessage(`Relatório em PDF gerado: ${fileName}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportClientHistoryPDF = (client: Client) => {
    const fileName = downloadClientHistoryPDF(
      client,
      workOrders,
      budgets,
      currentCompany,
      technicians
    );
    setToastMessage(`Histórico do cliente exportado em PDF: ${fileName}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const currentPlan = company ? PLAN_CONFIGS[company.plan || 'master'] : PLAN_CONFIGS.master;
  const isAtLimit = currentPlan.maxClients !== null && clients.length >= currentPlan.maxClients;

  const openNewModal = () => {
    if (isAtLimit && onTriggerUpgrade) {
      onTriggerUpgrade(
        `Limite de Clientes Atingido (${clients.length}/${currentPlan.maxClients})`,
        `Seu ${currentPlan.name} permite cadastrar até ${currentPlan.maxClients} clientes. Para cadastrar mais clientes, condomínios e indústrias, faça o upgrade para o Plano Pro (até 350 clientes) ou Plano Full (ilimitado).`
      );
      return;
    }

    setEditingClient(null);
    setName('');
    setTradeName('');
    setDocument('');
    setPhone('');
    setEmail('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('São Paulo');
    setState('SP');
    setZipCode('');
    setType('residencial');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setTradeName(c.tradeName || '');
    setDocument(c.document);
    setPhone(c.phone);
    setEmail(c.email);
    setStreet(c.address.street);
    setNumber(c.address.number);
    setComplement(c.address.complement || '');
    setNeighborhood(c.address.neighborhood);
    setCity(c.address.city);
    setState(c.address.state);
    setZipCode(c.address.zipCode);
    setType(c.type);
    setNotes(c.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Por favor, preencha o Nome ou Razão Social do cliente.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Por favor, preencha o Telefone / WhatsApp do cliente.');
      return;
    }
    setFormError(null);

    const newOrUpdated: Client = {
      id: editingClient?.id || `cli-${Date.now()}`,
      name: name.trim(),
      tradeName: tradeName.trim() || undefined,
      document: document.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: {
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim(),
        city: city.trim() || 'São Paulo',
        state: state.trim() || 'SP',
        zipCode: zipCode.trim(),
      },
      type,
      notes: notes.trim() || undefined,
      createdAt: editingClient?.createdAt || new Date().toISOString(),
    };

    onSaveClient(newOrUpdated);
    setIsModalOpen(false);
    setToastMessage(editingClient ? 'Cliente atualizado com sucesso!' : 'Novo cliente cadastrado com sucesso!');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const getTypeIcon = (t: Client['type']) => {
    switch (t) {
      case 'condominio':
        return <Building2 className="w-4 h-4 text-cyan-400" />;
      case 'comercial':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'industrial':
        return <Factory className="w-4 h-4 text-purple-400" />;
      case 'residencial':
        return <Home className="w-4 h-4 text-emerald-400" />;
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Cadastro de Clientes
          </h1>
          <p className="text-xs text-slate-400">
            Controle de condomínios, comércios, indústrias e residências com histórico de atendimentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canExportReports && (
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
              title="Exportar Relatório Geral de Clientes em PDF"
            >
              <FileDown className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Relatório em PDF</span>
              <span className="sm:hidden">Relatório PDF</span>
            </button>
          )}

          {canCreateClient && (
            <button
              type="button"
              onClick={openNewModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
          )}
        </div>
      </div>

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
              {clients.length} de {currentPlan.maxClients ?? 'Ilimitado'}
            </span>{' '}
            clientes cadastrados.
            {isAtLimit && <span className="text-amber-400 font-bold ml-1.5">(Limite Máximo Atingido)</span>}
          </span>
        </div>

        {currentPlan.maxClients !== null && onTriggerUpgrade && (
          <button
            type="button"
            onClick={() => onTriggerUpgrade(
              'Aumentar Capacidade de Clientes',
              'Faça o upgrade para o Plano Pro (até 350 clientes) ou Plano Full (clientes e técnicos ilimitados) para cadastrar sem restrições.'
            )}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline shrink-0 cursor-pointer text-left sm:text-right"
          >
            Fazer Upgrade de Plano →
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, razão social, CPF/CNPJ, telefone ou bairro..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="all">Todos os Tipos</option>
            <option value="condominio">Condomínio</option>
            <option value="comercial">Comercial</option>
            <option value="residencial">Residencial</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map((c) => {
          const clientOrders = workOrders.filter(o => o.clientId === c.id);
          const clientBudgets = budgets.filter(b => b.clientId === c.id);
          const fullAddress = `${c.address.street}, ${c.address.number} - ${c.address.neighborhood}, ${c.address.city} - ${c.address.state}`;

          return (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                      {getTypeIcon(c.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{c.name}</h3>
                      {c.tradeName && <p className="text-xs text-cyan-400">{c.tradeName}</p>}
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {c.type}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300 my-3">
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{c.phone}</span>
                    <a
                      href={generateWhatsAppLink(c.phone, `Olá ${c.name}, tudo bem? Aqui é da equipe técnica SegurOS.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-[10px] text-emerald-400 hover:underline font-semibold"
                    >
                      WhatsApp
                    </a>
                  </p>
                  {c.email && (
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{fullAddress}</span>
                  </p>
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800/60 mb-3">
                    {c.notes}
                  </p>
                )}
              </div>

              {/* Stats & Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="font-semibold text-cyan-400">{clientOrders.length} O.S</span>
                  <span>•</span>
                  <span>{clientBudgets.length} Orçamentos</span>
                </div>

                <div className="flex items-center gap-1">
                  {canExportReports && (
                    <button
                      type="button"
                      onClick={() => setSelectedClientForHistory(c)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      title="Ver Histórico de Atendimentos e Baixar PDF"
                    >
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">Histórico / PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </button>
                  )}
                  {canCreateOS && (
                    <button
                      type="button"
                      onClick={() => onOpenNewOSWithClient(c.id)}
                      className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 rounded-lg text-xs font-medium transition-colors"
                    >
                      + Abrir O.S
                    </button>
                  )}
                  {canEditClient && (
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      title="Editar Cliente"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setClientToDelete(c)}
                      className="p-1.5 bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700/50 hover:border-red-800/60 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Cliente (Apenas Administrador)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
              {formError && (
                <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-200 text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome / Razão Social *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Condomínio Residencial Parque dos Pássaros"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome Fantasia (Opcional)</label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ex: Parque dos Pássaros"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Imóvel</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Client['type'])}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="residencial">Residencial</option>
                    <option value="condominio">Condomínio</option>
                    <option value="comercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Telefone / Celular (WhatsApp) *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: contato@cliente.com.br"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Endereço do Local de Instalação
                  </h4>
                  {isSearchingCep && (
                    <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Buscando CEP...
                    </span>
                  )}
                </div>

                {/* CEP input with auto search */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">CEP (Auto-preenchimento)</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <span className="text-[11px] text-slate-500 pb-1">
                      Digite o CEP para preencher rua, bairro e cidade automaticamente.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-0.5">Rua / Avenida</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Rua / Avenida"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Número</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="Nº / S/N"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Complemento</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Bloco / Apto"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Bairro</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Cidade</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Cidade"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">UF</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="SP"
                      maxLength={2}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500 uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notas Técnicas sobre o Imóvel (Câmeras existentes, senhas de alarme, síndico, etc.)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Central de alarme fica na sala de máquinas 2º subsolo. Falar com portaria pelo ramal 100."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div>
                  {editingClient && isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = editingClient;
                        setIsModalOpen(false);
                        setClientToDelete(target);
                      }}
                      className="px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/50 border border-red-900/50 hover:border-red-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Cliente</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Cliente
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Export General Clients Report to PDF */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Exportar Relatório de Clientes</h3>
                  <p className="text-xs text-slate-400">Geração de documento PDF profissional</p>
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

            <p className="text-xs text-slate-300 mb-4">
              O relatório em PDF consolidará os dados cadastrais (nome, razão social, documento, telefone, e-mail, endereço completo) e o histórico de atendimentos e orçamentos vinculados de cada cliente.
            </p>

            {/* Quick summary stats */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total na Base:</span>
                <span className="text-white font-bold text-sm">{clients.length} clientes</span>
                <span className="text-slate-500 block text-[10px] mt-0.5">Cadastrados no sistema</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Resultado do Filtro:</span>
                <span className="text-cyan-400 font-bold text-sm">{filteredClients.length} clientes</span>
                <span className="text-slate-500 block text-[10px] mt-0.5">
                  {selectedType !== 'all' ? `Tipo: ${selectedType}` : 'Todos os tipos'}
                  {searchTerm ? ` • Busca ativa` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 mb-6">
              <button
                type="button"
                onClick={() => handleExportClientsPDF('all')}
                className="w-full flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-white font-semibold text-xs block group-hover:text-cyan-300">
                      Exportar Todos os Clientes ({clients.length})
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      Lista cadastral completa com todos os condomínios, empresas e residências
                    </span>
                  </div>
                </div>
                <FileDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
              </button>

              <button
                type="button"
                onClick={() => handleExportClientsPDF('filtered')}
                disabled={filteredClients.length === 0}
                className={`w-full flex items-center justify-between p-3.5 border rounded-xl text-left transition-all cursor-pointer group ${
                  filteredClients.length === 0
                    ? 'bg-slate-950/40 border-slate-800/50 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-950/40 hover:bg-cyan-900/50 border-cyan-800/70 text-cyan-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-white font-semibold text-xs block group-hover:text-cyan-300">
                      Exportar Apenas Clientes Filtrados ({filteredClients.length})
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      Respeita a busca atual e o filtro de categoria selecionado na tela
                    </span>
                  </div>
                </div>
                <FileDown className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Client Details & Full Work Orders History Timeline with PDF Export */}
      {selectedClientForHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                  {getTypeIcon(selectedClientForHistory.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {selectedClientForHistory.name}
                    </h2>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {selectedClientForHistory.type}
                    </span>
                  </div>
                  {selectedClientForHistory.tradeName && (
                    <p className="text-xs text-cyan-400">{selectedClientForHistory.tradeName}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportClientHistoryPDF(selectedClientForHistory)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                  title="Exportar Dossiê e Histórico Completo em PDF"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar Histórico em PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedClientForHistory(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
              {/* Client Info Summary */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Telefone / WhatsApp</span>
                  <div className="flex items-center gap-1.5 text-white font-medium">
                    <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{selectedClientForHistory.phone}</span>
                  </div>
                  <a
                    href={generateWhatsAppLink(selectedClientForHistory.phone, `Olá ${selectedClientForHistory.name}, tudo bem? Aqui é da SegurOS.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 mt-1 font-semibold"
                  >
                    <span>Abrir no WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">CPF / CNPJ</span>
                  <span className="text-white font-medium">{selectedClientForHistory.document || 'Não informado'}</span>
                  {selectedClientForHistory.email && (
                    <span className="text-slate-400 block truncate text-[11px] mt-1">{selectedClientForHistory.email}</span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Endereço Completo</span>
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      {selectedClientForHistory.address.street}, {selectedClientForHistory.address.number}
                      {selectedClientForHistory.address.complement ? ` (${selectedClientForHistory.address.complement})` : ''} -{' '}
                      {selectedClientForHistory.address.neighborhood}, {selectedClientForHistory.address.city} - {selectedClientForHistory.address.state}
                      {selectedClientForHistory.address.zipCode ? ` • CEP: ${selectedClientForHistory.address.zipCode}` : ''}
                    </span>
                  </div>
                </div>

                {selectedClientForHistory.notes && (
                  <div className="col-span-full pt-2 border-t border-slate-800 text-[11px] text-amber-300 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/40">
                    <strong>Notas do Imóvel:</strong> {selectedClientForHistory.notes}
                  </div>
                )}
              </div>

              {/* KPI metrics for this client */}
              {(() => {
                const clientOrders = workOrders
                  .filter(o => o.clientId === selectedClientForHistory.id)
                  .sort((a, b) => new Date(b.scheduledDate || b.createdAt).getTime() - new Date(a.scheduledDate || a.createdAt).getTime());
                const clientBudgets = budgets.filter(b => b.clientId === selectedClientForHistory.id);

                const completedCount = clientOrders.filter(o => o.status === 'concluida').length;
                const inProgressCount = clientOrders.filter(o => o.status === 'em_andamento' || o.status === 'em_deslocamento' || o.status === 'aberta').length;
                const totalBilled = clientOrders
                  .filter(o => o.status === 'concluida')
                  .reduce((sum, o) => sum + (o.totalValue || 0), 0);

                return (
                  <div className="space-y-4">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Total de O.S.</span>
                        <span className="text-white font-bold text-base">{clientOrders.length}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Concluídas</span>
                        <span className="text-emerald-400 font-bold text-base">{completedCount}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Em Andamento</span>
                        <span className="text-cyan-400 font-bold text-base">{inProgressCount}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Total Faturado</span>
                        <span className="text-emerald-400 font-bold text-base">{formatCurrency(totalBilled)}</span>
                      </div>
                    </div>

                    {/* Timeline of Work Orders */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-cyan-400" />
                          <span>Histórico de Ordens de Serviço ({clientOrders.length})</span>
                        </h4>

                        <button
                          type="button"
                          onClick={() => {
                            const cid = selectedClientForHistory.id;
                            setSelectedClientForHistory(null);
                            onOpenNewOSWithClient(cid);
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          + Abrir Nova O.S
                        </button>
                      </div>

                      {clientOrders.length === 0 ? (
                        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                          Nenhum atendimento ou O.S registrado para este cliente até o momento.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {clientOrders.map((order) => {
                            const orderTechs = technicians.filter(t => order.assignedTechnicianIds.includes(t.id));
                            return (
                              <div
                                key={order.id}
                                className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-white text-sm">
                                      {order.osNumber}
                                    </span>
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                                      {order.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-slate-800 text-slate-400">
                                      {getPriorityLabel(order.priority)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                      {formatDateBR(order.scheduledDate)} {order.scheduledTime ? `às ${order.scheduledTime}` : ''}
                                    </span>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                      order.status === 'concluida'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : order.status === 'em_andamento'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                        : order.status === 'cancelada'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}>
                                      {order.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-300">
                                  <strong>Descrição:</strong> {order.description}
                                </p>

                                {order.technicalReport && (
                                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-cyan-900/40 text-xs text-cyan-200">
                                    <strong>Laudo Técnico:</strong> {order.technicalReport}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                                  <div className="text-slate-400 text-[11px]">
                                    <strong>Técnico(s):</strong>{' '}
                                    {orderTechs.length > 0 ? orderTechs.map(t => t.name).join(', ') : 'Não atribuído'}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {order.signature && (
                                      <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Assinado por {order.signature.signedBy}
                                      </span>
                                    )}
                                    <span className="font-bold text-white text-xs">
                                      Total: <span className="text-cyan-400 font-mono">{formatCurrency(order.totalValue)}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Budgets for this client if any */}
                    {clientBudgets.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span>Orçamentos Comerciais ({clientBudgets.length})</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {clientBudgets.map(b => (
                            <div key={b.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                              <div>
                                <span className="font-mono font-bold text-cyan-400">{b.budgetNumber}</span>
                                <span className="block text-slate-300 font-medium truncate max-w-[200px]">{b.title}</span>
                                <span className="text-[10px] text-slate-500">{formatDateBR(b.createdAt)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-white font-bold">{formatCurrency(b.totalValue)}</span>
                                <span className="block text-[10px] text-slate-400 capitalize">{b.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const cid = selectedClientForHistory.id;
                  setSelectedClientForHistory(null);
                  onOpenNewOSWithClient(cid);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                + Nova O.S para este Cliente
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportClientHistoryPDF(selectedClientForHistory)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Baixar Dossiê em PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedClientForHistory(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Delete Client (Restricted to Admin) */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Cliente</h3>
                <p className="text-xs text-slate-400">Ação restrita ao Administrador</p>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 mb-4 space-y-1 text-xs">
              <div className="text-slate-200 font-semibold">{clientToDelete.name}</div>
              {clientToDelete.tradeName && (
                <div className="text-cyan-400">{clientToDelete.tradeName}</div>
              )}
              <div className="text-slate-400">
                {clientToDelete.phone} • {clientToDelete.document || 'Sem documento'}
              </div>
              {(() => {
                const linkedOS = workOrders.filter(o => o.clientId === clientToDelete.id).length;
                const linkedBudgets = budgets.filter(b => b.clientId === clientToDelete.id).length;
                if (linkedOS > 0 || linkedBudgets > 0) {
                  return (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-amber-300 flex items-center gap-1.5 text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Atenção: Este cliente possui {linkedOS} O.S e {linkedBudgets} orçamento(s) cadastrados.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <p className="text-xs text-slate-300 mb-6">
              Tem certeza que deseja excluir o cadastro deste cliente? Esta ação removerá os dados do cliente da base.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClient(clientToDelete.id);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
