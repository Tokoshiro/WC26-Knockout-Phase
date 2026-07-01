import { describe, it, expect, beforeEach } from 'vitest';
import { useTournamentStore } from '../store/useTournamentStore';

describe('useTournamentStore - Tournament Logic & Rules', () => {
  beforeEach(() => {
    useTournamentStore.getState().resetTournament();
  });

  it('should NOT allow undoing or modifying pre-advanced base state matches (Brasil, Noruega, México, Marruecos, Francia, Paraguay, Inglaterra)', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];
    const match1 = tournament.matches.find((m) => m.id === 1)!; // Paraguay vs Alemania
    const alemania = match1.right!;

    expect(match1.isBaseState).toBe(true);
    expect(match1.winner?.id).toBe('py');
    expect(tournament.matches.find((m) => m.id === 12)!.isBaseState).toBe(true);
    expect(tournament.matches.find((m) => m.id === 12)!.winner?.id).toBe('gb-eng');

    // 1. Attempt to undo match 1 (should fail)
    const undoSuccess = store.undoMatchResult(1);
    expect(undoSuccess).toBe(false);

    // 2. Attempt to change winner to Alemania (should fail)
    const changeSuccess = store.selectWinner(1, alemania);
    expect(changeSuccess).toBe(false);

    // Verify Paraguay is still the winner in Octavos (Match 17 left)
    const afterAttempt = useTournamentStore.getState().tournaments['wc2026'];
    expect(afterAttempt.matches.find((m) => m.id === 1)!.winner?.id).toBe('py');
    expect(afterAttempt.matches.find((m) => m.id === 17)!.left?.id).toBe('py');
  });

  it('should select a winner in an undecided match and advance them to the next match slot', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];
    const match5 = tournament.matches.find((m) => m.id === 5)!; // Croacia vs Portugal
    const croacia = match5.left!;

    expect(match5.winner).toBeNull();
    
    // Select Croacia as winner of Match 5
    const success = store.selectWinner(5, croacia);
    expect(success).toBe(true);

    const updatedTournament = useTournamentStore.getState().tournaments['wc2026'];
    const updatedMatch5 = updatedTournament.matches.find((m) => m.id === 5)!;
    const nextMatch19 = updatedTournament.matches.find((m) => m.id === 19)!;

    expect(updatedMatch5.winner?.id).toBe('hr');
    expect(nextMatch19.left?.id).toBe('hr');
  });

  it('should NOT allow a country to advance to the next phase if it does not leave an opponent behind (both left and right must be present)', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];
    
    // Advance Croacia from Match 5 so Match 19 has left = Croacia, but right = null
    const match5 = tournament.matches.find((m) => m.id === 5)!;
    store.selectWinner(5, match5.left!);

    const match19 = useTournamentStore.getState().tournaments['wc2026'].matches.find((m) => m.id === 19)!;
    expect(match19.left?.id).toBe('hr');
    expect(match19.right).toBeNull();

    // Attempt to advance Croacia from Match 19 when right opponent is null
    const advanceSuccess = store.selectWinner(19, match19.left!);
    expect(advanceSuccess).toBe(false); // MUST BE FALSE! Cannot advance without leaving behind another team

    // Verify Match 19 winner is still null
    const afterAttempt = useTournamentStore.getState().tournaments['wc2026'];
    expect(afterAttempt.matches.find((m) => m.id === 19)!.winner).toBeNull();
  });

  it('should allow advancing to next phase once BOTH opponent teams are defined in the match', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];
    
    // Match 17 already has Paraguay (left) and Francia (right) from base state!
    const match17 = tournament.matches.find((m) => m.id === 17)!;
    expect(match17.left?.id).toBe('py');
    expect(match17.right?.id).toBe('fr');

    // Now Paraguay CAN advance from Octavos because both rival teams are present!
    const advanceSuccess = store.selectWinner(17, match17.left!);
    expect(advanceSuccess).toBe(true);

    const afterR2 = useTournamentStore.getState().tournaments['wc2026'];
    expect(afterR2.matches.find((m) => m.id === 17)!.winner?.id).toBe('py');
    expect(afterR2.matches.find((m) => m.id === 25)!.left?.id).toBe('py');
  });

  it('should allow undoing a regular match result via right click (undoMatchResult) only if it does not affect future defined matches', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];
    const match5 = tournament.matches.find((m) => m.id === 5)!; // Croacia vs Portugal
    const croacia = match5.left!;

    store.selectWinner(5, croacia);
    expect(useTournamentStore.getState().tournaments['wc2026'].matches.find((m) => m.id === 5)!.winner?.id).toBe('hr');

    // Undo Match 5
    const undoSuccess = store.undoMatchResult(5);
    expect(undoSuccess).toBe(true);
    
    const afterUndo = useTournamentStore.getState().tournaments['wc2026'];
    expect(afterUndo.matches.find((m) => m.id === 5)!.winner).toBeNull();
    expect(afterUndo.matches.find((m) => m.id === 19)!.left).toBeNull();
  });

  it('should NOT allow undoing a match if it already affected a subsequent completed match', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];
    const match17 = tournament.matches.find((m) => m.id === 17)!; // Paraguay vs Francia
    const paraguay = match17.left!;

    store.selectWinner(17, paraguay); // Paraguay wins Match 17 -> advances to Match 25
    expect(useTournamentStore.getState().tournaments['wc2026'].matches.find((m) => m.id === 17)!.winner?.id).toBe('py');

    // Attempt to undo Match 17 after another hypothetical advance would fail, or check that match 1 (base state) cannot be undone even if match 17 has no winner
    const undoBase = store.undoMatchResult(1);
    expect(undoBase).toBe(false);
  });
});
