import { describe, it, expect, beforeEach } from 'vitest';
import { useTournamentStore } from '../store/useTournamentStore';

describe('useTournamentStore - Tournament Logic & Rules', () => {
  beforeEach(() => {
    useTournamentStore.getState().resetTournament();
  });

  it('should advance the specified teams to the next phase in the initial bracket', () => {
    const tournament = useTournamentStore.getState().tournaments['wc2026'];

    const match19 = tournament.matches.find((m) => m.id === 19)!; // Portugal vs España
    const match20 = tournament.matches.find((m) => m.id === 20)!; // Estados Unidos vs Bélgica
    const match22 = tournament.matches.find((m) => m.id === 22)!; // México vs Inglaterra
    const match23 = tournament.matches.find((m) => m.id === 23)!; // Argentina vs Egipto
    const match24 = tournament.matches.find((m) => m.id === 24)!; // Suiza vs Colombia

    expect(match19.winner?.id).toBe('es');
    expect(match20.winner?.id).toBe('be');
    expect(match22.winner?.id).toBe('gb-eng');
    expect(match23.winner?.id).toBe('ar');
    expect(match24.winner?.id).toBe('ch');

    const quarterfinal26 = tournament.matches.find((m) => m.id === 26)!;
    const quarterfinal27 = tournament.matches.find((m) => m.id === 27)!;
    const quarterfinal28 = tournament.matches.find((m) => m.id === 28)!;

    expect(quarterfinal26.left?.id).toBe('es');
    expect(quarterfinal26.right?.id).toBe('be');
    expect(quarterfinal27.right?.id).toBe('gb-eng');
    expect(quarterfinal28.left?.id).toBe('ar');
    expect(quarterfinal28.right?.id).toBe('ch');
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
    const match25 = tournament.matches.find((m) => m.id === 25)!; // Francia vs Marruecos
    const france = match25.left!;

    expect(match25.winner).toBeNull();

    // Select Francia as winner of Match 25
    const success = store.selectWinner(25, france);
    expect(success).toBe(true);

    const updatedTournament = useTournamentStore.getState().tournaments['wc2026'];
    const updatedMatch25 = updatedTournament.matches.find((m) => m.id === 25)!;
    const nextMatch29 = updatedTournament.matches.find((m) => m.id === 29)!;

    expect(updatedMatch25.winner?.id).toBe('fr');
    expect(nextMatch29.left?.id).toBe('fr');
  });

  it('should NOT allow a country to advance to the next phase if it does not leave an opponent behind (both left and right must be present)', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];

    const match29 = tournament.matches.find((m) => m.id === 29)!;
    expect(match29.left).toBeNull();
    expect(match29.right).toBeNull();

    const dummyCountry = { id: 'dummy', name: 'Equipo Dummy', code: 'dummy', flagUrl: '' };

    // Attempt to advance a country from Match 29 when neither opponent slot is defined
    const advanceSuccess = store.selectWinner(29, dummyCountry);
    expect(advanceSuccess).toBe(false);

    // Verify Match 29 winner is still null
    const afterAttempt = useTournamentStore.getState().tournaments['wc2026'];
    expect(afterAttempt.matches.find((m) => m.id === 29)!.winner).toBeNull();
  });

  it('should allow advancing to next phase once BOTH opponent teams are defined in the match', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];
    
    // Match 22 already has México (left) and Inglaterra (right) from base state!
    const match22 = tournament.matches.find((m) => m.id === 22)!;
    expect(match22.left?.id).toBe('mx');
    expect(match22.right?.id).toBe('gb-eng');

    // Now México CAN advance from Octavos because both rival teams are present!
    const advanceSuccess = store.selectWinner(22, match22.left!);
    expect(advanceSuccess).toBe(true);

    const afterR2 = useTournamentStore.getState().tournaments['wc2026'];
    expect(afterR2.matches.find((m) => m.id === 22)!.winner?.id).toBe('mx');
    expect(afterR2.matches.find((m) => m.id === 27)!.right?.id).toBe('mx');
  });

  it('should allow undoing a regular match result via right click (undoMatchResult) only if it does not affect future defined matches', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];
    const match22 = tournament.matches.find((m) => m.id === 22)!; // México vs Inglaterra
    const mexico = match22.left!;

    store.selectWinner(22, mexico);
    expect(useTournamentStore.getState().tournaments['wc2026'].matches.find((m) => m.id === 22)!.winner?.id).toBe('mx');

    // Undo Match 22
    const undoSuccess = store.undoMatchResult(22);
    expect(undoSuccess).toBe(true);
    
    const afterUndo = useTournamentStore.getState().tournaments['wc2026'];
    expect(afterUndo.matches.find((m) => m.id === 22)!.winner).toBeNull();
    expect(afterUndo.matches.find((m) => m.id === 27)!.right).toBeNull();
  });

  it('should NOT allow undoing a match if it already affected a subsequent completed match', () => {
    const store = useTournamentStore.getState();
    const tournament = store.tournaments['wc2026'];
    const match22 = tournament.matches.find((m) => m.id === 22)!; // México vs Inglaterra
    const mexico = match22.left!;

    store.selectWinner(22, mexico); // México wins Match 22 -> advances to Match 27
    expect(useTournamentStore.getState().tournaments['wc2026'].matches.find((m) => m.id === 22)!.winner?.id).toBe('mx');

    // Attempt to undo Match 12 (base state feeder for Match 22) should fail
    const undoBase = store.undoMatchResult(12);
    expect(undoBase).toBe(false);
  });
});
