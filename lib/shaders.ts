/**
 * Custom GLSL shaders for the Rohit Sharma tribute particle experience.
 * 
 * Two shader sets:
 * 1. Background Universe — floating star-like particles
 * 2. Morph System — main particles that form cricket objects
 */

import { simplexNoise3D } from './noise';

// ============================================================
// BACKGROUND UNIVERSE SHADERS
// ============================================================

export const backgroundVertexShader = /* glsl */ `
${simplexNoise3D}

uniform float uTime;
uniform float uScrollProgress;
uniform vec2 uMouse;

attribute float aSize;
attribute float aRandom;
attribute vec3 aOffset;

varying float vAlpha;
varying float vSize;

void main() {
  vec3 pos = aOffset;

  // Continuous drift with simplex noise
  float noiseX = snoise(vec3(pos.x * 0.15, pos.y * 0.15, uTime * 0.03 + aRandom * 10.0));
  float noiseY = snoise(vec3(pos.y * 0.15, pos.z * 0.15, uTime * 0.03 + aRandom * 20.0));
  float noiseZ = snoise(vec3(pos.z * 0.15, pos.x * 0.15, uTime * 0.03 + aRandom * 30.0));

  pos += vec3(noiseX, noiseY, noiseZ) * 1.2;

  // Slow rotation
  float angle = uTime * 0.01 * (0.5 + aRandom * 0.5);
  float cosA = cos(angle);
  float sinA = sin(angle);
  pos.xz = mat2(cosA, -sinA, sinA, cosA) * pos.xz;

  // Depth-based parallax
  float depth = (pos.z + 50.0) / 100.0;
  pos.xy += uMouse * depth * 1.5;

  // Scroll-based camera travel
  pos.z += uScrollProgress * 150.0;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation — keep particles small
  float size = aSize * (50.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 0.5, 4.0);

  // Fade based on distance — more aggressive fadeout
  float dist = length(mvPosition.xyz);
  vAlpha = smoothstep(120.0, 20.0, dist) * (0.1 + aRandom * 0.3);
  vSize = aSize;
}
`;

export const backgroundFragmentShader = /* glsl */ `
varying float vAlpha;
varying float vSize;

void main() {
  // Soft circular particle with radial falloff
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  // Strict circle with anti-aliasing
  float alpha = smoothstep(0.5, 0.45, dist) * vAlpha;

  // Golden color with warm variation
  vec3 color = mix(
    vec3(1.0, 0.843, 0.0),   // Gold #FFD700
    vec3(1.0, 0.647, 0.0),   // Orange #FFA500
    smoothstep(0.0, 0.4, dist)
  );

  // Dim the color to avoid additive blowout
  color *= 0.6;

  gl_FragColor = vec4(color, alpha);
}
`;


// ============================================================
// MORPH SYSTEM SHADERS
// ============================================================

