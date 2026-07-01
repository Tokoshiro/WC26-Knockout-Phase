export interface Country {
  id: string;
  name: string;
  code: string; // ISO code or flag identifier
  flagUrl: string;
}

export interface Match {
  id: number;
  left: Country | null;
  right: Country | null;
  winner: Country | null;
  nextMatchId: number | null;
  nextSlot: 'left' | 'right' | null;
  round: number; // 1: Round of 32, 2: Round of 16, 3: Quarter-finals, 4: Semi-finals, 5: Final
  side: 'left' | 'right' | 'center';
  isBaseState?: boolean; // If true, this match's initial winner is part of the fixed immutable start state
  locked?: boolean;
  label?: string;
}

export interface Tournament {
  id: string;
  name: string;
  year: number;
  description: string;
  totalRounds: number;
  matches: Match[];
}

export interface HistoryAction {
  matchId: number;
  previousWinner: Country | null;
  newWinner: Country | null;
  affectedMatches: {
    matchId: number;
    previousWinner: Country | null;
    previousLeft: Country | null;
    previousRight: Country | null;
  }[];
}

export interface TournamentState {
  currentTournamentId: string;
  tournaments: Record<string, Tournament>;
  history: HistoryAction[];
  historyIndex: number;
  theme: 'dark' | 'light';
  isFullscreen: boolean;
  
  // Actions
  selectWinner: (matchId: number, country: Country) => boolean;
  undoMatch: (matchId?: number) => boolean;
  redo: () => boolean;
  resetTournament: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  toggleFullscreen: () => void;
  loadTournament: (tournamentId: string) => void;
  importState: (jsonString: string) => boolean;
  exportState: () => string;
  loadFromShareParam: (shareData: string) => boolean;
  generateShareParam: () => string;
}
