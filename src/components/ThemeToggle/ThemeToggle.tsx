import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTournamentStore } from '../../store/useTournamentStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTournamentStore();

  return (
    <div className="fixed top-20 right-4 z-50 flex items-center gap-2 sm:top-4">
      <button
        onClick={toggleTheme}
        aria-label="Cambiar tema (Claro / Oscuro)"
        className="glass-panel p-3 rounded-full hover:scale-110 active:scale-95 transition-all duration-300 shadow-xl group border border-border/80 bg-surface/90 hover:bg-surface hover:border-accent/50 text-text-primary"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Sun
            className={`w-6 h-6 text-amber-400 absolute transition-all duration-500 transform ${
              theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
            }`}
          />
          <Moon
            className={`w-6 h-6 text-sky-400 absolute transition-all duration-500 transform ${
              theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
            }`}
          />
        </div>
      </button>
    </div>
  );
};
