'use client';

/**
 * Maps scroll progress (0–1) to morph stages and interpolation values.
 * 
 * Timeline:
 *   0.00–0.10  Stage 0: Random galaxy
 *   0.10–0.25  Stage 0→1: Galaxy → Bat
 *   0.25–0.35  Stage 1→2: Bat → Ball (camera flies into bat)
 *   0.35–0.50  Stage 2→3: Ball → Helmet
 *   0.50–0.65  Stage 3→4: Helmet → Stumps
 *   0.65–0.80  Stage 4→5: Stumps → Bails
 *   0.80–0.95  Stage 5→6: Bails → Trophy
 *   0.95–1.00  Stage 6→7: Trophy → Disperse
 */

export interface MorphState {
  stage: number;
  morphT: number;
  cameraPhase: number;
}

interface StageBreakpoint {
  start: number;
  end: number;
  stageFrom: number;
}

const BREAKPOINTS: StageBreakpoint[] = [
  { start: 0.00, end: 0.10, stageFrom: 0 },  // Galaxy hold
  { start: 0.10, end: 0.25, stageFrom: 0 },  // Galaxy → Bat
  { start: 0.25, end: 0.35, stageFrom: 1 },  // Bat → Ball
  { start: 0.35, end: 0.50, stageFrom: 2 },  // Ball → Helmet
  { start: 0.50, end: 0.65, stageFrom: 3 },  // Helmet → Stumps
  { start: 0.65, end: 0.80, stageFrom: 4 },  // Stumps → Bails
  { start: 0.80, end: 0.95, stageFrom: 5 },  // Bails → Trophy
  { start: 0.95, end: 1.00, stageFrom: 6 },  // Trophy → Disperse
];

export function getMorphState(progress: number): MorphState {
  // Clamp
  const p = Math.min(Math.max(progress, 0), 1);

  for (let i = BREAKPOINTS.length - 1; i >= 0; i--) {
    const bp = BREAKPOINTS[i];
    if (p >= bp.start) {
      const range = bp.end - bp.start;
      const localProgress = range > 0 ? (p - bp.start) / range : 0;

      // For the first breakpoint (galaxy hold), no morph
      if (i === 0) {
        return {
          stage: 0,
          morphT: 0,
          cameraPhase: p / 0.10,
        };
      }

      return {
        stage: bp.stageFrom,
        morphT: Math.min(localProgress, 1),
        cameraPhase: p,
      };
    }
  }

  return { stage: 0, morphT: 0, cameraPhase: 0 };
}
