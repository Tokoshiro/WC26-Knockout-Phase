import React from 'react';
import { RotateCcw, RotateCw, RefreshCw, Maximize, Minimize, Trophy } from 'lucide-react';
import { useTournamentStore } from '../../store/useTournamentStore';
import { ShareButton } from '../ShareButton/ShareButton';

export const Toolbar: React.FC = () => {
  const {
    history,
    historyIndex,
    isFullscreen,
    undoMatch,
    redo,
    resetTournament,
    toggleFullscreen,
  } = useTournamentStore();

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 p-2 rounded-2xl glass-panel shadow-2xl border border-border/80 bg-surface/90 backdrop-blur-lg max-w-[95vw] overflow-x-auto">
      {/* Tournament Label */}
      <div className="flex items-center pl-3 pr-3 border-r border-border select-none">
        <Trophy className="w-4 h-4 text-gold mr-2 shrink-0" />
        <span className="text-text-primary text-xs sm:text-sm font-bold">Mundial 2026</span>
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-1 border-r border-border pr-2">
        <button
          onClick={() => undoMatch()}
          disabled={!canUndo}
          aria-label="Deshacer acción (Ctrl+Z)"
          title="Deshacer última acción (Ctrl+Z)"
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          aria-label="Rehacer acción (Ctrl+Shift+Z)"
          title="Rehacer última acción (Ctrl+Shift+Z)"
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Required Button: Reiniciar */}
      <button
        onClick={resetTournament}
        aria-label="Reiniciar Cuadro"
        title="Restaurar al estado inicial fijo"
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-sm transition-all duration-200 active:scale-95 border border-rose-500/30"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Reiniciar</span>
      </button>

      {/* Main Required Button: Compartir */}
      <ShareButton />

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        aria-label="Pantalla Completa"
        title="Pantalla Completa"
        className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all active:scale-95 hidden sm:flex items-center justify-center"
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>
    </div>
  );
};
