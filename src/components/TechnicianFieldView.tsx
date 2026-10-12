import React, { useState, useEffect, useRef } from 'react';
import { 
  WorkOrder, 
  Technician, 
  OSStatus, 
  OSPhoto, 
  OSSignature,
  Budget,
  BudgetStatus,
  CompanySettings,
  Client,
  Product,
  Service,
  TechnicianLocation
} from '../types';
import { 
  HardHat, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Camera, 
  PenTool, 
  Send, 
  Calendar, 
  FileText, 
  Wrench, 
  ChevronRight, 
  Navigation,
  ArrowLeft,
  DollarSign,
  Share2,
  Plus,
  Compass,
  Radio,
  Check,
  Download,
  ExternalLink,
  Edit3,
  Trash2,
  AlertTriangle,
  BookOpen,
  Lock
} from 'lucide-react';
import { formatCurrency, formatDateBR, generateWhatsAppLink } from '../utils/storage';
import { PhotoUploader } from './PhotoUploader';
import { SignaturePad } from './SignaturePad';
import { BudgetModal } from './BudgetModal';
import { downloadBudgetPDF, sendBudgetPDFToWhatsApp } from '../utils/pdfGenerator';
import { downloadTechnicianManualPDF } from '../utils/manualPdfGenerator';

interface TechnicianFieldViewProps {
  currentTech: Technician;
  workOrders: WorkOrder[];
  onUpdateWorkOrder: (updatedOS: WorkOrder) => void;
  company?: CompanySettings;
  tenantId?: string;
  budgets?: Budget[];
  onSaveBudget?: (budget: Budget) => void;
  onDeleteBudget?: (budgetId: string) => void;
  clients?: Client[];
  products?: Product[];
  services?: Service[];
  onUpdateTechnicianLocation?: (techId: string, location: TechnicianLocation) => void;
  onConvertToOS?: (budget: Budget) => void;
}

