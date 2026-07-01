import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Download, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useTournamentStore } from '../../store/useTournamentStore';

export const ShareButton: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const { generateShareParam, setToast } = useTournamentStore();

  const handleCapture = async () => {
    const element = document.getElementById('bracket-capture-area');
    if (!element) {
      setToast("No se encontró el lienzo para capturar.");
      return;
    }

    setIsGenerating(true);
    setImgUrl(null);
    setShowModal(true);

    try {
      // Temporarily hide UI controls inside capture area if needed, or adjust background
      const dataUrl = await toPng(element, {
        quality: 0.95,
        backgroundColor: useTournamentStore.getState().theme === 'dark' ? '#090d16' : '#f8fafc',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });

      setImgUrl(dataUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      setToast("Error al generar la imagen del cuadro.");
      setShowModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imgUrl) return;
    const link = document.createElement('a');
    link.download = `cuadro-mundial-${useTournamentStore.getState().currentTournamentId}.png`;
    link.href = imgUrl;
    link.click();
    setToast("Imagen descargada exitosamente.");
  };

  const handleNativeShare = async () => {
    if (!imgUrl) return;
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cuadro-mundial.png', { type: blob.type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mi pronóstico del Mundial 2026',
          text: '¡Mira mi pronóstico en el cuadro eliminatorio circular del Mundial!',
          files: [file],
        });
        setToast("Compartido exitosamente.");
      } else {
        handleCopyLink();
      }
    } catch (error) {
      console.error("Error sharing:", error);
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    const param = generateShareParam();
    const url = `${window.location.origin}${window.location.pathname}?share=${param}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setToast("Enlace copiado al portapapeles.");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <button
        onClick={handleCapture}
        aria-label="Compartir y Exportar Cuadro"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium shadow-lg hover:shadow-glow transition-all duration-300 active:scale-95"
      >
        <Share2 className="w-4 h-4" />
        <span>Compartir</span>
      </button>

      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl bg-surface border border-border shadow-2xl flex flex-col items-center gap-6 relative">
            <h3 className="text-xl font-bold text-text-primary">Comparte tu pronóstico</h3>

            <div className="w-full aspect-video rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center relative shadow-inner">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3 text-text-secondary">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  <span className="text-sm font-medium">Generando imagen en alta resolución...</span>
                </div>
              ) : imgUrl ? (
                <img src={imgUrl} alt="Vista previa del cuadro" className="w-full h-full object-contain" />
              ) : (
                <span className="text-sm text-text-muted">No se pudo cargar la imagen</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <button
                onClick={handleDownload}
                disabled={isGenerating || !imgUrl}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-hover hover:bg-border text-text-primary font-medium transition-all duration-200 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PNG</span>
              </button>

              <button
                onClick={handleNativeShare}
                disabled={isGenerating || !imgUrl}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-hover hover:bg-border text-text-primary font-medium transition-all duration-200 disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir App</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition-all duration-200"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
                <span>{copied ? "¡Copiado!" : "Copiar Enlace"}</span>
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-sm p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