export const morphVertexShader = /* glsl */ `
${simplexNoise3D}

uniform float uTime;
uniform float uMorphProgress;
uniform float uMorphStage;
uniform vec2 uMouse;
uniform vec3 uMouseWorld;
uniform float uBreathing;

attribute vec3 aPositionTarget0;
attribute vec3 aPositionTarget1;
attribute vec3 aPositionTarget2;
attribute vec3 aPositionTarget3;
attribute vec3 aPositionTarget4;
attribute vec3 aPositionTarget5;
attribute vec3 aPositionRandom;
attribute float aSize;
attribute float aRandom;

varying float vAlpha;
varying float vDistToCenter;
varying float vRandom;

// Get target position for a given stage
vec3 getTargetPosition(float stage) {
  int s = int(stage);
  if (s == 0) return aPositionRandom;
  if (s == 1) return aPositionTarget0; // Bat
  if (s == 2) return aPositionTarget1; // Ball
  if (s == 3) return aPositionTarget2; // Helmet
  if (s == 4) return aPositionTarget3; // Stumps
  if (s == 5) return aPositionTarget4; // Bails
  if (s == 6) return aPositionTarget5; // Trophy
  return aPositionRandom;
}

void main() {
  // Determine current and next morph targets
  float stage = uMorphStage;
  float nextStage = min(stage + 1.0, 7.0);
  float t = uMorphProgress;

  vec3 currentTarget = getTargetPosition(stage);
  vec3 nextTarget = getTargetPosition(nextStage);

  // Smooth cubic interpolation between targets
  float smoothT = t * t * (3.0 - 2.0 * t);
  vec3 pos = mix(currentTarget, nextTarget, smoothT);

  // === ALIVE MOTION ===

  // Simplex noise displacement (particles vibrate even while forming shapes)
  float noiseScale = 0.6;
  float noiseSpeed = uTime * 0.25;
  float nx = snoise(vec3(pos.x * noiseScale, pos.y * noiseScale, noiseSpeed + aRandom * 100.0));
  float ny = snoise(vec3(pos.y * noiseScale, pos.z * noiseScale, noiseSpeed + aRandom * 200.0));
  float nz = snoise(vec3(pos.z * noiseScale, pos.x * noiseScale, noiseSpeed + aRandom * 300.0));

  // Scale noise down when particles are forming a shape
  float noiseStrength = mix(1.5, 0.08, smoothT * 0.5 + 0.5);
  pos += vec3(nx, ny, nz) * noiseStrength;

  // Breathing effect (subtle scale oscillation)
  float breath = sin(uTime * 0.8 + aRandom * 6.28) * uBreathing;
  pos *= 1.0 + breath * 0.015;

  // Slight orbital motion
  float orbitAngle = uTime * 0.15 + aRandom * 6.28;
  float orbitRadius = 0.03 * (1.0 - smoothT * 0.8);
  pos.x += cos(orbitAngle) * orbitRadius;
  pos.y += sin(orbitAngle) * orbitRadius;

  // === MOUSE INTERACTION ===
  vec2 mouseDir = pos.xy - uMouseWorld.xy;
  float mouseDist = length(mouseDir);
  float holeRadius = 0.25;
  if (mouseDist < holeRadius) {
    vec2 pushDir = normalize(mouseDir + vec2(0.0001));
    float pushDist = (holeRadius - mouseDist); 
    pos.xy += pushDir * pushDist;
  }

  // === FINAL POSITION ===
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Camera distance-based sizing — keep particles small and defined
  float baseSize = aSize * (1.0 + breath * 0.1);
  float distScale = 80.0 / -mvPosition.z;
  gl_PointSize = clamp(baseSize * distScale, 0.5, 6.0);

  // Varyings
  float dist = length(mvPosition.xyz);
  vAlpha = smoothstep(80.0, 3.0, dist) * (0.3 + aRandom * 0.5);
  vDistToCenter = length(pos) / 10.0;
  vRandom = aRandom;
}
`;

export const morphFragmentShader = /* glsl */ `
uniform float uTime;

varying float vAlpha;
varying float vDistToCenter;
varying float vRandom;

void main() {
  // Soft circle with radial falloff
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  // Strict circle with basic anti-aliasing
  float alpha = smoothstep(0.5, 0.45, dist) * vAlpha;

  // Golden color palette
  vec3 gold = vec3(1.0, 0.843, 0.0);        // #FFD700
  vec3 darkGold = vec3(0.722, 0.525, 0.043); // #B8860B
  vec3 amber = vec3(1.0, 0.647, 0.0);        // #FFA500
  vec3 warmWhite = vec3(1.0, 0.94, 0.8);

  // Color variation based on particle properties
  float colorMix = sin(vRandom * 6.28 + uTime * 0.3) * 0.5 + 0.5;
  vec3 color = mix(gold, amber, colorMix * 0.4);

  // Brighter particles near center of shape
  color = mix(color, warmWhite, smoothstep(0.5, 0.0, vDistToCenter) * 0.15);



  // Dim overall to prevent additive blowout
  color *= 0.5;

  gl_FragColor = vec4(color, alpha);
}
`;
