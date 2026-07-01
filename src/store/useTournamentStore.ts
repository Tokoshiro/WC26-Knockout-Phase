import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Country, Match, Tournament, TournamentState } from '../types/tournament';
import wc2026Data from '../data/tournaments/wc2026.json';
import wc2022Data from '../data/tournaments/wc2022.json';
import { decodeShareState, encodeShareState } from '../utils/urlShare';

const initialTournaments: Record<string, Tournament> = {
  wc2026: wc2026Data as Tournament,
  wc2022: wc2022Data as Tournament,
};

interface TournamentStore extends TournamentState {
  toastMessage: string | null;
  setToast: (msg: string | null) => void;
  undoLastAction: () => boolean;
  undoMatchResult: (matchId: number, targetCountryId?: string) => boolean;
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      currentTournamentId: 'wc2026',
      tournaments: JSON.parse(JSON.stringify(initialTournaments)),
      history: [],
      historyIndex: -1,
      theme: 'dark',
      isFullscreen: false,
      toastMessage: null,

      setToast: (msg) => {
        set({ toastMessage: msg });
        if (msg) {
          setTimeout(() => {
            if (get().toastMessage === msg) {
              set({ toastMessage: null });
            }
          }, 3500);
        }
      },

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(nextTheme);
      },

      toggleFullscreen: () => {
        if (typeof document === 'undefined') return;
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error("Error attempting to enable fullscreen:", err);
          });
          set({ isFullscreen: true });
        } else {
          document.exitFullscreen().catch((err) => {
            console.error("Error attempting to exit fullscreen:", err);
          });
          set({ isFullscreen: false });
        }
      },

      selectWinner: (matchId: number, country: Country) => {
        const { currentTournamentId, tournaments, history, historyIndex, setToast } = get();
        const tournament = tournaments[currentTournamentId];
        if (!tournament) return false;

        const matchIndex = tournament.matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return false;

        const match = tournament.matches[matchIndex];

        // Check if locked
        if (match.locked) {
          setToast("Este encuentro está bloqueado por configuración inicial.");
          return false;
        }

        // Check if both rival teams are present (Un país no puede avanzar a la siguiente fase si no deja atrás a otro)
        if (!match.left || !match.right) {
          setToast("Un país no puede avanzar a la siguiente fase si no deja atrás a otro equipo en su partido.");
          return false;
        }

        // Check if isBaseState immutable
        if (match.isBaseState && match.winner && match.winner.id !== country.id) {
          setToast("Este partido es parte del estado inicial fijo y no se puede modificar.");
          return false;
        }

        // Check if already advanced to subsequent round that is already played
        if (match.nextMatchId !== null) {
          const nextMatch = tournament.matches.find((m) => m.id === match.nextMatchId);
          if (nextMatch && nextMatch.winner !== null) {
            setToast("Este encuentro ya fue definido porque afecta partidos posteriores.");
            return false;
          }
        }

        // If clicking the same team that is already winner, do nothing
        if (match.winner?.id === country.id) {
          return true;
        }

        const previousWinner = match.winner ? { ...match.winner } : null;
        const newWinner = { ...country };

        // Create deep copy of tournaments to modify
        const updatedTournaments = JSON.parse(JSON.stringify(tournaments));
        const currentMatches = updatedTournaments[currentTournamentId].matches;
        const targetMatch = currentMatches[matchIndex];

        targetMatch.winner = newWinner;

        // Propagate to next match slot
        const affectedMatches: { matchId: number; previousWinner: Country | null; previousLeft: Country | null; previousRight: Country | null }[] = [];
        
        if (targetMatch.nextMatchId !== null && targetMatch.nextSlot !== null) {
          const nextIndex = currentMatches.findIndex((m: Match) => m.id === targetMatch.nextMatchId);
          if (nextIndex !== -1) {
            const nextMatchObj = currentMatches[nextIndex];
            affectedMatches.push({
              matchId: nextMatchObj.id,
              previousWinner: nextMatchObj.winner ? { ...nextMatchObj.winner } : null,
              previousLeft: nextMatchObj.left ? { ...nextMatchObj.left } : null,
              previousRight: nextMatchObj.right ? { ...nextMatchObj.right } : null,
            });

            if (targetMatch.nextSlot === 'left') {
              nextMatchObj.left = newWinner;
            } else if (targetMatch.nextSlot === 'right') {
              nextMatchObj.right = newWinner;
            }
          }
        }

        // Push to history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({
          matchId,
          previousWinner,
          newWinner,
          affectedMatches,
        });

        set({
          tournaments: updatedTournaments,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });

        return true;
      },

      undoMatchResult: (matchId: number, targetCountryId?: string) => {
        const { currentTournamentId, tournaments, history, historyIndex, setToast } = get();
        const tournament = tournaments[currentTournamentId];
        if (!tournament) return false;

        const match = tournament.matches.find((m) => m.id === matchId);
        if (!match) return false;

        // If match has a winner, we want to undo THIS match
        if (match.winner !== null) {
          // Check if isBaseState immutable
          if (match.isBaseState) {
            setToast("Este avance es parte del estado inicial fijo y no se puede retroceder.");
            return false;
          }

          // If a country ID was specified, only undo if that country is the winner
          if (targetCountryId && match.winner.id !== targetCountryId) {
            return false;
          }

          if (match.nextMatchId !== null) {
            const nextMatch = tournament.matches.find((m) => m.id === match.nextMatchId);
            if (nextMatch && nextMatch.winner !== null) {
              setToast("No se puede retroceder este partido porque ya afecta encuentros posteriores definidos.");
              return false;
            }
          }

          // We can undo this match
          const updatedTournaments = JSON.parse(JSON.stringify(tournaments));
          const currentMatches = updatedTournaments[currentTournamentId].matches;
          const targetMatch = currentMatches.find((m: Match) => m.id === matchId);

          const previousWinner = targetMatch.winner;
          targetMatch.winner = null;

          if (targetMatch.nextMatchId !== null && targetMatch.nextSlot !== null) {
            const nextMatchObj = currentMatches.find((m: Match) => m.id === targetMatch.nextMatchId);
            if (nextMatchObj) {
              if (targetMatch.nextSlot === 'left') {
                nextMatchObj.left = null;
              } else if (targetMatch.nextSlot === 'right') {
                nextMatchObj.right = null;
              }
            }
          }

          // Record action in history
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push({
            matchId,
            previousWinner,
            newWinner: null,
            affectedMatches: [],
          });

          set({
            tournaments: updatedTournaments,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          });

          setToast("Partido regresado una ronda atrás.");
          return true;
        } else {
          // If match.winner is null, maybe the user right clicked on a team sitting in this match!
          // Find the feeder match that brought this team here
          if (!targetCountryId) return false;
          const feederMatch = tournament.matches.find(
            (m) => m.nextMatchId === matchId && m.winner?.id === targetCountryId
          );
          if (feederMatch) {
            return get().undoMatchResult(feederMatch.id);
          }
        }

        return false;
      },

      undoMatch: (matchId?: number) => {
        if (typeof matchId === 'number') {
          return get().undoMatchResult(matchId);
        }
        return get().undoLastAction();
      },

      undoLastAction: () => {
        const { currentTournamentId, tournaments, history, historyIndex, setToast } = get();
        if (historyIndex < 0) {
          setToast("No hay más acciones para deshacer.");
          return false;
        }

        const action = history[historyIndex];
        const updatedTournaments = JSON.parse(JSON.stringify(tournaments));
        const currentMatches = updatedTournaments[currentTournamentId].matches;
        
        const match = currentMatches.find((m: Match) => m.id === action.matchId);
        if (match) {
          match.winner = action.previousWinner;
        }

        // Restore affected slots
        action.affectedMatches.forEach((affected) => {
          const affMatch = currentMatches.find((m: Match) => m.id === affected.matchId);
          if (affMatch) {
            affMatch.winner = affected.previousWinner;
            affMatch.left = affected.previousLeft;
            affMatch.right = affected.previousRight;
          }
        });

        set({
          tournaments: updatedTournaments,
          historyIndex: historyIndex - 1,
        });

        return true;
      },

      redo: () => {
        const { currentTournamentId, tournaments, history, historyIndex, setToast } = get();
        if (historyIndex >= history.length - 1) {
          setToast("No hay más acciones para rehacer.");
          return false;
        }

        const nextIndex = historyIndex + 1;
        const action = history[nextIndex];
        const updatedTournaments = JSON.parse(JSON.stringify(tournaments));
        const currentMatches = updatedTournaments[currentTournamentId].matches;
        
        const match = currentMatches.find((m: Match) => m.id === action.matchId);
        if (match) {
          match.winner = action.newWinner;
          if (match.nextMatchId !== null && match.nextSlot !== null) {
            const nextMatch = currentMatches.find((m: Match) => m.id === match.nextMatchId);
            if (nextMatch) {
              if (match.nextSlot === 'left') {
                nextMatch.left = action.newWinner;
              } else if (match.nextSlot === 'right') {
                nextMatch.right = action.newWinner;
              }
            }
          }
        }

        set({
          tournaments: updatedTournaments,
          historyIndex: nextIndex,
        });

        return true;
      },

      resetTournament: () => {
        const { currentTournamentId, tournaments, setToast } = get();
        const initialTournamentData = initialTournaments[currentTournamentId];
        if (!initialTournamentData) return;

        const updatedTournaments = JSON.parse(JSON.stringify(tournaments));
        updatedTournaments[currentTournamentId] = JSON.parse(JSON.stringify(initialTournamentData));

        set({
          tournaments: updatedTournaments,
          history: [],
          historyIndex: -1,
        });
        setToast("Torneo reiniciado al estado inicial.");
      },

      loadTournament: (tournamentId: string) => {
        if (!initialTournaments[tournamentId] && !get().tournaments[tournamentId]) return;
        set({
          currentTournamentId: tournamentId,
          history: [],
          historyIndex: -1,
        });
        get().setToast(`Torneo cambiado a: ${initialTournaments[tournamentId]?.name || tournamentId}`);
      },

      importState: (jsonString: string) => {
        try {
          const data = JSON.parse(jsonString);
          if (data && typeof data === 'object' && data.tournaments && data.currentTournamentId) {
            set({
              tournaments: data.tournaments,
              currentTournamentId: data.currentTournamentId,
              history: [],
              historyIndex: -1,
            });
            get().setToast("Torneo importado exitosamente.");
            return true;
          }
        } catch (e) {
          console.error("Error importing state:", e);
        }
        get().setToast("Error al importar el archivo JSON.");
        return false;
      },

      exportState: () => {
        const { tournaments, currentTournamentId } = get();
        return JSON.stringify({ tournaments, currentTournamentId }, null, 2);
      },

      generateShareParam: () => {
        const { currentTournamentId, tournaments } = get();
        const tournament = tournaments[currentTournamentId];
        if (!tournament) return "";
        return encodeShareState(currentTournamentId, tournament.matches);
      },

      loadFromShareParam: (shareData: string) => {
        const payload = decodeShareState(shareData);
        if (!payload) {
          get().setToast("Enlace de compartir inválido o corrupto.");
          return false;
        }

        const { t, w } = payload;
        const baseTournament = initialTournaments[t] || initialTournaments['wc2026'];
        if (!baseTournament) return false;

        // Reset to initial and apply winners sequentially
        const updatedTournaments = JSON.parse(JSON.stringify(get().tournaments));
        const targetTournament = JSON.parse(JSON.stringify(baseTournament)) as Tournament;

        // Apply winners round by round to maintain consistency
        for (let r = 1; r <= targetTournament.totalRounds; r++) {
          const roundMatches = targetTournament.matches.filter((m) => m.round === r);
          roundMatches.forEach((match) => {
            const winnerId = w[match.id];
            if (winnerId) {
              const winnerCountry = [match.left, match.right].find((c) => c && c.id === winnerId);
              if (winnerCountry) {
                match.winner = { ...winnerCountry };
                if (match.nextMatchId !== null && match.nextSlot !== null) {
                  const nextMatch = targetTournament.matches.find((m) => m.id === match.nextMatchId);
                  if (nextMatch) {
                    if (match.nextSlot === 'left') {
                      nextMatch.left = { ...winnerCountry };
                    } else if (match.nextSlot === 'right') {
                      nextMatch.right = { ...winnerCountry };
                    }
                  }
                }
              }
            }
          });
        }

        updatedTournaments[t] = targetTournament;
        set({
          tournaments: updatedTournaments,
          currentTournamentId: t,
          history: [],
          historyIndex: -1,
        });
        get().setToast("Cuadro cargado exitosamente desde enlace compartido.");
        return true;
      },
    }),
    {
      name: 'wc2026-tournament-storage-v4',
      partialize: (state) => ({
        tournaments: state.tournaments,
        currentTournamentId: state.currentTournamentId,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.theme) {
          if (typeof document !== 'undefined') {
            if (state.theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        }
      },
    }
  )
);
