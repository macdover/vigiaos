import React, { useState } from 'react';
import { 
  WorkOrder, 
  Technician, 
  CompanySettings 
} from '../types';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  HardHat, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Monitor
} from 'lucide-react';
import { formatDateBR, formatCurrency } from '../utils/storage';

interface DispatchOSModalProps {
  os: WorkOrder;
  technicians: Technician[];
  company?: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchOSModal: React.FC<DispatchOSModalProps> = ({
  os,
  technicians,
  company,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Pre-select assigned technicians, or first technician if none assigned
  const defaultTechId = os.assignedTechnicianIds[0] || (technicians[0]?.id ?? '');
  const [selectedTechId, setSelectedTechId] = useState<string>(defaultTechId);
  const [customNote, setCustomNote] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const selectedTech = technicians.find(t => t.id === selectedTechId) || technicians[0];

  // Build Google Maps Link
  const encodedAddress = encodeURIComponent(os.clientAddress || os.clientName);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  // Build materials list text
  const materialsList = os.items && os.items.length > 0
    ? os.items.map(i => `  • ${i.quantity}x ${i.name}`).join('\n')
    : '  • Conforme vistoria técnica no local';

  // Build complete formatted dispatch message
  const companyName = company?.tradeName || company?.name || 'VigiaOS';
  const dispatchMessage = 
`🚨 *NOVA ORDEM DE SERVIÇO - ${companyName.toUpperCase()}*

📋 *O.S N°:* ${os.osNumber}
⚡ *Prioridade:* ${os.priority.toUpperCase()}
📌 *Tipo:* ${os.type.replace('_', ' ').toUpperCase()}

👤 *CLIENTE:* ${os.clientName}
📞 *Telefone:* ${os.clientPhone || 'Não informado'}
📍 *ENDEREÇO:* ${os.clientAddress}
🗺️ *Link GPS / Rota:* ${mapsLink}

📅 *DATA:* ${formatDateBR(os.scheduledDate)} às ${os.scheduledTime}
👨‍🔧 *TÉCNICO RESPONSÁVEL:* ${selectedTech ? selectedTech.name : 'Equipe Técnica'}

🔧 *ESCOPO DO SERVIÇO:*
${os.description}

📦 *ITENS / MATERIAIS PREVISTOS:*
${materialsList}
${customNote.trim() ? `\n📝 *RECADO DO ESCRITÓRIO:*\n${customNote.trim()}\n` : ''}
💰 *Valor Estimado:* ${formatCurrency(os.totalValue)}

📲 *Abrir e Atualizar O.S no VigiaOS:*
https://vigiaos.com.br

_Mensagem emitida pelo escritório através do VigiaOS._`;

  const cleanPhone = selectedTech?.phone ? selectedTech.phone.replace(/\D/g, '') : '';
  const brazilianPhone = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : '';

  // WhatsApp Web link (ideal for PC desktop / office secretary)
  const whatsAppWebLink = brazilianPhone
    ? `https://web.whatsapp.com/send?phone=${brazilianPhone}&text=${encodeURIComponent(dispatchMessage)}`
    : `https://web.whatsapp.com/send?text=${encodeURIComponent(dispatchMessage)}`;

  // WhatsApp Universal / App link
  const whatsAppAppLink = brazilianPhone
    ? `https://api.whatsapp.com/send?phone=${brazilianPhone}&text=${encodeURIComponent(dispatchMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(dispatchMessage)}`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(dispatchMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = dispatchMessage;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenWhatsAppWeb = () => {
    window.open(whatsAppWebLink, '_blank', 'noopener,noreferrer');
  };

  const handleOpenWhatsAppApp = () => {
    window.open(whatsAppAppLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Encaminhar O.S para Técnico
                </h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  {os.osNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Envio direto via WhatsApp do escritório (PC/Desktop) com rota GPS e dados do atendimento.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Technician selector */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-amber-400" />
              Selecione o Técnico Destinatário *
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} • {t.specialty} ({t.phone || 'Sem telefone'})
                  {os.assignedTechnicianIds.includes(t.id) ? ' [Já atribuído]' : ''}
                </option>
              ))}
            </select>

            {selectedTech && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Phone className="w-3.5 h-3.5" /> WhatsApp: {selectedTech.phone || 'Não cadastrado'}
                </span>
                <span className="text-slate-400">
                  Especialidade: <strong className="text-slate-200">{selectedTech.specialty}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Quick Note from Secretary / Office */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Recado Adicional do Escritório (Opcional):
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex: Pegar controle reserva com a portaria; Cliente pediu para ligar 15min antes..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                Prévia da Mensagem Formatada para o WhatsApp:
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
            </div>

            <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] sm:text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto select-all">
              {dispatchMessage}
            </pre>
          </div>
        </div>

        {/* Modal Footer / Dispatch Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer text-center"
          >
            Fechar
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? 'Copiado para Área de Transferência' : 'Copiar Mensagem'}</span>
            </button>

            {/* WhatsApp Web Button - Optimized for Office PC */}
            <button
              type="button"
              onClick={handleOpenWhatsAppWeb}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              title="Abre o WhatsApp Web no navegador do seu PC com o texto pronto"
            >
              <Monitor className="w-4 h-4" />
              <span>Abrir WhatsApp Web (PC)</span>
            </button>

            {/* WhatsApp App Button */}
            <button
              type="button"
              onClick={handleOpenWhatsAppApp}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
              title="Abre o aplicativo do WhatsApp ou tela de redirecionamento"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
