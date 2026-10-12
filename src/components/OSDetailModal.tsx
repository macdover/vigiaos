import React, { useState } from 'react';
import { 
  WorkOrder, 
  Technician, 
  Client, 
  OSStatus,
  CurrentUser,
  CompanySettings 
} from '../types';
import { 
  X, 
  Printer, 
  Share2, 
  Edit3, 
  MapPin, 
  Phone, 
  Calendar, 
  Wrench, 
  Camera, 
  PenTool, 
  CheckCircle2, 
  HardHat, 
  FileText,
  UserCheck,
  Tag,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Send,
  QrCode
} from 'lucide-react';
import { formatCurrency, formatDateBR, generateWhatsAppLink, getPriorityLabel } from '../utils/storage';
import { PhotoUploader } from './PhotoUploader';
import { SignaturePad } from './SignaturePad';
import { DispatchOSModal } from './DispatchOSModal';

interface OSDetailModalProps {
  os: WorkOrder;
  isOpen: boolean;
  currentUser?: CurrentUser;
  company?: CompanySettings;
  onClose: () => void;
  onEdit: (os: WorkOrder) => void;
  onPrint: (os: WorkOrder) => void;
  onUpdateOS: (updatedOS: WorkOrder) => void;
  onDeleteOS?: (osId: string) => void;
  onOpenBillingModal?: (os: WorkOrder) => void;
  technicians: Technician[];
}

