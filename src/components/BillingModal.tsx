import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Barcode, 
  CheckCircle2, 
  Copy, 
  Download, 
  Share2, 
  FileText, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  AlertCircle,
  Building2,
  HardHat,
  Percent,
  Receipt
} from 'lucide-react';
import { 
  CompanySettings, 
  FinancialTransaction, 
  WorkOrder, 
  Client, 
  Technician, 
  PaymentMethod 
} from '../types';
import { 
  generatePixCopiaECola, 
  generatePixQrCodeImage, 
  generateBoletoDetails 
} from '../utils/pixBoletoGenerator';
import { 
  downloadBoletoPDF, 
  downloadReceiptPDF 
} from '../utils/financialPdfGenerator';
import { formatCurrency, formatDateBR, generateWhatsAppLink } from '../utils/storage';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: CompanySettings;
  workOrder?: WorkOrder | null;
  clients?: Client[];
  technicians?: Technician[];
  initialData?: FinancialTransaction | null;
  onSaveTransaction: (transaction: FinancialTransaction) => void;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  company,
  workOrder,
  clients = [],
  technicians = [],
  initialData,
  onSaveTransaction,
}) => {
  if (!isOpen) return null;

  // Mode: Pix vs Boleto tab
  const [activeTab, setActiveTab] = useState<'pix' | 'boleto'>('pix');

  // Form State
  const [isAvulso, setIsAvulso] = useState<boolean>(() => {
    if (initialData?.isAvulso !== undefined) return initialData.isAvulso;
    if (workOrder) return false;
    return false;
  });

  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (initialData?.clientId) return initialData.clientId;
    if (workOrder?.clientId) return workOrder.clientId;
    return clients[0]?.id || '';
  });

  const [avulsoName, setAvulsoName] = useState<string>(() => {
    return initialData?.avulsoClientInfo?.name || '';
  });
  const [avulsoPhone, setAvulsoPhone] = useState<string>(() => {
    return initialData?.avulsoClientInfo?.phone || '';
  });
  const [avulsoDoc, setAvulsoDoc] = useState<string>(() => {
    return initialData?.avulsoClientInfo?.document || '';
  });
  const [avulsoAddress, setAvulsoAddress] = useState<string>(() => {
    return initialData?.avulsoClientInfo?.address || '';
  });

  const [title, setTitle] = useState<string>(() => {
    if (initialData?.title) return initialData.title;
    if (workOrder) {
      return `Atendimento O.S #${workOrder.osNumber} - ${workOrder.clientName || 'Cliente'}`;
    }
    return 'Visita Técnica Avulsa / Atendimento Especializado';
  });

  const [description, setDescription] = useState<string>(() => {
    if (initialData?.description) return initialData.description;
    if (workOrder) return workOrder.description || '';
    return 'Serviço técnico de segurança eletrônica e telecomunicações';
  });

  const [amount, setAmount] = useState<number>(() => {
    if (initialData?.amount !== undefined) return initialData.amount;
    if (workOrder) return workOrder.totalValue || 0;
    return 150;
  });

  const [dueDate, setDueDate] = useState<string>(() => {
    if (initialData?.dueDate) return initialData.dueDate;
    const now = new Date();
    // Default to today or +3 days
    return now.toISOString().split('T')[0];
  });

  const [status, setStatus] = useState<'pendente' | 'pago'>(() => {
    if (initialData?.status === 'pago') return 'pago';
    return 'pendente';
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    return initialData?.paymentMethod || 'pix';
  });

  const [selectedTechId, setSelectedTechId] = useState<string>(() => {
    if (initialData?.technicianId) return initialData.technicianId;
    if (workOrder && workOrder.assignedTechnicianIds?.length > 0) {
      return workOrder.assignedTechnicianIds[0];
    }
    return '';
  });

  const [commissionPercent, setCommissionPercent] = useState<number>(() => {
    if (initialData?.commissionPercent !== undefined) return initialData.commissionPercent;
    return company?.defaultTechnicianCommissionRate ?? 15;
  });

  // Generated State
  const [pixCopiaECola, setPixCopiaECola] = useState<string>('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  // Sync client name from selectedClientId if not avulso
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientDisplayName = isAvulso
    ? (avulsoName || 'Cliente Avulso')
    : (selectedClient?.tradeName || selectedClient?.name || workOrder?.clientName || 'Cliente Cadastrado');

  const selectedTech = technicians.find((t) => t.id === selectedTechId);

  // Build current transaction payload for preview and download
  const currentTransaction: FinancialTransaction = {
    id: initialData?.id || `trans-rec-${Date.now()}`,
    tenantId: company?.id || 'tenant-mps-telefonia',
    type: 'receita',
    title,
    description,
    category: isAvulso ? 'visita_avulsa' : 'servico_os',
    amount: Number(amount) || 0,
    dueDate,
    paymentDate: status === 'pago' ? dueDate : undefined,
    status,
    paymentMethod: activeTab === 'pix' ? 'pix' : 'boleto',
    workOrderId: workOrder?.id,
    workOrderNumber: workOrder?.osNumber,
    clientId: !isAvulso ? selectedClientId : undefined,
    clientName: clientDisplayName,
    isAvulso,
    avulsoClientInfo: isAvulso
      ? {
          name: avulsoName || 'Cliente no Local',
          phone: avulsoPhone,
          document: avulsoDoc,
          address: avulsoAddress,
        }
      : undefined,
    technicianId: selectedTech?.id,
    technicianName: selectedTech?.name,
    commissionPercent: commissionPercent > 0 ? commissionPercent : undefined,
    commissionAmount: commissionPercent > 0 ? (amount * commissionPercent) / 100 : undefined,
    pixCopiaECola,
    createdAt: initialData?.createdAt || new Date().toISOString(),
  };

  // Generate Pix BR Code
  useEffect(() => {
    const rawPixKey = company?.pixKey || company?.cnpj || '11.601.831/0001-35';
    const beneficiaryName = company?.pixBeneficiaryName || company?.tradeName || company?.name || 'VigiaOS';
    const city = company?.pixCity || 'Rio de Janeiro';
    const txId = (workOrder?.osNumber || currentTransaction.id.replace(/\D/g, '')).slice(0, 20) || 'RECIBO';

    const code = generatePixCopiaECola({
      pixKey: rawPixKey,
      amount: Number(amount) || 0,
      beneficiaryName,
      city,
      txId,
      description: title.substring(0, 25),
    });

    setPixCopiaECola(code);

    let active = true;
    generatePixQrCodeImage(code).then((url) => {
      if (active) setPixQrCodeUrl(url);
    });

    return () => {
      active = false;
    };
  }, [company, amount, title, workOrder, currentTransaction.id]);

  const boletoData = generateBoletoDetails(currentTransaction, company);

  const handleCopyPix = () => {
    if (!pixCopiaECola) return;
    navigator.clipboard.writeText(pixCopiaECola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleCopyBarcode = () => {
    if (!boletoData?.digitableLine) return;
    navigator.clipboard.writeText(boletoData.digitableLine);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const targetPhone = isAvulso 
      ? avulsoPhone 
      : (selectedClient?.phone || workOrder?.clientPhone || '');

    const companyName = company?.tradeName || company?.name || 'VigiaOS Segurança';

    let msg = `Olá *${clientDisplayName}*!\n\n`;
    msg += `Aqui é da empresa *${companyName}*.\n`;
    msg += `Segue a cobrança referente ao atendimento: *${title}*.\n\n`;
    msg += `💰 *Valor:* ${formatCurrency(amount)}\n`;
    msg += `📅 *Vencimento:* ${formatDateBR(dueDate)}\n\n`;

    if (activeTab === 'pix') {
      msg += `🔹 *Chave Pix:* ${company?.pixKey || company?.cnpj || 'Consulte-nos'}\n`;
      msg += `🔹 *Pix Copia e Cola:* \n\`\`\`${pixCopiaECola}\`\`\`\n\n`;
      msg += `Basta copiar o código acima e colar na opção "Pix Copia e Cola" do seu aplicativo de banco.`;
    } else {
      msg += `🔹 *Boleto Bancário:*\n`;
      msg += `Linha digitável: \n\`\`\`${boletoData.digitableLine}\`\`\`\n\n`;
      msg += `Pagável em qualquer banco, lotérica ou aplicativo até o vencimento.`;
    }

    const waLink = generateWhatsAppLink(targetPhone || company?.phone || '', msg);
    window.open(waLink, '_blank');
  };

  const handleSave = () => {
    onSaveTransaction({
      ...currentTransaction,
      pixCopiaECola,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Emissão de Cobrança: Pix & Boleto
                {workOrder && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                    O.S #{workOrder.osNumber}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Recebimento imediato de clientes cadastrados ou atendimentos e visitas avulsas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Tabs: Pix vs Boleto */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pix');
                  setPaymentMethod('pix');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'pix'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-300" />
                <span>Cobrança via Pix (Imediato)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('boleto');
                  setPaymentMethod('boleto');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'boleto'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Barcode className="w-4 h-4 text-cyan-300" />
                <span>Boleto Bancário (Compensação)</span>
              </button>
            </div>

            {/* Quick Status toggle */}
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Situação:</span>
              <button
                type="button"
                onClick={() => setStatus(status === 'pago' ? 'pendente' : 'pago')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  status === 'pago'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {status === 'pago' ? '✓ Já Recebido / Pago' : '⏳ Em Aberto (Pendente)'}
              </button>
            </div>
          </div>

          {/* Form Fields: Atendimento & Cliente */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Dados da Cobrança */}
            <div className="lg:col-span-7 space-y-4">
              {/* Client Type Selector */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-cyan-400" />
                    Tipo de Destinatário / Atendimento
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAvulso(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        !isAvulso ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cliente Cadastrado
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAvulso(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        isAvulso ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Visita / Cliente Avulso
                    </button>
                  </div>
                </div>

                {!isAvulso ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Selecione o Cliente Cadastrado:
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.tradeName || c.name} {c.document ? `(${c.document})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Nome do Cliente no Local: *
                        </label>
                        <input
                          type="text"
                          value={avulsoName}
                          onChange={(e) => setAvulsoName(e.target.value)}
                          placeholder="Ex: Condomínio Mar Azul / João da Silva"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Telefone / WhatsApp:
                        </label>
                        <input
                          type="text"
                          value={avulsoPhone}
                          onChange={(e) => setAvulsoPhone(e.target.value)}
                          placeholder="(21) 99999-9999"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          CPF ou CNPJ (Opcional para Boleto):
                        </label>
                        <input
                          type="text"
                          value={avulsoDoc}
                          onChange={(e) => setAvulsoDoc(e.target.value)}
                          placeholder="000.000.000-00"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Endereço do Local:
                        </label>
                        <input
                          type="text"
                          value={avulsoAddress}
                          onChange={(e) => setAvulsoAddress(e.target.value)}
                          placeholder="Rua, número e bairro"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Título / Identificação do Atendimento: *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Instalação de Câmeras IP / Manutenção de Portão"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Descrição dos Serviços ou Peças:
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes do serviço técnico realizado..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Amount, Due Date & Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valor a Cobrar (R$): *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data de Vencimento: *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Technician Commission */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <HardHat className="w-3.5 h-3.5 text-amber-400" />
                    Técnico Executor:
                  </label>
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="">Nenhum / Sem comissão</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTechId && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-teal-400" />
                      Comissão Técnica:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={commissionPercent}
                        onChange={(e) => setCommissionPercent(Number(e.target.value))}
                        className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-teal-300"
                      />
                      <span className="text-xs text-slate-400">
                        = {formatCurrency((amount * (commissionPercent || 0)) / 100)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Pix & Boleto Visual Preview */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              {activeTab === 'pix' ? (
                /* Pix QR Code Card */
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex flex-col items-center text-center space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <QrCode className="w-4 h-4" />
                    <span>Pix Copia e Cola & QR Code Oficial</span>
                  </div>

                  {/* QR Code Container */}
                  <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200">
                    {pixQrCodeUrl ? (
                      <img
                        src={pixQrCodeUrl}
                        alt="QR Code Pix"
                        className="w-44 h-44 object-contain"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                        Gerando QR Code...
                      </div>
                    )}
                  </div>

                  {/* Amount Badge */}
                  <div className="w-full bg-slate-900/90 py-2 px-3 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block">Total a Pagar via Pix</span>
                    <span className="text-xl font-black text-emerald-400">{formatCurrency(amount)}</span>
                  </div>

                  {/* Pix Key & Beneficiary details */}
                  <div className="w-full text-left bg-slate-900/50 p-3 rounded-xl text-xs space-y-1 border border-slate-800/80">
                    <p className="text-slate-400">
                      <span className="font-semibold text-slate-300">Chave Pix:</span>{' '}
                      {company?.pixKey || company?.cnpj || '11.601.831/0001-35'}
                    </p>
                    <p className="text-slate-400 truncate">
                      <span className="font-semibold text-slate-300">Beneficiário:</span>{' '}
                      {company?.pixBeneficiaryName || company?.tradeName || 'VigiaOS'}
                    </p>
                    <p className="text-slate-400">
                      <span className="font-semibold text-slate-300">Cidade:</span>{' '}
                      {company?.pixCity || 'Rio de Janeiro'}
                    </p>
                  </div>

                  {/* Action: Copy Pix Copia e Cola */}
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      copiedPix
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                    }`}
                  >
                    {copiedPix ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Código Pix Copiado com Sucesso!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Pix Copia e Cola
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Boleto Bancário Card */
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex flex-col text-left space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                      <Barcode className="w-4 h-4" />
                      <span>Boleto Bancário FEBRABAN</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      CIP / Registro OK
                    </span>
                  </div>

                  {/* Boleto Info Grid */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Banco:</span>
                      <span className="font-bold text-white">{boletoData.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vencimento:</span>
                      <span className="font-bold text-emerald-400">{formatDateBR(dueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valor do Documento:</span>
                      <span className="font-bold text-white">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nosso Número:</span>
                      <span className="font-mono text-slate-300">{boletoData.ourNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sacado / Pagador:</span>
                      <span className="font-bold text-slate-200 truncate max-w-[170px]">{clientDisplayName}</span>
                    </div>
                  </div>

                  {/* Linha Digitável */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Linha Digitável:</span>
                    <p className="text-xs font-mono font-bold text-cyan-300 break-all select-all">
                      {boletoData.digitableLine}
                    </p>
                  </div>

                  {/* Copy Barcode button */}
                  <button
                    type="button"
                    onClick={handleCopyBarcode}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      copiedBarcode
                        ? 'bg-blue-500 text-slate-950 font-extrabold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {copiedBarcode ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Linha Digitável Copiada!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Linha Digitável
                      </>
                    )}
                  </button>

                  {/* Download Boleto PDF button */}
                  <button
                    type="button"
                    onClick={() => downloadBoletoPDF(currentTransaction, company)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Boleto Bancário (PDF)
                  </button>
                </div>
              )}

              {/* Quick Actions (WhatsApp & Quittance Receipt) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-700/80 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Enviar cobrança detalhada pelo WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadReceiptPDF(currentTransaction, company)}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Emitir comprovante / recibo oficial em PDF"
                >
                  <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Recibo (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Cobrança integrada com o fluxo de caixa da empresa</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar & Registrar no Financeiro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
