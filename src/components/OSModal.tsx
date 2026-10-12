import React, { useState } from 'react';
import { 
  WorkOrder, 
  Client, 
  Technician, 
  Product, 
  Service, 
  OrderItem, 
  OSType, 
  OSPriority, 
  OSStatus,
  CurrentUser
} from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  UserPlus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Wrench, 
  Package, 
  DollarSign, 
  Check, 
  Users,
  Send
} from 'lucide-react';
import { formatCurrency, getNextOSNumber } from '../utils/storage';

interface OSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (os: WorkOrder) => void;
  onSaveAndDispatch?: (os: WorkOrder) => void;
  initialData?: WorkOrder | null;
  clients: Client[];
  technicians: Technician[];
  products: Product[];
  services: Service[];
  existingOrders: WorkOrder[];
  currentUser?: CurrentUser;
}

export const OSModal: React.FC<OSModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveAndDispatch,
  initialData,
  clients,
  technicians,
  products,
  services,
  existingOrders,
  currentUser,
}) => {
  if (!isOpen) return null;

  const isSupervisor = currentUser?.role === 'supervisor';
  const canChangeTech = isSupervisor ? currentUser?.supervisorPermissions?.canChangeTechInOS !== false : true;
  const canAddItems = isSupervisor ? currentUser?.supervisorPermissions?.canAddItemsToOS !== false : true;

  const [clientId, setClientId] = useState(initialData?.clientId || (clients[0]?.id || ''));
  const [type, setType] = useState<OSType>(initialData?.type || 'manutencao_corretiva');
  const [priority, setPriority] = useState<OSPriority>(initialData?.priority || 'media');
  const [status, setStatus] = useState<OSStatus>(initialData?.status || 'aberta');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledDate || defaultDate);
  const [scheduledTime, setScheduledTime] = useState(initialData?.scheduledTime || '09:00');
  const [description, setDescription] = useState(initialData?.description || '');
  const [technicalReport, setTechnicalReport] = useState(initialData?.technicalReport || '');
  const [assignedTechIds, setAssignedTechIds] = useState<string[]>(
    initialData?.assignedTechnicianIds || (technicians[0] ? [technicians[0].id] : [])
  );
  const [items, setItems] = useState<OrderItem[]>(initialData?.items || []);
  const [discountValue, setDiscountValue] = useState<number>(initialData?.discountValue || 0);

  // Add Item State
  const [itemType, setItemType] = useState<'product' | 'service'>('service');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  const selectedClient = clients.find(c => c.id === clientId) || clients[0];

  // Calculate totals
  const laborValue = items
    .filter(i => i.type === 'service')
    .reduce((sum, i) => sum + i.total, 0);

  const partsValue = items
    .filter(i => i.type === 'product')
    .reduce((sum, i) => sum + i.total, 0);

  const subtotal = laborValue + partsValue;
  const totalValue = Math.max(0, subtotal - discountValue);

  const handleToggleTech = (techId: string) => {
    if (!canChangeTech) return;
    if (assignedTechIds.includes(techId)) {
      setAssignedTechIds(assignedTechIds.filter(id => id !== techId));
    } else {
      setAssignedTechIds([...assignedTechIds, techId]);
    }
  };

  const handleAddItem = () => {
    if (!canAddItems) return;
    if (!selectedCatalogItemId) return;

    if (itemType === 'service') {
      const s = services.find(srv => srv.id === selectedCatalogItemId);
      if (!s) return;
      const newItem: OrderItem = {
        id: `item-${Date.now()}`,
        type: 'service',
        itemId: s.id,
        name: s.name,
        quantity: itemQuantity,
        unitPrice: s.defaultPrice,
        total: s.defaultPrice * itemQuantity,
      };
      setItems([...items, newItem]);
    } else {
      const p = products.find(prod => prod.id === selectedCatalogItemId);
      if (!p) return;
      const newItem: OrderItem = {
        id: `item-${Date.now()}`,
        type: 'product',
        itemId: p.id,
        name: p.name,
        quantity: itemQuantity,
        unitPrice: p.sellPrice,
        total: p.sellPrice * itemQuantity,
      };
      setItems([...items, newItem]);
    }

    setSelectedCatalogItemId('');
    setItemQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleSubmit = (e?: React.FormEvent, andDispatch = false) => {
    if (e) e.preventDefault();
    if (!selectedClient) {
      alert('Selecione um cliente válido.');
      return;
    }
    if (!description.trim()) {
      alert('Preencha o escopo ou problema da O.S.');
      return;
    }
    if (assignedTechIds.length === 0) {
      alert('Atribua ao menos um técnico para esta O.S.');
      return;
    }

    const formattedAddress = `${selectedClient.address.street}, ${selectedClient.address.number}${
      selectedClient.address.complement ? ` (${selectedClient.address.complement})` : ''
    } - ${selectedClient.address.neighborhood}, ${selectedClient.address.city} - ${selectedClient.address.state}`;

    const newOrUpdatedOS: WorkOrder = {
      id: initialData?.id || `os-${Date.now()}`,
      osNumber: initialData?.osNumber || getNextOSNumber(existingOrders),
      clientId: selectedClient.id,
      clientName: selectedClient.tradeName || selectedClient.name,
      clientPhone: selectedClient.phone,
      clientAddress: formattedAddress,
      type,
      priority,
      status,
      assignedTechnicianIds: assignedTechIds,
      scheduledDate,
      scheduledTime,
      description: description.trim(),
      technicalReport: technicalReport.trim(),
      items,
      laborValue,
      partsValue,
      discountValue,
      totalValue,
      photos: initialData?.photos || [],
      signature: initialData?.signature,
      budgetIdRef: initialData?.budgetIdRef,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      startedAt: initialData?.startedAt,
      completedAt: initialData?.completedAt,
    };

    onSave(newOrUpdatedOS);
    onClose();
    if (andDispatch && onSaveAndDispatch) {
      onSaveAndDispatch(newOrUpdatedOS);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-400" />
              {initialData ? `Editar Ordem de Serviço: ${initialData.osNumber}` : 'Abertura de O.S'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina os dados do atendimento, atribua os técnicos responsáveis e adicione materiais.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Client Selection */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Cliente do Atendimento *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.tradeName ? `(${c.tradeName})` : ''} - {c.phone}
                </option>
              ))}
            </select>
            {selectedClient && (
              <p className="text-[11px] text-slate-400">
                Endereço: {selectedClient.address.street}, {selectedClient.address.number} - {selectedClient.address.neighborhood}, {selectedClient.address.city}
              </p>
            )}
          </div>

          {/* Type, Priority, Date, Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Serviço</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as OSType)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="instalacao">Instalação Nova</option>
                <option value="manutencao_corretiva">Manutenção Corretiva</option>
                <option value="manutencao_preventiva">Manutenção Preventiva</option>
                <option value="chamado_emergencial">Chamado Emergencial</option>
                <option value="vistoria">Vistoria Técnica</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OSPriority)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data Agendada</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Horário Previsto</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {/* Assigned Technicians - Crucial for user prompt! */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Técnicos Marcados para esta O.S *
              </label>
              {!canChangeTech ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold">
                  Alteração restrita pelo Dono
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Apenas os técnicos selecionados aqui verão esta O.S no modo técnico.
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {technicians.map((tech) => {
                const isAssigned = assignedTechIds.includes(tech.id);
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => handleToggleTech(tech.id)}
                    disabled={!canChangeTech}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      !canChangeTech ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'
                    } ${
                      isAssigned
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tech.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                        {tech.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{tech.name}</p>
                        <p className="text-[10px] text-slate-400">{tech.specialty}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      isAssigned ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-slate-700'
                    }`}>
                      {isAssigned && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Problem Scope / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Descrição do Problema / Escopo Técnico *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Câmera da entrada não liga. Fazer teste de continuidade no cabo UTP e substituir fonte de alimentação se necessário."
              className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Items & Materials Section */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-400" />
                Peças, Equipamentos e Serviços
              </h4>
              {!canAddItems && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold">
                  Inclusão bloqueada pelo Dono
                </span>
              )}
            </div>

            {/* Add Item Bar */}
            {canAddItems ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-md">
                <button
                  type="button"
                  onClick={() => { setItemType('service'); setSelectedCatalogItemId(''); }}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${itemType === 'service' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                >
                  Serviço
                </button>
                <button
                  type="button"
                  onClick={() => { setItemType('product'); setSelectedCatalogItemId(''); }}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${itemType === 'product' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                >
                  Produto
                </button>
              </div>

              <select
                value={selectedCatalogItemId}
                onChange={(e) => setSelectedCatalogItemId(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none"
              >
                <option value="">Selecione um {itemType === 'service' ? 'serviço' : 'produto'}...</option>
                {itemType === 'service'
                  ? services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatCurrency(s.defaultPrice)})
                      </option>
                    ))
                  : products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Est: {p.stockQuantity} ({formatCurrency(p.sellPrice)})
                      </option>
                    ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white text-center"
                />

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedCatalogItemId}
                  className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
              Seu perfil de supervisor não tem autorização para incluir novos materiais ou serviços na O.S.
            </div>
          )}

            {/* Item Table */}
            {items.length > 0 && (
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-2 text-center">Tipo</th>
                      <th className="py-2 px-2 text-center">Qtd</th>
                      <th className="py-2 px-2 text-right">Unitário</th>
                      <th className="py-2 px-2 text-right">Total</th>
                      <th className="py-2 px-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-medium text-white">{it.name}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            it.type === 'service' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {it.type === 'service' ? 'Mão de Obra' : 'Produto'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono">{it.quantity}</td>
                        <td className="py-2 px-2 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold text-white">{formatCurrency(it.total)}</td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals Summary Box */}
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-400">
                <span>Mão de Obra: <strong className="text-white font-mono">{formatCurrency(laborValue)}</strong></span>
                <span>Peças: <strong className="text-white font-mono">{formatCurrency(partsValue)}</strong></span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Desconto R$:</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono text-right"
                  />
                </div>
                <div className="border-l border-slate-700 pl-3">
                  <span className="text-slate-400 text-xs">Total: </span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status selector (Admin can set any status) */}
          <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300">Status Inicial da O.S:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OSStatus)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
            >
              <option value="aberta">Aberta</option>
              <option value="em_deslocamento">Em Deslocamento</option>
              <option value="em_andamento">Em Execução</option>
              <option value="aguardando_peca">Aguardando Peça</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors text-center cursor-pointer"
            >
              Cancelar
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {onSaveAndDispatch && (
                <button
                  type="button"
                  onClick={() => handleSubmit(undefined, true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Salva a O.S e abre a tela para encaminhar no WhatsApp do técnico"
                >
                  <Send className="w-4 h-4" />
                  <span>Salvar e Encaminhar para Técnico</span>
                </button>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {initialData ? 'Salvar Alterações' : 'Salvar O.S'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
