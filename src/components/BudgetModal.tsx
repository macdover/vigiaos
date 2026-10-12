import React, { useState } from 'react';
import { 
  Budget, 
  Client, 
  Product, 
  Service, 
  OrderItem, 
  BudgetStatus 
} from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  Package, 
  Check, 
  Calendar, 
  DollarSign,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, getNextBudgetNumber } from '../utils/storage';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
  initialData?: Budget | null;
  clients: Client[];
  products: Product[];
  services: Service[];
  existingBudgets: Budget[];
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  clients,
  products,
  services,
  existingBudgets,
}) => {
  if (!isOpen) return null;

  const [confirmDelete, setConfirmDelete] = useState(false);

  const [clientId, setClientId] = useState(initialData?.clientId || (clients[0]?.id || ''));
  const [title, setTitle] = useState(initialData?.title || '');
  const [paymentTerms, setPaymentTerms] = useState(
    initialData?.paymentTerms || '50% de entrada + 50% na conclusão da instalação.'
  );
  const [validityDays, setValidityDays] = useState(initialData?.validityDays || 15);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [status, setStatus] = useState<BudgetStatus>(initialData?.status || 'pendente');
  const [items, setItems] = useState<OrderItem[]>(initialData?.items || []);
  const [discountValue, setDiscountValue] = useState<number>(initialData?.discountValue || 0);
  const [formError, setFormError] = useState<string | null>(null);

  // Item add state
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [isManualItem, setIsManualItem] = useState<boolean>(false);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');
  const [manualItemName, setManualItemName] = useState<string>('');
  const [manualItemPrice, setManualItemPrice] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  const selectedClient = clients.find(c => c.id === clientId) || clients[0];

  const laborValue = items
    .filter(i => i.type === 'service')
    .reduce((sum, i) => sum + i.total, 0);

  const partsValue = items
    .filter(i => i.type === 'product')
    .reduce((sum, i) => sum + i.total, 0);

  const subtotal = laborValue + partsValue;
  const totalValue = Math.max(0, subtotal - discountValue);

  const handleAddItem = () => {
    setFormError(null);

    if (isManualItem) {
      if (!manualItemName.trim()) {
        setFormError(`Informe o nome do ${itemType === 'product' ? 'produto' : 'serviço'}.`);
        return;
      }
      const priceNum = parseFloat(manualItemPrice.replace(',', '.')) || 0;
      if (priceNum <= 0) {
        setFormError('Informe um valor unitário maior que zero.');
        return;
      }

      setItems([
        ...items,
        {
          id: `bitem-${Date.now()}`,
          type: itemType,
          itemId: `manual-${Date.now()}`,
          name: manualItemName.trim(),
          quantity: itemQuantity,
          unitPrice: priceNum,
          total: priceNum * itemQuantity,
        },
      ]);
      setManualItemName('');
      setManualItemPrice('');
      setItemQuantity(1);
      return;
    }

    if (!selectedCatalogItemId) {
      setFormError(`Selecione um ${itemType === 'product' ? 'produto' : 'serviço'} do catálogo ou use a opção "Item Manual".`);
      return;
    }

    if (itemType === 'service') {
      const s = services.find(srv => srv.id === selectedCatalogItemId);
      if (!s) return;
      setItems([
        ...items,
        {
          id: `bitem-${Date.now()}`,
          type: 'service',
          itemId: s.id,
          name: s.name,
          quantity: itemQuantity,
          unitPrice: s.defaultPrice,
          total: s.defaultPrice * itemQuantity,
        },
      ]);
    } else {
      const p = products.find(prod => prod.id === selectedCatalogItemId);
      if (!p) return;
      setItems([
        ...items,
        {
          id: `bitem-${Date.now()}`,
          type: 'product',
          itemId: p.id,
          name: p.name,
          quantity: itemQuantity,
          unitPrice: p.sellPrice,
          total: p.sellPrice * itemQuantity,
        },
      ]);
    }

    setSelectedCatalogItemId('');
    setItemQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedClient) {
      setFormError('Selecione um cliente para o orçamento.');
      return;
    }
    if (!title.trim()) {
      setFormError('Informe o título do orçamento (ex: Instalação de CFTV 4 Câmeras).');
      return;
    }
    if (items.length === 0) {
      setFormError('Adicione pelo menos um produto ou serviço à proposta comercial.');
      return;
    }

    let formattedAddress = 'Endereço comercial';
    if (selectedClient.address) {
      if (typeof selectedClient.address === 'string') {
        formattedAddress = selectedClient.address;
      } else {
        const { street, number, neighborhood, city, state } = selectedClient.address;
        const parts = [
          street ? `${street}${number ? `, ${number}` : ''}` : '',
          neighborhood,
          city ? `${city}${state ? ` - ${state}` : ''}` : '',
        ].filter(Boolean);
        if (parts.length > 0) {
          formattedAddress = parts.join(' - ');
        }
      }
    }

    const newOrUpdatedBudget: Budget = {
      id: initialData?.id || `bud-${Date.now()}`,
      budgetNumber: initialData?.budgetNumber || getNextBudgetNumber(existingBudgets),
      clientId: selectedClient.id,
      clientName: selectedClient.tradeName || selectedClient.name,
      clientPhone: selectedClient.phone,
      clientEmail: selectedClient.email,
      clientAddress: formattedAddress,
      title: title.trim(),
      items,
      laborValue,
      partsValue,
      discountValue,
      totalValue,
      paymentTerms: paymentTerms.trim(),
      validityDays,
      notes: notes.trim(),
      status,
      convertedOSId: initialData?.convertedOSId,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      tenantId: initialData?.tenantId,
    };

    onSave(newOrUpdatedBudget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              {initialData ? `Editar Orçamento: ${initialData.budgetNumber}` : 'Novo Orçamento Comercial'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Crie propostas de projetos e envie para aprovação do cliente via WhatsApp ou PDF.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Client & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Cliente *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.tradeName ? `(${c.tradeName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Status da Proposta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BudgetStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="pendente">Pendente / Enviado</option>
                <option value="aprovado">Aprovado pelo Cliente</option>
                <option value="rejeitado">Rejeitado</option>
                <option value="convertido_em_os">Convertido em O.S</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Título / Objeto do Orçamento *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Instalação de Sistema de CFTV IP 8 Câmeras com NVR e Nobreak"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Add Item Section */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-400" />
                Itens da Proposta (Produtos & Serviços)
              </h4>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsManualItem(false)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                    !isManualItem ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Do Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualItem(true)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                    isManualItem ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  + Digitar Manual
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
              {/* Type Toggle: Produto vs Serviço */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Escolha o Tipo de Item:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setItemType('product'); setSelectedCatalogItemId(''); }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                      itemType === 'product'
                        ? 'bg-purple-950/80 text-purple-200 border-purple-500 shadow-md shadow-purple-950/50'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    <Package className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate">Produto / Equipamento</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/60 text-purple-300 font-mono">
                      {products.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setItemType('service'); setSelectedCatalogItemId(''); }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                      itemType === 'service'
                        ? 'bg-cyan-950/80 text-cyan-200 border-cyan-500 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">Mão de Obra / Serviço</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/60 text-cyan-300 font-mono">
                      {services.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Input row: either from catalog or manual input */}
              {!isManualItem ? (
                <div className="space-y-2">
                  {(itemType === 'product' && products.length === 0) || (itemType === 'service' && services.length === 0) ? (
                    <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300">
                      <span>
                        Nenhum {itemType === 'product' ? 'produto' : 'serviço'} encontrado no catálogo.
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsManualItem(true)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg cursor-pointer shrink-0 transition-colors"
                      >
                        + Digitar Manualmente
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        value={selectedCatalogItemId}
                        onChange={(e) => setSelectedCatalogItemId(e.target.value)}
                        className="flex-1 min-w-[200px] px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="">
                          {itemType === 'product'
                            ? '-- Clique aqui para escolher o Produto --'
                            : '-- Clique aqui para escolher o Serviço Técnico --'}
                        </option>
                        {itemType === 'product'
                          ? products.map(p => {
                              const stockVal = p.stockQuantity ?? (p as any).stock ?? 0;
                              return (
                                <option key={p.id} value={p.id}>
                                  {p.name} — {formatCurrency(p.sellPrice)} (Estoque: {stockVal} {p.unit || 'un'})
                                </option>
                              );
                            })
                          : services.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} — {formatCurrency(s.defaultPrice)}
                              </option>
                            ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          <span className="text-[11px] text-slate-400 font-semibold">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            value={itemQuantity}
                            onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-14 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center font-bold"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={manualItemName}
                      onChange={(e) => setManualItemName(e.target.value)}
                      placeholder={itemType === 'product' ? 'Nome do Produto (ex: Câmera Dome HD 1080p)...' : 'Nome do Serviço (ex: Instalação de Ponto de Câmera)...'}
                      className="flex-1 min-w-[200px] px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                        <span className="text-[11px] text-slate-400 font-semibold">R$:</span>
                        <input
                          type="text"
                          value={manualItemPrice}
                          onChange={(e) => setManualItemPrice(e.target.value)}
                          placeholder="0,00"
                          className="w-20 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                        <span className="text-[11px] text-slate-400 font-semibold">Qtd:</span>
                        <input
                          type="number"
                          min="1"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center font-bold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Items Table */}
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

            {/* Subtotals */}
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-400">
                <span>Peças: <strong className="text-white font-mono">{formatCurrency(partsValue)}</strong></span>
                <span>Serviços: <strong className="text-white font-mono">{formatCurrency(laborValue)}</strong></span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Desconto R$:</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono text-right"
                  />
                </div>
                <div className="border-l border-slate-700 pl-3">
                  <span className="text-slate-400 text-xs">Total: </span>
                  <span className="text-base font-bold text-cyan-400 font-mono">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment terms & validity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Condições de Pagamento
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ex: Entrada 40% + 3x sem juros no cartão ou 5% desc no Pix"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Validade da Proposta (Dias)
              </label>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(Math.max(1, parseInt(e.target.value) || 15))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações / Instruções
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Prazo de execução estimado em 3 dias úteis após aprovação. Não inclui quebra de alvenaria."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              {initialData && onDelete && (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 font-semibold">Tem certeza?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(initialData.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Sim, Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    Excluir Orçamento
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {initialData ? 'Salvar Proposta' : 'Gerar Orçamento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
