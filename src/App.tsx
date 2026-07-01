import React, { useEffect, useState } from 'react';
import { useTournamentStore } from './store/useTournamentStore';
import { CircularBracket } from './components/Bracket/CircularBracket';
import { Toolbar } from './components/Toolbar/Toolbar';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { DonatePage } from './components/DonatePage/DonatePage';
import { Trophy, Sparkles, Info, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'bracket' | 'donate'>('bracket');
  const {
    currentTournamentId,
    tournaments,
    undoMatch,
    redo,
    loadFromShareParam,
    toastMessage,
  } = useTournamentStore();

  const tournament = tournaments[currentTournamentId];

  // Load from URL share param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      const loaded = loadFromShareParam(shareParam);
      if (loaded && typeof window !== 'undefined' && window.history) {
        // Clean URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [loadFromShareParam]);

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undoMatch();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoMatch, redo]);

  if (currentView === 'donate') {
    return (
      <>
        <DonatePage onBack={() => setCurrentView('bracket')} />
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel bg-surface/95 border border-accent/40 shadow-2xl animate-bounce text-text-primary text-xs sm:text-sm font-medium max-w-md">
            <Info className="w-4 h-4 text-accent shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-background relative select-none font-sans flex flex-col">
      {/* Top Header / Title Bar */}
      <header className="fixed top-4 left-4 z-40 flex items-center gap-3 pointer-events-auto max-w-[80vw] sm:max-w-md">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-lg shadow-accent/20 border border-white/20 shrink-0">
          <Trophy className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm sm:text-base font-extrabold text-text-primary tracking-tight truncate">
              {tournament?.name || 'Mundial 2026'}
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-accent/20 text-accent border border-accent/30 uppercase shrink-0">
              {currentTournamentId.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary hidden sm:flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Haz clic para avanzar • Clic derecho para retroceder</span>
          </p>
        </div>
      </header>

      {/* Theme Toggle Button */}
      <ThemeToggle />

      {/* Main Radial Bracket Viewport */}
      <main className="flex-1 w-full h-full relative">
        <CircularBracket />
      </main>

      {/* Bottom Floating Toolbar */}
      <Toolbar />

      {/* Bottom Left Donate Button */}
      <button
        onClick={() => setCurrentView('donate')}
        aria-label="Donar en criptomonedas"
        className="fixed bottom-6 left-4 sm:left-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-panel bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold shadow-xl hover:shadow-glow transition-all duration-300 active:scale-95 cursor-pointer"
      >
        <Heart className="w-4 h-4 fill-white animate-pulse" />
        <span>Donar</span>
      </button>

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel bg-surface/95 border border-accent/40 shadow-2xl animate-bounce text-text-primary text-xs sm:text-sm font-medium max-w-md">
          <Info className="w-4 h-4 text-accent shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
