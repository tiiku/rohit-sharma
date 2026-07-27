'use client';

export interface MorphState {
  stage: number;
  nextStage: number;
  morphT: number;
  cameraPhase: number;
}

export function getMorphState(progress: number): MorphState {
  // Clamp
  const p = Math.min(Math.max(progress, 0), 1);

  if (p >= 1.0) {
    return { stage: 7, nextStage: 0, morphT: 1, cameraPhase: 1 };
  }

  const numStages = 7; // 1: Pull Shot, 2: Bat, 3: Ball, 4: Helmet, 5: Stumps, 6: Bails, 7: Trophy
  const cycleLength = 1.0 / numStages;

  const cycleIdx = Math.floor(p / cycleLength); // 0 to 6
  const localP = (p - cycleIdx * cycleLength) / cycleLength; // 0 to 1 within cycle

  const targetShape = cycleIdx + 1; // 1 to 7

  let stage = 0;
  let nextStage = 0;
  let morphT = 0;

  // 0.0 - 0.20: Galaxy (0) -> targetShape (Forms quickly while camera is far away)
  if (localP < 0.20) {
    stage = 0;
    nextStage = targetShape;
    morphT = localP / 0.20;
  }
  // 0.20 - 0.65: Hold targetShape (Fully formed as camera approaches and text is displayed)
  else if (localP < 0.65) {
    stage = targetShape;
    nextStage = targetShape;
    morphT = 0;
  }
  // 0.65 - 0.85: targetShape -> Galaxy (Disperses just as camera flies inside it)
  else if (localP < 0.85) {
    stage = targetShape;
    nextStage = 0;
    morphT = (localP - 0.65) / 0.20;
  }
  // 0.85 - 1.0: Hold Galaxy (0)
  else {
    stage = 0;
    nextStage = 0;
    morphT = 0;
  }

  return { stage, nextStage, morphT, cameraPhase: p };
}
