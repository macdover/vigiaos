import React, { useState } from 'react';
import { Product, Service, CurrentUser } from '../types';
import { 
  Package, 
  Wrench, 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  DollarSign, 
  X, 
  Check, 
  Tag,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../utils/storage';

interface InventoryViewProps {
  products: Product[];
  services: Service[];
  currentUser?: CurrentUser;
  onSaveProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onSaveService: (s: Service) => void;
  onDeleteService: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  services,
  currentUser,
  onSaveProduct,
  onDeleteProduct,
  onSaveService,
  onDeleteService,
}) => {
  const isAdmin = currentUser ? currentUser.role === 'admin' : true;
  const [tab, setTab] = useState<'products' | 'services'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Deletion modal states
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'product' | 'service'; code?: string } | null>(null);
  const [showAdminBlockedAlert, setShowAdminBlockedAlert] = useState(false);

  // Product modal states
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [pCode, setPCode] = useState('');
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState<Product['category']>('CFTV');
  const [pUnit, setPUnit] = useState('un');
  const [pCost, setPCost] = useState(0);
  const [pSell, setPSell] = useState(0);
  const [pStock, setPStock] = useState(0);
  const [pMinStock, setPMinStock] = useState(3);

  // Service modal states
  const [isServModalOpen, setIsServModalOpen] = useState(false);
  const [editingServ, setEditingServ] = useState<Service | null>(null);
  const [sCode, setSCode] = useState('');
  const [sName, setSName] = useState('');
  const [sCategory, setSCategory] = useState<Service['category']>('CFTV');
  const [sPrice, setSPrice] = useState(0);
  const [sMinutes, setSMinutes] = useState(60);
  const [sDesc, setSDesc] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openNewProduct = () => {
    setEditingProd(null);
    setPCode(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    setPName('');
    setPCategory('CFTV');
    setPUnit('un');
    setPCost(0);
    setPSell(0);
    setPStock(10);
    setPMinStock(3);
    setIsProdModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProd(p);
    setPCode(p.code);
    setPName(p.name);
    setPCategory(p.category);
    setPUnit(p.unit);
    setPCost(p.costPrice);
    setPSell(p.sellPrice);
    setPStock(p.stockQuantity);
    setPMinStock(p.minStock);
    setIsProdModalOpen(true);
  };

  const openNewService = () => {
    setEditingServ(null);
    setSCode(`SERV-${Math.floor(10 + Math.random() * 90)}`);
    setSName('');
    setSCategory('CFTV');
    setSPrice(150);
    setSMinutes(60);
    setSDesc('');
    setIsServModalOpen(true);
  };

  const openEditService = (s: Service) => {
    setEditingServ(s);
    setSCode(s.code);
    setSName(s.name);
    setSCategory(s.category);
    setSPrice(s.defaultPrice);
    setSMinutes(s.estimatedMinutes);
    setSDesc(s.description);
    setIsServModalOpen(true);
  };

  const handleSaveProd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    onSaveProduct({
      id: editingProd?.id || `prod-${Date.now()}`,
      code: pCode.trim(),
      name: pName.trim(),
      category: pCategory,
      unit: pUnit,
      costPrice: pCost,
      sellPrice: pSell,
      stockQuantity: pStock,
      minStock: pMinStock,
    });
    setIsProdModalOpen(false);
  };

  const handleSaveServ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim()) return;

    onSaveService({
      id: editingServ?.id || `serv-${Date.now()}`,
      code: sCode.trim(),
      name: sName.trim(),
      category: sCategory,
      defaultPrice: sPrice,
      estimatedMinutes: sMinutes,
      description: sDesc.trim(),
    });
    setIsServModalOpen(false);
  };

  const requestDelete = (id: string, name: string, type: 'product' | 'service', code?: string) => {
    if (!isAdmin) {
      setShowAdminBlockedAlert(true);
      return;
    }
    setItemToDelete({ id, name, type, code });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (!isAdmin) {
      setShowAdminBlockedAlert(true);
      setItemToDelete(null);
      return;
    }
    if (itemToDelete.type === 'product') {
      onDeleteProduct(itemToDelete.id);
      if (isProdModalOpen && editingProd?.id === itemToDelete.id) {
        setIsProdModalOpen(false);
      }
    } else {
      onDeleteService(itemToDelete.id);
      if (isServModalOpen && editingServ?.id === itemToDelete.id) {
        setIsServModalOpen(false);
      }
    }
    setItemToDelete(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            Catálogo de Produtos & Serviços
          </h1>
          <p className="text-xs text-slate-400">
            Controle de estoque de equipamentos de segurança e tabela de serviços técnicos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'products' ? (
            <button
              type="button"
              onClick={openNewProduct}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          ) : (
            <button
              type="button"
              onClick={openNewService}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Serviço
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => { setTab('products'); setCategoryFilter('all'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'products'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          Produtos em Estoque ({products.length})
        </button>
        <button
          type="button"
          onClick={() => { setTab('services'); setCategoryFilter('all'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'services'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Tabela de Serviços ({services.length})
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Buscar em ${tab === 'products' ? 'produtos' : 'serviços'}...`}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Products Tab Table */}
      {tab === 'products' && (
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3 text-center">Estoque</th>
                <th className="py-3 px-3 text-right">Preço Venda</th>
                <th className="py-3 px-3 text-right">Preço Custo</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map((p) => {
                const isLowStock = p.stockQuantity <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{p.code}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400">Unidade: {p.unit}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-mono">
                        <span className={`font-bold ${isLowStock ? 'text-red-400' : 'text-emerald-400'}`}>
                          {p.stockQuantity}
                        </span>
                        {isLowStock && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" title="Estoque Baixo" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {formatCurrency(p.sellPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {formatCurrency(p.costPrice)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                          title="Editar Produto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(p.id, p.name, 'product', p.code)}
                          className={`p-1.5 rounded transition-colors ${
                            isAdmin 
                              ? 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer' 
                              : 'bg-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
                          }`}
                          title={isAdmin ? "Excluir Produto (Exclusivo ADM)" : "Apenas o Administrador pode excluir produtos"}
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
      )}

      {/* Services Tab Table */}
      {tab === 'services' && (
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Serviço Técnico</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3 text-center">Tempo Est.</th>
                <th className="py-3 px-4 text-right">Valor Padrão</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredServices.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{s.code}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{s.description}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300">
                    {s.estimatedMinutes} min
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">
                    {formatCurrency(s.defaultPrice)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditService(s)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                        title="Editar Serviço"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(s.id, s.name, 'service', s.code)}
                        className={`p-1.5 rounded transition-colors ${
                          isAdmin 
                            ? 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer' 
                            : 'bg-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
                        }`}
                        title={isAdmin ? "Excluir Serviço (Exclusivo ADM)" : "Apenas o Administrador pode excluir serviços"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                {editingProd ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setIsProdModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProd} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    value={pCode}
                    onChange={(e) => setPCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Categoria</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value as Product['category'])}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  >
                    <option value="CFTV">CFTV</option>
                    <option value="Alarmes">Alarmes</option>
                    <option value="Controle de Acesso">Controle de Acesso</option>
                    <option value="Cerca Elétrica">Cerca Elétrica</option>
                    <option value="Redes e Cabos">Redes e Cabos</option>
                    <option value="Acessórios">Acessórios</option>
                    <option value="Interfonia">Interfonia</option>
                    <option value="Motores">Motores</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="Ex: Câmera Dome Full HD 1080p"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pCost}
                    onChange={(e) => setPCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pSell}
                    onChange={(e) => setPSell(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white font-mono font-bold text-cyan-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Estoque Atual</label>
                  <input
                    type="number"
                    value={pStock}
                    onChange={(e) => setPStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={pMinStock}
                    onChange={(e) => setPMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Unidade</label>
                  <input
                    type="text"
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    placeholder="un, m, rolo"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {editingProd && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProdModalOpen(false);
                      requestDelete(editingProd.id, editingProd.name, 'product', editingProd.code);
                    }}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors ${
                      isAdmin 
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer' 
                        : 'text-slate-500 opacity-60 cursor-not-allowed'
                    }`}
                    title={isAdmin ? "Excluir este produto (ADM)" : "Apenas o Administrador pode excluir"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Produto</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsProdModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
                  >
                    Salvar Produto
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isServModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                {editingServ ? 'Editar Serviço' : 'Novo Serviço Técnico'}
              </h3>
              <button onClick={() => setIsServModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServ} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    value={sCode}
                    onChange={(e) => setSCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Categoria</label>
                  <select
                    value={sCategory}
                    onChange={(e) => setSCategory(e.target.value as Service['category'])}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  >
                    <option value="CFTV">CFTV</option>
                    <option value="Alarmes">Alarmes</option>
                    <option value="Controle de Acesso">Controle de Acesso</option>
                    <option value="Cerca Elétrica">Cerca Elétrica</option>
                    <option value="Redes">Redes</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  placeholder="Ex: Instalação de Ponto de Câmera IP"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Valor Padrão (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sPrice}
                    onChange={(e) => setSPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white font-mono font-bold text-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tempo Estimado (min)</label>
                  <input
                    type="number"
                    value={sMinutes}
                    onChange={(e) => setSMinutes(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Descrição do Serviço</label>
                <textarea
                  rows={2}
                  value={sDesc}
                  onChange={(e) => setSDesc(e.target.value)}
                  placeholder="Passagem de cabo, conectorização e teste de sinal..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {editingServ && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsServModalOpen(false);
                      requestDelete(editingServ.id, editingServ.name, 'service', editingServ.code);
                    }}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors ${
                      isAdmin 
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer' 
                        : 'text-slate-500 opacity-60 cursor-not-allowed'
                    }`}
                    title={isAdmin ? "Excluir este serviço (ADM)" : "Apenas o Administrador pode excluir"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Serviço</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsServModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
                  >
                    Salvar Serviço
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (ADM Only) */}
      {itemToDelete && (
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
                <h3 className="text-base font-bold text-white">
                  Excluir {itemToDelete.type === 'product' ? 'Produto' : 'Serviço'}
                </h3>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              {itemToDelete.code && (
                <p className="text-slate-400">
                  Código: <span className="font-mono text-cyan-400 font-bold">{itemToDelete.code}</span>
                </p>
              )}
              <p className="text-white font-semibold text-sm">{itemToDelete.name}</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja remover este {itemToDelete.type === 'product' ? 'produto do catálogo e estoque' : 'serviço técnico'}? Esta ação é irreversível e somente administradores possuem essa permissão.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
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
                <h3 className="text-base font-bold text-white">Ação Restrita a Administradores</h3>
                <p className="text-xs text-amber-400 font-medium">Permissão Insuficiente</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Por segurança, a exclusão de produtos do catálogo e tabela de serviços é permitida <strong>exclusivamente para usuários com perfil de Administrador (ADM)</strong>. Técnicos não possuem autorização para excluir registros.
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
    </div>
  );
};