export const OSDetailModal: React.FC<OSDetailModalProps> = ({
  os,
  isOpen,
  currentUser,
  company,
  onClose,
  onEdit,
  onPrint,
  onUpdateOS,
  onDeleteOS,
  onOpenBillingModal,
  technicians,
}) => {
  if (!isOpen) return null;

  const isAdmin = currentUser ? currentUser.role === 'admin' : true;
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showAdminBlockedAlert, setShowAdminBlockedAlert] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  const handleDelete = () => {
    if (!isAdmin) {
      setShowAdminBlockedAlert(true);
      return;
    }
    if (onDeleteOS) {
      onDeleteOS(os.id);
    }
    setShowConfirmDelete(false);
    onClose();
  };

  const assignedTechs = technicians.filter(t => os.assignedTechnicianIds.includes(t.id));

  const handleStatusChange = (newStatus: OSStatus) => {
    onUpdateOS({
      ...os,
      status: newStatus,
      completedAt: newStatus === 'concluida' ? new Date().toISOString() : os.completedAt,
    });
  };

  const handlePhotosChange = (updatedPhotos: WorkOrder['photos']) => {
    onUpdateOS({
      ...os,
      photos: updatedPhotos,
    });
  };

  const handleSaveSignature = (sig: WorkOrder['signature']) => {
    if (!sig) return;
    onUpdateOS({
      ...os,
      signature: sig,
      status: os.status === 'em_andamento' ? 'concluida' : os.status,
      completedAt: os.completedAt || new Date().toISOString(),
    });
    setShowSignaturePad(false);
  };

  const handleSendWhatsApp = () => {
    const text = `*Ordem de Serviço - SegurOS*\n\n` +
      `*O.S:* ${os.osNumber}\n` +
      `*Cliente:* ${os.clientName}\n` +
      `*Endereço:* ${os.clientAddress}\n` +
      `*Data Agendada:* ${formatDateBR(os.scheduledDate)} às ${os.scheduledTime}\n` +
      `*Serviço:* ${os.description}\n` +
      `*Técnicos:* ${assignedTechs.map(t => t.name).join(', ') || 'A definir'}\n` +
      `*Total:* ${formatCurrency(os.totalValue)}\n` +
      `*Status:* ${os.status.toUpperCase()}\n` +
      (os.signature ? `*Assinado por:* ${os.signature.signedBy}\n` : '') +
      `\nSegurança Eletrônica com qualidade e garantia.`;

    const link = generateWhatsAppLink(os.clientPhone, text);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-white">{os.osNumber}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                  {os.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">Criada em {formatDateBR(os.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBillingModal && (
              <button
                type="button"
                onClick={() => onOpenBillingModal(os)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/60 text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer"
                title="Emitir Cobrança Pix & Boleto Bancário para esta O.S"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Cobrar Pix/Boleto</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDispatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer"
              title="Encaminhar esta O.S para o Técnico via WhatsApp (Web/PC)"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Encaminhar p/ Técnico</span>
            </button>

            <button
              type="button"
              onClick={() => onPrint(os)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              title="Imprimir / Salvar PDF"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors shadow"
              title="Compartilhar no WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => { onClose(); onEdit(os); }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              title="Editar O.S"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Status Atual</span>
              <select
                value={os.status}
                onChange={(e) => handleStatusChange(e.target.value as OSStatus)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-1.5 font-semibold"
              >
                <option value="aberta">Aberta</option>
                <option value="em_deslocamento">Em Deslocamento</option>
                <option value="em_andamento">Em Execução</option>
                <option value="aguardando_peca">Aguardando Peça</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Prioridade</span>
              <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase ${
                os.priority === 'urgente' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                os.priority === 'alta' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                os.priority === 'media' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-slate-800 text-slate-300'
              }`}>
                {getPriorityLabel(os.priority)}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Agendamento</span>
              <span className="text-white font-mono font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {formatDateBR(os.scheduledDate)} às {os.scheduledTime}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Valor Total</span>
              <span className="text-cyan-400 font-mono font-bold text-base">
                {formatCurrency(os.totalValue)}
              </span>
            </div>
          </div>

          {/* Client & Assigned Techs Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Card */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400">Dados do Cliente</h4>
              <p className="text-sm font-bold text-white">{os.clientName}</p>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                {os.clientPhone}
              </p>
              <p className="text-xs text-slate-400 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                {os.clientAddress}
              </p>
            </div>

            {/* Assigned Technicians Card */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5 text-cyan-400" />
                Técnicos Atribuídos (Acesso ao Modo Técnico)
              </h4>
              {assignedTechs.length === 0 ? (
                <p className="text-xs text-amber-400">Nenhum técnico marcado para esta O.S ainda.</p>
              ) : (
                <div className="space-y-2">
                  {assignedTechs.map((tech) => (
                    <div key={tech.id} className="flex items-center gap-2.5 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tech.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                        {tech.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{tech.name}</p>
                        <p className="text-[10px] text-slate-400">{tech.phone} • {tech.specialty}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description & Technical Report */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Escopo Solicitado</h4>
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-xs text-slate-200">
                {os.description}
              </div>
            </div>

            {os.technicalReport && (
              <div>
                <h4 className="text-xs font-bold uppercase text-cyan-400 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Relatório Técnico do Atendimento
                </h4>
                <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-800/40 text-xs text-slate-200 leading-relaxed">
                  {os.technicalReport}
                </div>
              </div>
            )}
          </div>

          {/* Items & Materials Table */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Peças e Mão de Obra</h4>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-2">Tipo</th>
                    <th className="py-2 px-2 text-center">Qtd</th>
                    <th className="py-2 px-2 text-right">Unitário</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {os.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3 font-medium text-white">{it.name}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          it.type === 'service' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {it.type === 'service' ? 'Mão de Obra' : 'Produto'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono">{it.quantity}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">{formatCurrency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" />
                Fotos Anexadas ({os.photos.length})
              </h4>
            </div>
            <PhotoUploader
              photos={os.photos}
              onPhotosChange={handlePhotosChange}
            />
          </div>

          {/* Signature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-cyan-400" />
                Assinatura Digital do Cliente
              </h4>
            </div>

            {os.signature ? (
              <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-36 h-16 bg-white rounded border border-slate-700 flex items-center justify-center p-1">
                    <img
                      src={os.signature.dataUrl}
                      alt="Assinatura"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{os.signature.signedBy}</p>
                    {os.signature.signerDocument && (
                      <p className="text-[11px] text-slate-400 font-mono">Doc: {os.signature.signerDocument}</p>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono">Data: {formatDateBR(os.signature.signedAt)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignaturePad(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                >
                  Recoletar Assinatura
                </button>
              </div>
            ) : (
              <div>
                {!showSignaturePad ? (
                  <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400 mb-2">Cliente ainda não assinou esta O.S.</p>
                    <button
                      type="button"
                      onClick={() => setShowSignaturePad(true)}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg"
                    >
                      Assinar Agora com o Dedo
                    </button>
                  </div>
                ) : (
                  <SignaturePad
                    initialSignature={os.signature}
                    clientDefaultName={os.clientName}
                    onSave={handleSaveSignature}
                    onCancel={() => setShowSignaturePad(false)}
                  />
                )}
              </div>
            )}

            {showSignaturePad && os.signature && (
              <div className="mt-3">
                <SignaturePad
                  initialSignature={os.signature}
                  clientDefaultName={os.clientName}
                  onSave={handleSaveSignature}
                  onCancel={() => setShowSignaturePad(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          {onDeleteOS && (
            <button
              type="button"
              onClick={() => {
                if (!isAdmin) {
                  setShowAdminBlockedAlert(true);
                  return;
                }
                setShowConfirmDelete(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isAdmin
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer'
                  : 'text-slate-600 bg-slate-900 opacity-60 cursor-not-allowed'
              }`}
              title={isAdmin ? "Excluir esta Ordem de Serviço (ADM)" : "Apenas o Administrador pode excluir O.S"}
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir O.S (ADM)</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (ADM Only) */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
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
                <span className="font-mono text-cyan-400 font-black text-sm">{os.osNumber}</span>
                <span className="text-white font-mono font-bold">{formatCurrency(os.totalValue)}</span>
              </div>
              <p className="text-slate-200 font-semibold">{os.clientName}</p>
              <p className="text-[11px] text-slate-400 line-clamp-1">{os.description}</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja realmente apagar esta O.S? Todos os dados, histórico de fotos e assinaturas serão removidos definitivamente. Esta ação não pode ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
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
              Apenas usuários com perfil <strong>Administrador (ADM)</strong> podem excluir Ordens de Serviço. Técnicos em campo não têm permissão para deletar atendimentos.
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

      {/* Dispatch OS Modal for Technicians */}
      {showDispatchModal && (
        <DispatchOSModal
          os={os}
          technicians={technicians}
          company={company}
          isOpen={showDispatchModal}
          onClose={() => setShowDispatchModal(false)}
        />
      )}
    </div>
  );
};
