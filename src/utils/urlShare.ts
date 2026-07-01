export interface ShareStatePayload {
  t: string; // Tournament id e.g. "wc2026"
  w: Record<number, string>; // matchId -> winner country id
}

/**
 * Encodes the current winners state into a compact Base64 string for URL sharing
 */
export function encodeShareState(tournamentId: string, matches: { id: number; winner: { id: string } | null }[]): string {
  const winnersMap: Record<number, string> = {};
  
  matches.forEach(m => {
    if (m.winner) {
      winnersMap[m.id] = m.winner.id;
    }
  });

  const payload: ShareStatePayload = {
    t: tournamentId,
    w: winnersMap,
  };

  try {
    const jsonString = JSON.stringify(payload);
    return btoa(encodeURIComponent(jsonString));
  } catch (error) {
    console.error("Error encoding share state:", error);
    return "";
  }
}

/**
 * Decodes a share URL string back into a tournament ID and winners mapping
 */
export function decodeShareState(shareString: string): ShareStatePayload | null {
  try {
    const jsonString = decodeURIComponent(atob(shareString));
    const payload = JSON.parse(jsonString) as ShareStatePayload;
    if (payload && typeof payload.t === 'string' && typeof payload.w === 'object') {
      return payload;
    }
    return null;
  } catch (error) {
    console.error("Error decoding share state:", error);
    return null;
  }
}
