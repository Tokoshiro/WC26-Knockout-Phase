import type { Match } from '../types/tournament';

export interface Coords {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

export interface FeederSlotCoords extends Coords {
  matchId: number;
  slot: 'left' | 'right';
}

/**
 * Converts polar coordinates (radius, angle in degrees) to Cartesian (x, y)
 */
export function polarToCartesian(radius: number, angleDegrees: number): { x: number; y: number } {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  return {
    x: radius * Math.cos(angleRadians),
    y: radius * Math.sin(angleRadians),
  };
}

/**
 * Calculates the circle radius for a given match round (0 = outer feeder ring, 5 = center final)
 */
export function getMatchRadius(round: number, totalRounds: number): number {
  if (round === totalRounds) {
    return 0; // Final match trophy at center
  }
  if (round === 0) {
    return 480; // Outermost ring of 32 initial teams (enlarged for grand double-size dimensions)
  }
  // For totalRounds = 5: R1=375, R2=270, R3=165, R4=80
  const step = 375 / (totalRounds - 1);
  return Math.round((totalRounds - 1 - (round - 1)) * step);
}

/**
 * Calculates exact polar angles and Cartesian coordinates for every match and outer feeder slot
 */
export function calculateTournamentGeometry(matches: Match[], totalRounds: number): {
  coordsMap: Record<number, Coords>;
  feederSlots: FeederSlotCoords[];
} {
  const coordsMap: Record<number, Coords> = {};
  const feederSlots: FeederSlotCoords[] = [];

  if (matches.length === 0) return { coordsMap, feederSlots };

  const lowestRound = Math.min(...matches.map(m => m.round));

  // Separate Left and Right outermost matches
  const leftOutermost = matches
    .filter(m => m.round === lowestRound && m.side === 'left')
    .sort((a, b) => a.id - b.id);
    
  const rightOutermost = matches
    .filter(m => m.round === lowestRound && m.side === 'right')
    .sort((a, b) => a.id - b.id);

  // Distribute left side feeder slots from top-left (250°) down to bottom-left (110°) to mirror right side order
  if (leftOutermost.length > 0) {
    const numFeeders = leftOutermost.length * 2;
    const startAngle = numFeeders > 8 ? 250 : 235;
    const endAngle = numFeeders > 8 ? 110 : 125;
    const step = numFeeders > 1 ? (endAngle - startAngle) / (numFeeders - 1) : 0;

    leftOutermost.forEach((match, idx) => {
      const leftAngle = startAngle + (idx * 2) * step;
      const rightAngle = startAngle + (idx * 2 + 1) * step;
      const matchAngle = (leftAngle + rightAngle) / 2;

      // Outer feeder leaves (round 0)
      const r0 = getMatchRadius(0, totalRounds);
      const cLeft = polarToCartesian(r0, leftAngle);
      const cRight = polarToCartesian(r0, rightAngle);
      feederSlots.push({ x: cLeft.x, y: cLeft.y, angle: leftAngle, radius: r0, matchId: match.id, slot: 'left' });
      feederSlots.push({ x: cRight.x, y: cRight.y, angle: rightAngle, radius: r0, matchId: match.id, slot: 'right' });

      // Match junction dot (round 1)
      const r1 = getMatchRadius(match.round, totalRounds);
      const cMatch = polarToCartesian(r1, matchAngle);
      coordsMap[match.id] = { x: cMatch.x, y: cMatch.y, angle: matchAngle, radius: r1 };
    });
  }

  // Distribute right side feeder slots across -70° to +70°
  if (rightOutermost.length > 0) {
    const numFeeders = rightOutermost.length * 2;
    const startAngle = numFeeders > 8 ? -70 : -55;
    const endAngle = numFeeders > 8 ? 70 : 55;
    const step = numFeeders > 1 ? (endAngle - startAngle) / (numFeeders - 1) : 0;

    rightOutermost.forEach((match, idx) => {
      const leftAngle = startAngle + (idx * 2) * step;
      const rightAngle = startAngle + (idx * 2 + 1) * step;
      const matchAngle = (leftAngle + rightAngle) / 2;

      // Outer feeder leaves (round 0)
      const r0 = getMatchRadius(0, totalRounds);
      const cLeft = polarToCartesian(r0, leftAngle);
      const cRight = polarToCartesian(r0, rightAngle);
      feederSlots.push({ x: cLeft.x, y: cLeft.y, angle: leftAngle, radius: r0, matchId: match.id, slot: 'left' });
      feederSlots.push({ x: cRight.x, y: cRight.y, angle: rightAngle, radius: r0, matchId: match.id, slot: 'right' });

      // Match junction dot (round 1)
      const r1 = getMatchRadius(match.round, totalRounds);
      const cMatch = polarToCartesian(r1, matchAngle);
      coordsMap[match.id] = { x: cMatch.x, y: cMatch.y, angle: matchAngle, radius: r1 };
    });
  }

  // Process inner rounds iteratively by averaging children angles
  for (let r = lowestRound + 1; r <= totalRounds; r++) {
    const roundMatches = matches.filter(m => m.round === r);
    
    roundMatches.forEach(match => {
      if (match.side === 'center' || r === totalRounds) {
        coordsMap[match.id] = { x: 0, y: 0, angle: 0, radius: 0 };
        return;
      }

      const feeders = matches.filter(m => m.nextMatchId === match.id && coordsMap[m.id]);
      
      let angle = 0;
      if (feeders.length > 0) {
        let sumSin = 0;
        let sumCos = 0;
        feeders.forEach(f => {
          const rad = (coordsMap[f.id].angle * Math.PI) / 180;
          sumSin += Math.sin(rad);
          sumCos += Math.cos(rad);
        });
        angle = (Math.atan2(sumSin / feeders.length, sumCos / feeders.length) * 180) / Math.PI;
      } else {
        angle = match.side === 'left' ? 180 : 0;
      }

      const radius = getMatchRadius(match.round, totalRounds);
      const { x, y } = polarToCartesian(radius, angle);
      coordsMap[match.id] = { x, y, angle, radius };
    });
  }

  return { coordsMap, feederSlots };
}

/**
 * Generates an SVG step-arc path between two coordinate points (orthogonal tournament tree branching)
 */
export function createBranchPath(from: Coords, to: Coords): string {
  if (to.radius === 0) {
    // Direct line from Semifinal to Center Final
    return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} L 0 0`;
  }

  const midRadius = (from.radius + to.radius) / 2;
  const c1 = polarToCartesian(midRadius, from.angle);
  const c2 = polarToCartesian(midRadius, to.angle);

  let diff = (to.angle - from.angle) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  const sweepFlag = diff > 0 ? 1 : 0;

  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} L ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} A ${midRadius.toFixed(2)} ${midRadius.toFixed(2)} 0 0 ${sweepFlag} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} L ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}
