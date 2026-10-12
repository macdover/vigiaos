import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool, ShieldCheck, Monitor } from 'lucide-react';
import { OSSignature } from '../types';

interface SignaturePadProps {
  initialSignature?: OSSignature;
  onSave: (signature: OSSignature) => void;
  onCancel?: () => void;
  clientDefaultName?: string;
  clientDefaultDoc?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  initialSignature,
  onSave,
  onCancel,
  clientDefaultName = '',
  clientDefaultDoc = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(initialSignature?.signedBy || clientDefaultName);
  const [signerDoc, setSignerDoc] = useState(initialSignature?.signerDocument || clientDefaultDoc);
  const [inkColor, setInkColor] = useState<'blue' | 'black'>('blue');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 180;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = inkColor === 'blue' ? '#0369a1' : '#111827';

    // If initial signature exists, draw it
    if (initialSignature?.dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasDrawn(true);
      };
      img.src = initialSignature.dataUrl;
    }
  }, [inkColor, initialSignature]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = inkColor === 'blue' ? '#0369a1' : '#111827';
    ctx.lineWidth = 2.5;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleRemoteApproval = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 180;

    ctx.clearRect(0, 0, width, height);

    // Draw official seal box
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('✓ APROVAÇÃO DIGITAL REGISTRADA', 24, 45);

    ctx.fillStyle = '#334155';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Responsável: ${signerName.trim() || clientDefaultName || 'Cliente'}`, 24, 75);
    ctx.fillText(`Documento: ${signerDoc.trim() || clientDefaultDoc || 'Autorizado via WhatsApp/Telefone'}`, 24, 98);
    ctx.fillText(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`, 24, 120);

    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 10px sans-serif';
    ctx.fillText('Autenticação Eletrônica VigiaOS Desktop', 24, 145);

    setHasDrawn(true);
    if (!signerName.trim() && clientDefaultName) {
      setSignerName(clientDefaultName);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const dataUrl = canvas.toDataURL('image/png');
    const now = new Date().toISOString();

    onSave({
      dataUrl,
      signedBy: signerName.trim() || 'Cliente / Responsável',
      signerDocument: signerDoc.trim(),
      signedAt: now,
    });
  };

  return (
    <div id="signature-pad-container" className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-5 text-slate-100 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-100">Assinatura Digital / Aceite do Cliente</h4>
            <p className="text-xs text-slate-400">Assine com o mouse, trackpad, dedo ou caneta na tela</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick desktop remote approval button */}
          <button
            type="button"
            onClick={handleRemoteApproval}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Gera carimbo de aprovação remota via WhatsApp/Telefone para o computador"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Carimbo Aprovação Remota</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setInkColor('blue')}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                inkColor === 'blue' ? 'border-white scale-110' : 'border-transparent opacity-60'
              } bg-sky-500`}
              title="Tinta Azul"
            />
            <button
              type="button"
              onClick={() => setInkColor('black')}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                inkColor === 'black' ? 'border-white scale-110' : 'border-transparent opacity-60'
              } bg-slate-900 border-slate-400`}
              title="Tinta Preta"
            />
          </div>
        </div>
      </div>

      {/* Signature Canvas Box */}
      <div className="relative w-full bg-white rounded-lg border-2 border-dashed border-slate-300 overflow-hidden touch-none shadow-inner mb-3">
        <canvas
          ref={canvasRef}
          className="w-full h-44 sm:h-52 cursor-crosshair block"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          style={{ touchAction: 'none' }}
        />

        {/* Signature Line Guideline */}
        <div className="pointer-events-none absolute bottom-8 left-8 right-8 border-b border-slate-300 flex justify-between items-end pb-1 text-[11px] text-slate-400 select-none">
          <span>✕ Assine sobre esta linha (Mouse ou Touch)</span>
          <span>Pronto para PC e Celular</span>
        </div>

        {!hasDrawn && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400 text-xs sm:text-sm font-medium">
            Clique e arraste com o mouse no PC ou assine com o dedo no celular
          </div>
        )}
      </div>

      {/* Signer inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Nome Completo do Signatário *
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Ex: Carlos Roberto (Síndico)"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            CPF, RG ou Cargo do Responsável
          </label>
          <input
            type="text"
            value={signerDoc}
            onChange={(e) => setSignerDoc(e.target.value)}
            placeholder="Ex: 123.456.789-00 ou Síndico"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="text-[11px] text-slate-400 mb-4 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
        O signatário declara que os serviços e materiais descritos nesta Ordem de Serviço foram conferidos e aceitos em perfeito estado de funcionamento.
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar Assinatura
        </button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn || !signerName.trim()}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow transition-all ${
              hasDrawn && signerName.trim()
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Check className="w-4 h-4" />
            Salvar Assinatura
          </button>
        </div>
      </div>
    </div>
  );
};
