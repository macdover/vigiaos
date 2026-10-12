import React from 'react';
import { WorkOrder, CompanySettings, Technician } from '../types';
import { Printer, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDateBR, getPriorityLabel } from '../utils/storage';

interface PrintableOSProps {
  os: WorkOrder;
  company: CompanySettings;
  technicians: Technician[];
  onBack: () => void;
}

export const PrintableOS: React.FC<PrintableOSProps> = ({
  os,
  company,
  technicians,
  onBack,
}) => {
  const assignedTechs = technicians.filter(t => os.assignedTechnicianIds.includes(t.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top action bar (hidden during print) */}
      <div className="print:hidden flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-lg cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4" />
          Imprimir ou Salvar em PDF
        </button>
      </div>

      {/* Printable Sheet (clean high-contrast white paper theme for crisp printing) */}
      <div className="bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 font-sans text-xs sm:text-sm">
        {/* Company Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <div className="h-14 max-w-[160px] p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                <img src={company.logoUrl} alt={company.name} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-7 h-7 text-cyan-400" />
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950">{company.name}</h1>
              <p className="text-[11px] text-slate-600">CNPJ: {company.cnpj} • Tel: {company.phone} / WhatsApp: {company.whatsapp}</p>
              <p className="text-[11px] text-slate-600">{company.address}</p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-300 sm:pl-4">
            <span className="text-[11px] uppercase font-bold text-slate-500 block">Comprovante de Atendimento</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">{os.osNumber}</span>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                os.status === 'concluida' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
              }`}>
                Status: {os.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Client and Service Meta */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Dados do Cliente</h3>
            <p className="font-bold text-slate-900">{os.clientName}</p>
            <p className="text-slate-700">Tel: {os.clientPhone}</p>
            <p className="text-slate-600 text-xs mt-0.5">{os.clientAddress}</p>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Detalhes do Agendamento</h3>
            <p><strong className="text-slate-700">Data / Hora:</strong> {formatDateBR(os.scheduledDate)} às {os.scheduledTime}</p>
            <p><strong className="text-slate-700">Tipo:</strong> {os.type.replace('_', ' ').toUpperCase()}</p>
            <p><strong className="text-slate-700">Prioridade:</strong> {getPriorityLabel(os.priority)}</p>
            <p><strong className="text-slate-700">Técnico(s):</strong> {assignedTechs.map(t => t.name).join(', ') || 'Equipe Técnica'}</p>
          </div>
        </div>

        {/* Scope */}
        <div className="mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Descrição do Serviço / Chamado</h3>
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed text-xs">
            {os.description}
          </div>
        </div>

        {/* Technical Report */}
        {os.technicalReport && (
          <div className="mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 mb-1">Laudo e Parecer Técnico do Especialista</h3>
            <div className="bg-cyan-50/50 p-3 rounded-lg border border-cyan-200 text-slate-900 leading-relaxed text-xs">
              {os.technicalReport}
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Materiais e Mão de Obra</h3>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase">
              <tr>
                <th className="py-2 px-3">Item</th>
                <th className="py-2 px-2">Tipo</th>
                <th className="py-2 px-2 text-center">Qtd</th>
                <th className="py-2 px-2 text-right">Unitário</th>
                <th className="py-2 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {os.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2 px-3 font-semibold text-slate-900">{it.name}</td>
                  <td className="py-2 px-2 text-slate-600">{it.type === 'service' ? 'Serviço' : 'Produto'}</td>
                  <td className="py-2 px-2 text-center font-mono">{it.quantity}</td>
                  <td className="py-2 px-2 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(it.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
              <tr>
                <td colSpan={4} className="py-2 px-3 text-right text-slate-600">Total da Ordem de Serviço:</td>
                <td className="py-2 px-3 text-right font-mono text-sm text-slate-950 font-black">
                  {formatCurrency(os.totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Photos Evidence in Print */}
        {os.photos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Comprovante Fotográfico do Atendimento</h3>
            <div className="grid grid-cols-3 gap-3">
              {os.photos.slice(0, 6).map((photo) => (
                <div key={photo.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <div className="aspect-video overflow-hidden bg-slate-100 flex items-center justify-center">
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-1.5 text-[10px] text-slate-700">
                    <span className="font-semibold uppercase tracking-wider text-[9px] text-cyan-700 block">
                      [{photo.stage}]
                    </span>
                    <p className="truncate font-medium">{photo.caption}</p>
                    <p className="text-slate-400 font-mono text-[9px]">{photo.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures Row */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-200 mt-6">
          {/* Technician Signature */}
          <div className="text-center">
            <div className="h-16 flex items-end justify-center pb-1">
              <span className="text-xs font-serif italic text-slate-600">
                {assignedTechs[0]?.name || 'Técnico Responsável'}
              </span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <p className="font-bold text-slate-900 text-xs">{assignedTechs[0]?.name || 'Técnico Responsável'}</p>
              <p className="text-[10px] text-slate-500">Técnico em Segurança Eletrônica</p>
            </div>
          </div>

          {/* Customer Signature */}
          <div className="text-center">
            <div className="h-16 flex items-center justify-center">
              {os.signature ? (
                <img
                  src={os.signature.dataUrl}
                  alt="Assinatura Cliente"
                  className="max-h-14 max-w-[200px] object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400 italic">Pendente de assinatura</span>
              )}
            </div>
            <div className="border-t border-slate-400 pt-1">
              <p className="font-bold text-slate-900 text-xs">
                {os.signature?.signedBy || os.clientName}
              </p>
              <p className="text-[10px] text-slate-500">
                {os.signature?.signerDocument ? `Doc: ${os.signature.signerDocument} • ` : ''}
                {os.signature?.signedAt ? `Assinado digitalmente em ${formatDateBR(os.signature.signedAt)}` : 'Assinatura do Cliente / Recebedor'}
              </p>
            </div>
          </div>
        </div>

        {/* Terms & Warranty */}
        <div className="mt-6 pt-3 border-t border-slate-200 text-[9px] text-slate-500 leading-tight">
          <p><strong>Termos de Garantia:</strong> {company.warrantyTerms}</p>
          <p className="mt-0.5">Comprovante gerado eletronicamente através do sistema SegurOS com validação digital e carimbo de data/hora.</p>
        </div>
      </div>
    </div>
  );
};
