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

  const numStages = 8; // 1: Pull Shot, 2: Bat, 3: Ball, 4: Helmet, 5: Stumps, 6: Bails, 7: Trophy, 8: Video
  const cycleLength = 1.0 / numStages;

  const cycleIdx = Math.floor(p / cycleLength); // 0 to 7
  const localP = (p - cycleIdx * cycleLength) / cycleLength; // 0 to 1 within cycle

  const targetShape = cycleIdx >= 7 ? 0 : cycleIdx + 1; // 1 to 7, then 0 for video phase

  let stage = 0;
  let nextStage = 0;
  let morphT = 0;

  // 0.0 - 0.20: Galaxy -> targetShape (Forms as camera approaches)
  if (localP < 0.20) {
    stage = 0;
    nextStage = targetShape;
    morphT = localP / 0.20;
  }
  // 0.20 - 0.60: Hold targetShape (Camera passes through it at 0.40)
  else if (localP < 0.60) {
    stage = targetShape;
    nextStage = targetShape;
    morphT = 0;
  }
  // 0.60 - 0.80: targetShape -> Galaxy (Disperses while behind the camera)
  else if (localP < 0.80) {
    stage = targetShape;
    nextStage = 0;
    morphT = (localP - 0.60) / 0.20;
  }
  // 0.80 - 1.0: Hold Galaxy (Just stars, ready to snap for next cycle)
  else {
    stage = 0;
    nextStage = 0;
    morphT = 0;
  }

  return { stage, nextStage, morphT, cameraPhase: p };
}
