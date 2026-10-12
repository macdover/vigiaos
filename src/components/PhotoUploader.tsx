import React, { useState, useRef } from 'react';
import { Camera, ImagePlus, Trash2, Maximize2, X, Tag } from 'lucide-react';
import { OSPhoto } from '../types';
import { compressImage } from '../utils/storage';

interface PhotoUploaderProps {
  photos: OSPhoto[];
  onPhotosChange: (updatedPhotos: OSPhoto[]) => void;
  disabled?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onPhotosChange,
  disabled = false,
}) => {
  const [stage, setStage] = useState<'antes' | 'durante' | 'depois' | 'equipamento'>('antes');
  const [caption, setCaption] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<OSPhoto | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleCameraClick = () => {
    const isTouchMobile = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
    if (isTouchMobile && cameraInputRef.current) {
      cameraInputRef.current.click();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFileList = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const newPhotos: OSPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const compressedBase64 = await compressImage(file, 1200, 0.75);
        
        const now = new Date();
        const dateFormatted = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          dataUrl: compressedBase64,
          caption: caption.trim() || (stage === 'antes' ? 'Foto Inicial / Problema' : stage === 'depois' ? 'Serviço Finalizado' : 'Equipamento / Instalação'),
          timestamp: dateFormatted,
          stage,
        });
      }

      onPhotosChange([...photos, ...newPhotos]);
      setCaption('');
    } catch (err) {
      console.error('Falha ao processar fotos', err);
      alert('Houve um erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFileList(e.target.files);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (disabled || isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  const removePhoto = (photoId: string) => {
    if (disabled) return;
    onPhotosChange(photos.filter(p => p.id !== photoId));
    if (previewPhoto?.id === photoId) setPreviewPhoto(null);
  };

  const getStageBadge = (stg: OSPhoto['stage']) => {
    switch (stg) {
      case 'antes':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium">Antes</span>;
      case 'durante':
        return <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium">Durante</span>;
      case 'depois':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium">Depois</span>;
      case 'equipamento':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium">Equipamento</span>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Controls for technician / secretary */}
      {!disabled && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`bg-slate-900 border rounded-xl p-3 sm:p-4 space-y-3 transition-colors ${
            isDraggingOver ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-700/80'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                Etapa da Foto:
              </span>
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                {(['antes', 'durante', 'depois', 'equipamento'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                      stage === s
                        ? 'bg-cyan-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Arraste fotos do computador ou selecione abaixo
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Legenda ou detalhe (ex: Conector oxidado, Câmera instalada...)"
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            {/* Hidden file inputs: one for direct camera, one for gallery */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCameraClick}
                disabled={isProcessing}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{isProcessing ? 'Gravando...' : 'Câmera / Arquivo'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <ImagePlus className="w-4 h-4 text-cyan-400" />
                <span>Galeria / PC</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500 text-xs">
          <Camera className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
          Nenhuma foto anexada a esta Ordem de Serviço ainda.
          {!disabled && <p className="text-slate-400 mt-1">Use a câmera do celular para registrar o antes e depois do serviço.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col shadow transition-all hover:border-slate-700"
            >
              <div className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto(photo)}>
                <img
                  src={photo.dataUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1.5 left-1.5">
                  {getStageBadge(photo.stage)}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewPhoto(photo);
                    }}
                    className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-colors"
                    title="Ampliar foto"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(photo.id);
                      }}
                      className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors"
                      title="Excluir foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-2 flex flex-col justify-between flex-1">
                <p className="text-[11px] font-medium text-slate-200 line-clamp-2" title={photo.caption}>
                  {photo.caption}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  {photo.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Modal for enlarged photo */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {getStageBadge(previewPhoto.stage)}
                <span className="text-sm font-semibold text-white truncate">{previewPhoto.caption}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-2 bg-black/60 flex items-center justify-center min-h-[300px]">
              <img
                src={previewPhoto.dataUrl}
                alt={previewPhoto.caption}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Registrado em: <strong className="text-slate-200 font-mono">{previewPhoto.timestamp}</strong></span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(previewPhoto.id)}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-medium px-2 py-1 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Foto
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
