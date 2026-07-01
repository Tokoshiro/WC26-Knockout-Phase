import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Copy, Check, QrCode, Heart, Sparkles, ShieldCheck, Wallet, ExternalLink } from 'lucide-react';
import { useTournamentStore } from '../../store/useTournamentStore';

interface CryptoAddress {
  network: string;
  address: string;
}

interface CryptoSection {
  id: string;
  name: string;
  symbol: string;
  iconColor: string;
  borderColor: string;
  gradientBg: string;
  addresses: CryptoAddress[];
}

const DONATION_DATA: CryptoSection[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    borderColor: 'hover:border-amber-500/50',
    gradientBg: 'from-amber-500/10 via-transparent to-transparent',
    addresses: [
      { network: 'Bitcoin', address: 'bc1qrn0u8uw2vuxeqqz5pwt0w69469tx5f3e77e6q3' },
      { network: 'BNB (BEP20)', address: '0x6CD92dFBD20a4007F300fB54A32de9aFA5EF1E7B' },
    ],
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    iconColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    borderColor: 'hover:border-indigo-500/50',
    gradientBg: 'from-indigo-500/10 via-transparent to-transparent',
    addresses: [
      { network: 'ETH (ERC20)', address: '0x6CD92dFBD20a4007F300fB54A32de9aFA5EF1E7B' },
      { network: 'BNB (BEP20)', address: '0x6CD92dFBD20a4007F300fB54A32de9aFA5EF1E7B' },
    ],
  },
  {
    id: 'usdt',
    name: 'Tether USD',
    symbol: 'USDT',
    iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    borderColor: 'hover:border-emerald-500/50',
    gradientBg: 'from-emerald-500/10 via-transparent to-transparent',
    addresses: [
      { network: 'BNB (BEP20)', address: '0x6CD92dFBD20a4007F300fB54A32de9aFA5EF1E7B' },
      { network: 'Polygon', address: '0x6CD92dFBD20a4007F300fB54A32de9aFA5EF1E7B' },
      { network: 'Tron (TRC20)', address: 'THyz1xBZsaJbwPHQSiSRsayAJLGpd9jjU4' },
      { network: 'ETH (ERC20)', address: '0x6CD92dFBD20a4007F300fB54A32de9aFA5EF1E7B' },
    ],
  },
];

interface DonatePageProps {
  onBack: () => void;
}

export const DonatePage: React.FC<DonatePageProps> = ({ onBack }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<{ symbol: string; network: string; address: string } | null>(null);
  const { setToast } = useTournamentStore();

  const handleCopy = (address: string, key: string) => {
    navigator.clipboard.writeText(address);
    setCopiedKey(key);
    setToast('¡Dirección copiada al portapapeles!');
    setTimeout(() => {
      if (copiedKey === key) setCopiedKey(null);
    }, 3000);
  };

  return (
    <div className="w-full h-screen bg-background text-text-primary overflow-y-auto relative animate-fadeIn p-4 sm:p-8 md:p-12">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Back Button */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 relative z-10">
        <button
          onClick={onBack}
          aria-label="Volver al Cuadro"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl glass-panel bg-surface hover:bg-surface-hover border border-border text-text-primary font-semibold shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-accent group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Cuadro</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 fill-rose-500 animate-pulse" />
          <span>Apoya el Proyecto</span>
        </div>
      </div>

      {/* Hero Title Section */}
      <div className="max-w-3xl mx-auto text-center mb-12 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-xl shadow-rose-500/20 mb-6 border border-white/20">
          <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary mb-4">
          Donaciones en Criptomonedas
        </h1>
        <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
          Si te ha gustado nuestro pronosticador y gráfico interactivo del Mundial 2026, puedes apoyarnos con una donación en criptomonedas. ¡Tu contribución nos ayuda a mantener y mejorar esta herramienta!
        </p>
      </div>

      {/* Crypto Sections Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mb-16">
        {DONATION_DATA.map((coin) => (
          <div
            key={coin.id}
            className={`glass-panel rounded-3xl p-6 bg-surface/80 border border-border/80 ${coin.borderColor} shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col relative overflow-hidden group`}
          >
            {/* Subtle Gradient Accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${coin.gradientBg} pointer-events-none opacity-60`} />

            {/* Coin Header */}
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-black text-lg ${coin.iconColor} shadow-inner shrink-0`}>
                {coin.symbol}
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">{coin.name}</h3>
                <span className="text-xs font-semibold text-text-muted">{coin.symbol} </span>
              </div>
            </div>

            {/* Addresses List */}
            <div className="flex flex-col gap-4 flex-1 relative z-10">
              {coin.addresses.map((item, idx) => {
                const uniqueKey = `${coin.id}-${item.network}-${idx}`;
                const isCopied = copiedKey === uniqueKey;

                return (
                  <div
                    key={uniqueKey}
                    className="p-3.5 rounded-2xl bg-background/80 border border-border/60 hover:border-border transition-all flex flex-col gap-2.5 group/item"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-accent px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">
                        {item.network}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {/* QR Code Button */}
                        <button
                          onClick={() => setQrModalData({ symbol: coin.symbol, network: item.network, address: item.address })}
                          title="Generar Código QR"
                          className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors border border-border/60 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(item.address, uniqueKey)}
                          title="Copiar dirección"
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isCopied
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                              : 'bg-surface hover:bg-surface-hover text-text-primary border border-border/60 hover:border-accent/40'
                            }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 animate-bounce" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Monospaced Address */}
                    <div
                      onClick={() => handleCopy(item.address, uniqueKey)}
                      title="Haz clic para copiar"
                      className="font-mono text-[11px] sm:text-xs text-text-secondary break-all bg-surface/50 p-2 rounded-xl border border-border/40 select-all cursor-pointer hover:text-text-primary transition-colors"
                    >
                      {item.address}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="max-w-xl mx-auto text-center relative z-10 pb-8 flex items-center justify-center gap-2 text-xs text-text-muted">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Verifica siempre la red (Network) antes de realizar cualquier transferencia de criptomonedas.</span>
      </div>

      {/* QR Code Modal (Portal to escape any container overflow) */}
      {qrModalData && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl bg-surface border border-border shadow-2xl flex flex-col items-center text-center relative animate-scaleUp">
            <button
              onClick={() => setQrModalData(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-sm p-2 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-4">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-text-primary mb-1">
              {qrModalData.symbol} ({qrModalData.network})
            </h3>
            <p className="text-xs text-text-secondary mb-6">
              Escanea con tu billetera cripto para donar
            </p>

            {/* QR Code Image */}
            <div className="p-4 rounded-2xl bg-white shadow-xl mb-6 border border-border/40">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=000000&bgcolor=ffffff&data=${encodeURIComponent(qrModalData.address)}`}
                alt={`QR Code para ${qrModalData.symbol}`}
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>

            <div className="w-full bg-background/80 p-3 rounded-xl border border-border/60 font-mono text-xs text-text-secondary break-all mb-6 select-all">
              {qrModalData.address}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(qrModalData.address);
                setToast('¡Dirección copiada al portapapeles!');
              }}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar Dirección</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