export const TechnicianFieldView: React.FC<TechnicianFieldViewProps> = ({
  currentTech,
  workOrders,
  onUpdateWorkOrder,
  company,
  tenantId,
  budgets = [],
  onSaveBudget,
  onDeleteBudget,
  clients = [],
  products = [],
  services = [],
  onUpdateTechnicianLocation,
  onConvertToOS,
}) => {
  // Navigation tabs for technicians
  const allowBudgets = company?.allowTechnicianBudgets !== false && currentTech.canCreateBudgets !== false;
  const [activeMainTab, setActiveMainTab] = useState<'orders' | 'budgets'>('orders');

  // Work orders state
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [technicalReportText, setTechnicalReportText] = useState('');

  // Budgets state for technicians
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetFeedback, setBudgetFeedback] = useState<string | null>(null);

  // GPS Tracking State
  const [gpsStatus, setGpsStatus] = useState<'active' | 'requesting' | 'denied' | 'unsupported' | 'idle'>('idle');
  const [lastLoc, setLastLoc] = useState<TechnicianLocation | null>(currentTech.lastLocation || null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Strictly filter only OS where currentTech.id is in assignedTechnicianIds
  const myWorkOrders = workOrders.filter(os => 
    os.assignedTechnicianIds.includes(currentTech.id)
  );

  const pendingOrders = myWorkOrders.filter(os => os.status !== 'concluida' && os.status !== 'cancelada');
  const completedOrders = myWorkOrders.filter(os => os.status === 'concluida');

  const displayedOrders = filter === 'pending' 
    ? pendingOrders 
    : filter === 'completed' 
    ? completedOrders 
    : myWorkOrders;

  // -------------------------------------------------------------
  // GPS Geolocation Watcher
  // -------------------------------------------------------------
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('unsupported');
      return;
    }

    setGpsStatus('requesting');

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const loc: TechnicianLocation = {
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
        speed: speed ?? null,
        heading: heading ?? null,
        timestamp: new Date().toISOString(),
        isOnline: true
      };

      setLastLoc(loc);
      setGpsStatus('active');
      setGpsErrorMsg(null);

      // Transmit to parent and atomic backend
      if (onUpdateTechnicianLocation) {
        onUpdateTechnicianLocation(currentTech.id, loc);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn('[GPS] Geolocation watch error:', error.message);
      if (error.code === error.PERMISSION_DENIED) {
        setGpsStatus('denied');
        setGpsErrorMsg('Permissão de GPS negada. Ative a localização no navegador do seu smartphone.');
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setGpsStatus('idle');
        setGpsErrorMsg('Sinal de GPS fraco ou indisponível no momento.');
      } else {
        setGpsStatus('idle');
        setGpsErrorMsg('Aguardando sinal de satélite/GPS do aparelho.');
      }
    };

    // Immediate fix attempt
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000
    });

    // Continuous watch
    try {
      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000
      });
      watchIdRef.current = id;
    } catch (e) {
      console.warn('Could not register watchPosition:', e);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [currentTech.id]);

  const requestGpsAgain = () => {
    if (!('geolocation' in navigator)) return;
    setGpsStatus('requesting');
    setGpsErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: TechnicianLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: new Date().toISOString(),
          isOnline: true
        };
        setLastLoc(loc);
        setGpsStatus('active');
        if (onUpdateTechnicianLocation) {
          onUpdateTechnicianLocation(currentTech.id, loc);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsErrorMsg('Você precisa autorizar o acesso à localização nas configurações do celular.');
        } else {
          setGpsStatus('idle');
          setGpsErrorMsg('Ligue o GPS (Localização) do smartphone.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSelectOS = (os: WorkOrder) => {
    setSelectedOS(os);
    setTechnicalReportText(os.technicalReport || '');
    setShowSignaturePad(false);
  };

  const handleUpdateStatus = (os: WorkOrder, newStatus: OSStatus) => {
    const now = new Date().toISOString();
    const updated: WorkOrder = {
      ...os,
      status: newStatus,
      startedAt: (newStatus === 'em_andamento' && !os.startedAt) ? now : os.startedAt,
      completedAt: newStatus === 'concluida' ? now : os.completedAt,
      technicalReport: technicalReportText || os.technicalReport,
    };
    onUpdateWorkOrder(updated);
    setSelectedOS(updated);
  };

  const handlePhotosChange = (updatedPhotos: OSPhoto[]) => {
    if (!selectedOS) return;
    const updated: WorkOrder = {
      ...selectedOS,
      photos: updatedPhotos,
      technicalReport: technicalReportText || selectedOS.technicalReport,
    };
    onUpdateWorkOrder(updated);
    setSelectedOS(updated);
  };

  const handleSaveSignature = (signature: OSSignature) => {
    if (!selectedOS) return;
    const updated: WorkOrder = {
      ...selectedOS,
      signature,
      status: selectedOS.status === 'em_andamento' ? 'concluida' : selectedOS.status,
      completedAt: selectedOS.completedAt || new Date().toISOString(),
      technicalReport: technicalReportText || selectedOS.technicalReport,
    };
    onUpdateWorkOrder(updated);
    setSelectedOS(updated);
    setShowSignaturePad(false);
  };

  const handleSaveReport = () => {
    if (!selectedOS) return;
    const updated: WorkOrder = {
      ...selectedOS,
      technicalReport: technicalReportText,
    };
    onUpdateWorkOrder(updated);
    setSelectedOS(updated);
  };

  const handleSendWhatsAppSummary = (os: WorkOrder) => {
    const text = `*Comprovante de Atendimento Técnico - SegurOS*\n\n` +
      `Olá, segue o resumo do atendimento da *${os.osNumber}*:\n` +
      `*Cliente:* ${os.clientName}\n` +
      `*Técnico Responsável:* ${currentTech.name}\n` +
      `*Serviço:* ${os.description}\n` +
      (os.technicalReport ? `*Relatório Técnico:* ${os.technicalReport}\n` : '') +
      `*Total:* ${formatCurrency(os.totalValue)}\n` +
      `*Status:* ${os.status === 'concluida' ? '✅ CONCLUÍDA' : 'EM ANDAMENTO'}\n` +
      (os.signature ? `*Assinado digitalmente por:* ${os.signature.signedBy} às ${formatDateBR(os.signature.signedAt)}\n` : '') +
      `*Fotos anexadas:* ${os.photos.length} registros.\n\n` +
      `Agradecemos pela preferência em segurança eletrônica!`;

    const link = generateWhatsAppLink(os.clientPhone, text);
    window.open(link, '_blank');
  };

  // Budget actions for technicians
  const handleOpenNewBudget = () => {
    setEditingBudget(null);
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudgetModal = (budget: Budget) => {
    if (onSaveBudget) {
      onSaveBudget(budget);
      setBudgetFeedback('Orçamento salvo com sucesso!');
      setTimeout(() => setBudgetFeedback(null), 3500);
    }
    setIsBudgetModalOpen(false);
  };

  const handleDownloadBudget = (b: Budget) => {
    try {
      const fileName = downloadBudgetPDF(b, company || {
        name: 'MPS Telefonia & Segurança',
        tradeName: 'MPS Telefonia',
        cnpj: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        warrantyTerms: 'Garantia legal de 90 dias para serviços e 1 ano para equipamentos.',
        plan: 'master'
      });
      setBudgetFeedback(`PDF baixado com sucesso: ${fileName}`);
      setTimeout(() => setBudgetFeedback(null), 4000);
    } catch (e) {
      console.error('Erro ao baixar orçamento em PDF:', e);
    }
  };

  const handleSendBudgetWhatsApp = (b: Budget) => {
    try {
      sendBudgetPDFToWhatsApp(b, company || {
        name: 'MPS Telefonia & Segurança',
        tradeName: 'MPS Telefonia',
        cnpj: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        warrantyTerms: 'Garantia padrão de segurança eletrônica.',
        plan: 'master'
      });
    } catch (e) {
      console.error('Erro ao disparar PDF no WhatsApp:', e);
    }
  };

  const getStatusBadge = (status: OSStatus) => {
    switch (status) {
      case 'aberta':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Aberta</span>;
      case 'em_deslocamento':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">Em Deslocamento</span>;
      case 'em_andamento':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Em Execução</span>;
      case 'aguardando_peca':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Aguardando Peça</span>;
      case 'concluida':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Concluída</span>;
      case 'cancelada':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Cancelada</span>;
    }
  };

  const getPriorityBadge = (priority: WorkOrder['priority']) => {
    switch (priority) {
      case 'urgente':
        return <span className="text-[11px] px-2 py-0.5 font-bold uppercase rounded bg-red-500/20 text-red-400 border border-red-500/30">Urgente</span>;
      case 'alta':
        return <span className="text-[11px] px-2 py-0.5 font-bold uppercase rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">Alta</span>;
      case 'media':
        return <span className="text-[11px] px-2 py-0.5 font-bold uppercase rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Média</span>;
      case 'baixa':
        return <span className="text-[11px] px-2 py-0.5 font-bold uppercase rounded bg-slate-700 text-slate-300">Baixa</span>;
    }
  };

  const getBudgetStatusBadge = (status: BudgetStatus) => {
    switch (status) {
      case 'pendente':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Pendente</span>;
      case 'aprovado':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Aprovado</span>;
      case 'rejeitado':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Rejeitado</span>;
      case 'convertido_em_os':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Convertido em O.S</span>;
    }
  };

  // If viewing details of an O.S
  if (selectedOS) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-12">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedOS(null)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Atendimentos
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-cyan-400">{selectedOS.osNumber}</span>
            {getStatusBadge(selectedOS.status)}
          </div>
        </div>

        {/* GPS Live Transmission Bar in OS */}
        {lastLoc && (
          <div className="bg-slate-900/90 border border-cyan-500/30 px-3.5 py-2 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold">GPS Ativo:</span>
              <span className="text-slate-400 font-mono hidden sm:inline">
                ({lastLoc.latitude.toFixed(4)}, {lastLoc.longitude.toFixed(4)})
              </span>
              <span className="text-slate-400">Precisão: ±{lastLoc.accuracy || 10}m</span>
            </div>
            <a
              href={`https://www.google.com/maps?q=${lastLoc.latitude},${lastLoc.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" /> Ver no Mapa
            </a>
          </div>
        )}

        {/* Quick Status Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status do Atendimento em Campo</span>
            {getPriorityBadge(selectedOS.priority)}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleUpdateStatus(selectedOS, 'em_deslocamento')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedOS.status === 'em_deslocamento'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Em Deslocamento
            </button>

            <button
              type="button"
              onClick={() => handleUpdateStatus(selectedOS, 'em_andamento')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedOS.status === 'em_andamento'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Iniciei o Serviço
            </button>

            <button
              type="button"
              onClick={() => handleUpdateStatus(selectedOS, 'aguardando_peca')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedOS.status === 'aguardando_peca'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Aguardando Peça
            </button>

            <button
              type="button"
              onClick={() => handleUpdateStatus(selectedOS, 'concluida')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedOS.status === 'concluida'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Concluir O.S
            </button>
          </div>
        </div>

        {/* Client & Service Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">{selectedOS.clientName}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {selectedOS.clientAddress}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${selectedOS.clientPhone.replace(/\D/g, '')}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                Ligar
              </a>
              <a
                href={generateWhatsAppLink(selectedOS.clientPhone, `Olá ${selectedOS.clientName}, aqui é o técnico ${currentTech.name} da empresa de segurança eletrônica a respeito da sua O.S ${selectedOS.osNumber}.`)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOS.clientAddress)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Rota GPS
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Descrição do Chamado
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
              {selectedOS.description}
            </p>
          </div>
        </div>

        {/* Technical Report Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Laudo Técnico do Atendimento
            </h3>
            <button
              type="button"
              onClick={handleSaveReport}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Salvar Laudo
            </button>
          </div>
          <textarea
            rows={3}
            value={technicalReportText}
            onChange={(e) => setTechnicalReportText(e.target.value)}
            placeholder="Descreva o que foi feito (ex: troca de conector BNC, reconfiguração do DVR, passagem de cabo UTP, testes de imagem)..."
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Photo Uploader Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-3">
          <PhotoUploader
            photos={selectedOS.photos}
            onChange={handlePhotosChange}
          />
        </div>

        {/* Signature Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Assinatura do Cliente na Tela</h3>
                <p className="text-[11px] text-slate-400">O cliente assina com o dedo diretamente no aparelho</p>
              </div>
            </div>

            {selectedOS.signature && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Assinado
              </span>
            )}
          </div>

          {selectedOS.signature ? (
            <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-32 h-16 bg-white rounded border border-slate-700 flex items-center justify-center overflow-hidden p-1">
                  <img
                    src={selectedOS.signature.dataUrl}
                    alt="Assinatura"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{selectedOS.signature.signedBy}</p>
                  {selectedOS.signature.signerDocument && (
                    <p className="text-[11px] text-slate-400 font-mono">Doc: {selectedOS.signature.signerDocument}</p>
                  )}
                  <p className="text-[10px] text-slate-500 font-mono">Assinado em: {formatDateBR(selectedOS.signature.signedAt)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSignaturePad(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
              >
                Coletar Nova Assinatura
              </button>
            </div>
          ) : (
            <div>
              {!showSignaturePad ? (
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center space-y-3 bg-slate-950/40">
                  <PenTool className="w-8 h-8 mx-auto text-cyan-400/70" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Assinatura Pendente</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Entregue o celular ao cliente para conferir e assinar com o dedo</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Abrir Tela de Assinatura Digital
                  </button>
                </div>
              ) : (
                <SignaturePad
                  initialSignature={selectedOS.signature}
                  clientDefaultName={selectedOS.clientName}
                  onSave={handleSaveSignature}
                  onCancel={() => setShowSignaturePad(false)}
                />
              )}
            </div>
          )}

          {showSignaturePad && selectedOS.signature && (
            <div className="mt-4">
              <SignaturePad
                initialSignature={selectedOS.signature}
                clientDefaultName={selectedOS.clientName}
                onSave={handleSaveSignature}
                onCancel={() => setShowSignaturePad(false)}
              />
            </div>
          )}
        </div>

        {/* Finalization Bottom Bar */}
        <div className="sticky bottom-2 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold">Valor Total:</span>
            <span className="text-base font-bold text-cyan-400 font-mono">{formatCurrency(selectedOS.totalValue)}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSendWhatsAppSummary(selectedOS)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Enviar pelo WhatsApp
            </button>

            {selectedOS.status !== 'concluida' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedOS, 'concluida')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalizar Atendimento
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Technician Screen
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header Profile Info & GPS Signal */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTech.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
            {currentTech.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{currentTech.name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                Técnico em Campo
              </span>
            </div>
            <p className="text-xs text-slate-400">{currentTech.specialty}</p>
          </div>
        </div>

        {/* Live GPS Status Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl self-start sm:self-auto">
          <div className="flex items-center gap-2">
            {gpsStatus === 'active' ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 block">
                    GPS Conectado (Ao Vivo)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Precisão: ±{lastLoc?.accuracy || 10}m
                  </span>
                </div>
              </>
            ) : gpsStatus === 'requesting' ? (
              <>
                <Radio className="w-4 h-4 text-cyan-400 animate-spin" />
                <div>
                  <span className="text-[11px] font-bold text-cyan-400 block">Obtendo GPS...</span>
                  <span className="text-[10px] text-slate-400">Sincronizando satélite</span>
                </div>
              </>
            ) : gpsStatus === 'denied' ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <div>
                  <span className="text-[11px] font-bold text-red-400 block">GPS Bloqueado</span>
                  <button
                    type="button"
                    onClick={requestGpsAgain}
                    className="text-[10px] text-cyan-400 underline cursor-pointer"
                  >
                    Permitir Localização
                  </button>
                </div>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-[11px] font-bold text-amber-400 block">GPS em Espera</span>
                  <button
                    type="button"
                    onClick={requestGpsAgain}
                    className="text-[10px] text-cyan-400 underline cursor-pointer"
                  >
                    Ativar Transmissão
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Manual do Técnico em Campo (Liberado pelo Administrador) */}
      {currentTech.canDownloadManual !== false ? (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Manual de Procedimentos do Técnico em Campo (PDF)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Liberado pelo Administrador
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Passo a passo no celular: rotas GPS, registro obrigatório de 4 fotos (Antes, Durante, Depois, Equipamento), laudo e assinatura digital.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              downloadTechnicianManualPDF(company);
              setBudgetFeedback('Manual do Técnico em Campo baixado em PDF com sucesso!');
              setTimeout(() => setBudgetFeedback(null), 4000);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            Baixar Manual (PDF)
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Manual de Procedimentos Técnico: <strong>Aguardando liberação pelo Administrador da empresa.</strong>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Status: Bloqueado</span>
        </div>
      )}

      {/* GPS Warning if not active */}
      {gpsStatus === 'denied' && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center justify-between gap-2">
          <span>
            ⚠️ O dono da empresa necessita da localização ativa para monitorar os atendimentos. Ative o GPS do seu smartphone.
          </span>
          <button
            type="button"
            onClick={requestGpsAgain}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold shrink-0 cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Feedback message for actions */}
      {budgetFeedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{budgetFeedback}</span>
        </div>
      )}

      {/* Main Mode Tabs (Ordens de Serviço vs Orçamentos) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveMainTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeMainTab === 'orders'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Minhas Ordens de Serviço ({myWorkOrders.length})
        </button>

        {allowBudgets && (
          <button
            type="button"
            onClick={() => setActiveMainTab('budgets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'budgets'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Orçamentos em Campo ({budgets.length})
          </button>
        )}
      </div>

      {/* TAB 1: ORDENS DE SERVIÇO */}
      {activeMainTab === 'orders' && (
        <div className="space-y-4">
          {/* Sub-Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === 'pending'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
              >
                Pendentes ({pendingOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === 'completed'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
              >
                Concluídas ({completedOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
              >
                Todas ({myWorkOrders.length})
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Atendimentos atribuídos a você
            </span>
          </div>

          {/* Orders List */}
          {displayedOrders.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <HardHat className="w-10 h-10 mx-auto text-slate-600" />
              <h3 className="text-base font-semibold text-slate-200">Nenhuma Ordem de Serviço encontrada</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {filter === 'pending' 
                  ? 'Você não possui atendimentos pendentes atribuídos a você no momento. Bom trabalho!'
                  : 'Nenhuma O.S corresponde ao filtro selecionado.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedOrders.map((os) => {
                const hasPhotos = os.photos.length > 0;
                const hasSignature = !!os.signature;

                return (
                  <div
                    key={os.id}
                    onClick={() => handleSelectOS(os)}
                    className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">{os.osNumber}</span>
                        {getStatusBadge(os.status)}
                        {getPriorityBadge(os.priority)}
                      </div>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {formatDateBR(os.scheduledDate)} {os.scheduledTime}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">
                      {os.clientName}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 truncate">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{os.clientAddress}</span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 bg-slate-950/40 p-2 rounded border border-slate-800/80 mb-3">
                      {os.description}
                    </p>

                    {/* Badges / summary row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          hasPhotos ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-500'
                        }`}>
                          <Camera className="w-3 h-3" />
                          {os.photos.length} Fotos
                        </span>

                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          hasSignature ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                        }`}>
                          <PenTool className="w-3 h-3" />
                          {hasSignature ? 'Assinado' : 'Pendente Assinar'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">
                          {formatCurrency(os.totalValue)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORÇAMENTOS & PROPOSTAS EM CAMPO */}
      {activeMainTab === 'budgets' && allowBudgets && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Orçamentos Rápidos em Campo
              </h3>
              <p className="text-xs text-slate-400">
                Monte a proposta no cliente e mande o PDF direto para o WhatsApp dele em segundos!
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewBudget}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Novo Orçamento
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <h4 className="text-sm font-bold text-white">Nenhum orçamento cadastrado</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Durante a visita técnica, clique no botão acima para montar o orçamento com os produtos e mão de obra e mandar o PDF para o cliente.
              </p>
              <button
                type="button"
                onClick={handleOpenNewBudget}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Criar Primeiro Orçamento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">{b.budgetNumber}</span>
                        {getBudgetStatusBadge(b.status)}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{b.title || 'Proposta de Segurança Eletrônica'}</h4>
                      <p className="text-xs text-slate-400">{b.clientName} • {b.clientPhone}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Valor Total</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        {formatCurrency(b.totalValue)}
                      </span>
                    </div>
                  </div>

                  {/* Actions for this budget */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      Itens: {b.items?.length || 0} produtos/serviços
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSendBudgetWhatsApp(b)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition-colors"
                        title="Enviar PDF no WhatsApp do Cliente"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        PDF no WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadBudget(b)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                        title="Baixar PDF do Orçamento"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingBudget(b);
                          setIsBudgetModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </button>

                      {b.status !== 'convertido_em_os' && onConvertToOS && (
                        <button
                          type="button"
                          onClick={() => onConvertToOS(b)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Gerar O.S
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Budget Modal for Technician */}
      {isBudgetModalOpen && (
        <BudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          onSave={handleSaveBudgetModal}
          onDelete={onDeleteBudget}
          initialData={editingBudget}
          clients={clients}
          products={products}
          services={services}
          existingBudgets={budgets}
        />
      )}
    </div>
  );
};
