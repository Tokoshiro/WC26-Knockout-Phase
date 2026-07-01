import React, { useMemo, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTournamentStore } from '../../store/useTournamentStore';
import { calculateTournamentGeometry, createBranchPath, getMatchRadius } from '../../utils/geometry';
import type { Country, Match } from '../../types/tournament';

const WorldCupTrophyGraphic: React.FC = () => (
  <g transform="translate(0, 0)" className="select-none pointer-events-none drop-shadow-xl">
    {/* Authentic FIFA World Cup Trophy Image */}
    <image
      x="-36"
      y="-66"
      width="72"
      height="132"
      href="https://fwc2026-knockout.vercel.app/img/trophy-dm.png"
      preserveAspectRatio="xMidYMid meet"
    />
  </g>
);

interface FlagNodeProps {
  country: Country;
  x: number;
  y: number;
  isBaseState?: boolean;
  isWinner?: boolean;
  isDimmed?: boolean;
  onSelect: () => void;
  onUndo: () => void;
}

const FlagNode: React.FC<FlagNodeProps> = ({ country, x, y, isBaseState, isWinner, isDimmed, onSelect, onUndo }) => {
  const timerRef = useRef<any>(null);
  const didLongPress = useRef(false);

  const handleTouchStart = () => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onUndo();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (didLongPress.current) return;
    onSelect();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUndo();
  };

  const clipId = `clip-${country.id}-${Math.round(x)}-${Math.round(y)}`;

  return (
    <g
      transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)})`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      className="cursor-pointer group select-none"
    >
      <circle
        r="36"
        fill="none"
        stroke={isWinner && !isDimmed && !isBaseState ? "#38bdf8" : "transparent"}
        strokeWidth="2.5"
        className="transition-all duration-300 group-hover:scale-110 group-hover:stroke-accent"
      />
      <circle
        r="32"
        fill="#1e293b"
        stroke="var(--color-border)"
        strokeWidth="1.5"
        className="transition-transform duration-300 group-hover:scale-110 shadow-md"
      />
      <clipPath id={clipId}>
        <circle r="32" />
      </clipPath>
      <image
        x="-32"
        y="-32"
        width="64"
        height="64"
        href={country.flagUrl}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
        className={`transition-all duration-300 group-hover:scale-110 ${isDimmed ? 'opacity-30' : ''
          }`}
      />
      <title>{`${country.name} (${isBaseState ? 'Estado inicial fijo (no modificable)' : isDimmed ? 'Equipo ya avanzó (clic derecho / mantener para retroceder)' : 'Clic para avanzar • Clic derecho / Mantener presionado para retroceder'})`}</title>
    </g>
  );
};

const getInitialScale = () => {
  if (typeof window === 'undefined') return 0.65;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const availHeight = Math.max(300, h - 140);
  const availWidth = Math.max(300, w - 40);
  const fitDim = Math.min(availWidth, availHeight);
  if (w < 640) return Math.max(0.35, fitDim / 1100);
  return Math.max(0.45, Math.min(1.2, fitDim / 1100));
};

export const CircularBracket: React.FC = () => {
  const { currentTournamentId, tournaments, selectWinner, undoMatchResult, theme } = useTournamentStore();
  const tournament = tournaments[currentTournamentId];

  const prevWinnerRef = useRef<string | null>(null);

  const { coordsMap, feederSlots, finalMatch, rings } = useMemo(() => {
    if (!tournament) {
      return { coordsMap: {}, feederSlots: [], finalMatch: undefined, rings: [] };
    }

    const { coordsMap, feederSlots } = calculateTournamentGeometry(tournament.matches, tournament.totalRounds);
    const final = tournament.matches.find((m) => m.side === 'center' || m.round === tournament.totalRounds);

    const rList: number[] = [];
    for (let r = 0; r <= tournament.totalRounds - 1; r++) {
      rList.push(getMatchRadius(r, tournament.totalRounds));
    }

    return { coordsMap, feederSlots, finalMatch: final, rings: rList };
  }, [tournament]);

  const champion = finalMatch?.winner || null;

  // Trigger confetti when champion is crowned
  useEffect(() => {
    if (champion && prevWinnerRef.current !== champion.id) {
      prevWinnerRef.current = champion.id;
      try {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const interval: any = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: 0.5, y: 0.5 } });
        }, 250);
      } catch (e) {
        console.error("Confetti error:", e);
      }
    } else if (!champion) {
      prevWinnerRef.current = null;
    }
  }, [champion]);

  if (!tournament) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-text-muted font-medium">
        Cargando datos del torneo...
      </div>
    );
  }

  const lineStrokeColor = theme === 'dark' ? '#475569' : '#94a3b8';
  const dotColor = theme === 'dark' ? '#475569' : '#94a3b8';
  const placeholderColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  return (
    <div className="w-full h-screen overflow-hidden bg-background relative flex items-center justify-center select-none font-sans">
      <TransformWrapper
        initialScale={getInitialScale()}
        minScale={0.2}
        maxScale={2.5}
        centerOnInit={true}
        disabled={true}
        wheel={{ disabled: true }}
        pinch={{ disabled: true }}
        doubleClick={{ disabled: true }}
        panning={{ disabled: true }}
      >
        <>
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full flex items-center justify-center"
          >
            {/* 100% SVG Interactive Bracket with fluid viewBox */}
            <div id="bracket-capture-area" className="relative w-[1100px] h-[1100px] flex items-center justify-center">
              <svg
                viewBox="-550 -550 1100 1100"
                className="w-full h-full overflow-visible"
                style={{ backgroundColor: theme === 'dark' ? '#090d16' : '#f8fafc' }}
              >
                {/* Layer 0: Decorative Concentric Rings */}
                <g className="pointer-events-none">
                  {rings.map((rad, idx) => (
                    <circle
                      key={`ring-${idx}`}
                      cx="0"
                      cy="0"
                      r={rad}
                      fill="none"
                      stroke={lineStrokeColor}
                      strokeWidth="1"
                      strokeDasharray="4 8"
                      strokeOpacity="0.25"
                    />
                  ))}
                  {/* Center Trophy Circle Ring */}
                  <circle cx="0" cy="0" r="48" fill="none" stroke="#facc15" strokeWidth="1.5" strokeOpacity="0.3" />
                </g>

                {/* Layer 1: Orthogonal Connecting Lines (ALL IDENTICAL AS REQUESTED) */}
                <g className="pointer-events-none">
                  {/* 1. Lines from outer Round 0 feeder slots to Round 1 Match dots */}
                  {feederSlots.map((feeder, idx) => {
                    const matchCoord = coordsMap[feeder.matchId];
                    if (!matchCoord) return null;
                    const pathData = createBranchPath(feeder, matchCoord);
                    return (
                      <path
                        key={`feeder-line-${idx}`}
                        d={pathData}
                        fill="none"
                        stroke={lineStrokeColor}
                        strokeWidth="1.5"
                        strokeOpacity="0.65"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                    );
                  })}

                  {/* 2. Lines from Round r matches to Round r+1 parent match dots */}
                  {tournament.matches.map((match) => {
                    if (match.nextMatchId === null) return null;
                    const fromCoord = coordsMap[match.id];
                    const toCoord = coordsMap[match.nextMatchId];
                    if (!fromCoord || !toCoord) return null;

                    const pathData = createBranchPath(fromCoord, toCoord);

                    return (
                      <path
                        key={`match-line-${match.id}`}
                        d={pathData}
                        fill="none"
                        stroke={lineStrokeColor}
                        strokeWidth="1.5"
                        strokeOpacity="0.65"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </g>

                {/* Layer 2: Nodes (Outer Feeder Flags, Inner Junction Dots & Advanced Flags) */}
                <g>
                  {/* 1. Outer Ring Feeder Slots (32 initial participating teams) */}
                  {feederSlots.map((feeder, idx) => {
                    const matchObj = tournament.matches.find((m) => m.id === feeder.matchId);
                    const country = feeder.slot === 'left' ? matchObj?.left : matchObj?.right;

                    if (!country) {
                      return (
                        <circle
                          key={`empty-feeder-${idx}`}
                          cx={feeder.x}
                          cy={feeder.y}
                          r="4"
                          fill={dotColor}
                          className="transition-all duration-300"
                        />
                      );
                    }

                    // If this team won Round 1, they advanced to Round 1, so their flag disappears from Round 0 and leaves a small circle!
                    if (matchObj?.winner?.id === country.id) {
                      return (
                        <circle
                          key={`advanced-feeder-dot-${feeder.matchId}-${feeder.slot}`}
                          cx={feeder.x}
                          cy={feeder.y}
                          r="4"
                          fill={dotColor}
                          className="transition-all duration-300"
                        />
                      );
                    }
                    // A defeated team in Round 0 becomes dimmed (30% opacity)
                    const isDimmed = Boolean(matchObj?.winner);

                    return (
                      <FlagNode
                        key={`feeder-flag-${feeder.matchId}-${feeder.slot}`}
                        country={country}
                        x={feeder.x}
                        y={feeder.y}
                        isBaseState={matchObj?.isBaseState}
                        isWinner={false}
                        isDimmed={isDimmed}
                        onSelect={() => selectWinner(feeder.matchId, country)}
                        onUndo={() => undoMatchResult(feeder.matchId, country.id)}
                      />
                    );
                  })}

                  {/* 2. Inner Match Junctions (Rounds 1 to 4) */}
                  {tournament.matches.map((match) => {
                    if (match.side === 'center' || match.round === tournament.totalRounds) return null;
                    const coords = coordsMap[match.id];
                    if (!coords) return null;

                    // If a team won this match, they advanced to this position!
                    if (match.winner) {
                      const nextMatch = match.nextMatchId !== null ? tournament.matches.find(m => m.id === match.nextMatchId) : null;
                      // If this team won the next match, they advanced to the next round, so their flag disappears from here!
                      if (nextMatch?.winner?.id === match.winner.id) {
                        return null;
                      }
                      const isAdvancedFurther = Boolean(nextMatch && nextMatch.winner !== null);

                      return (
                        <FlagNode
                          key={`match-flag-${match.id}`}
                          country={match.winner}
                          x={coords.x}
                          y={coords.y}
                          isBaseState={match.isBaseState}
                          isWinner={false}
                          isDimmed={isAdvancedFurther}
                          onSelect={() => {
                            if (match.nextMatchId !== null) {
                              selectWinner(match.nextMatchId, match.winner!);
                            }
                          }}
                          onUndo={() => undoMatchResult(match.id, match.winner!.id)}
                        />
                      );
                    }

                    // Otherwise render simple junction dot
                    return (
                      <circle
                        key={`junction-dot-${match.id}`}
                        cx={coords.x}
                        cy={coords.y}
                        r="3.5"
                        fill={dotColor}
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </g>

                {/* Layer 3: Center Trophy & Champion Celebration */}
                <g transform="translate(0, 0)" className="pointer-events-auto">
                  {/* Authentic FIFA World Cup Trophy Silhouette */}
                  <WorldCupTrophyGraphic />

                  {/* Champion Display if Final is won */}
                  {champion && (
                    <g
                      transform="translate(0, -88)"
                      onClick={() => { }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (finalMatch) undoMatchResult(finalMatch.id, champion.id);
                      }}
                      className="cursor-pointer group"
                    >
                      <circle r="46" fill="#facc15" className="animate-ping opacity-30" />
                      <circle r="42" fill="#facc15" stroke="#ffffff" strokeWidth="2.5" />
                      <clipPath id="champ-clip">
                        <circle r="40" />
                      </clipPath>
                      <image
                        x="-40"
                        y="-40"
                        width="80"
                        height="80"
                        href={champion.flagUrl}
                        clipPath="url(#champ-clip)"
                        preserveAspectRatio="xMidYMid slice"
                      />
                      <g transform="translate(-12, -52)">
                        <Crown className="w-6 h-6 text-amber-400 fill-amber-300 animate-bounce" />
                      </g>
                      <title>{`¡CAMPEÓN DEL MUNDIAL: ${champion.name}! (Clic derecho / Mantener presionado para retroceder)`}</title>
                    </g>
                  )}
                </g>
              </svg>
            </div>
          </TransformComponent>
        </>
      </TransformWrapper>
    </div>
  );
};
