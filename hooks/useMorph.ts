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

  const numStages = 8; // Pull Shot, Bat, Ball, Helmet, Stumps, Bails, Trophy, Flashback
  const cycleLength = 1.0 / numStages;
  
  const cycleIdx = Math.floor(p / cycleLength); // 0 to 7
  const localP = (p - cycleIdx * cycleLength) / cycleLength; // 0 to 1 within cycle
  
  // Clamp targetShape to 7 so it doesn't request a non-existent shape for cycle 8
  const targetShape = cycleIdx === 7 ? 0 : cycleIdx + 1;

  let stage = 0;
  let nextStage = 0;
  let morphT = 0;

  // 0.0 - 0.20: Galaxy (0) -> targetShape (Forms quickly while camera is far away)
  if (localP < 0.20) {
    stage = 0;
    nextStage = targetShape;
    morphT = localP / 0.20;
  }
  // 0.20 - 0.35: Hold targetShape (Fully formed as camera approaches from Z=6 to Z=1.5)
  else if (localP < 0.35) {
    stage = targetShape;
    nextStage = targetShape;
    morphT = 0;
  }
  // 0.35 - 0.60: targetShape -> Galaxy (Disperses just as camera flies inside it)
  else if (localP < 0.60) {
    stage = targetShape;
    nextStage = 0;
    morphT = (localP - 0.35) / 0.25;
  }
  // 0.60 - 1.0: Hold Galaxy (0) (Text will be visible here)
  else {
    stage = 0;
    nextStage = 0;
    morphT = 0;
  }

  return { stage, nextStage, morphT, cameraPhase: p };
}
