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
uniform float uCameraZ;
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

  // Scroll-based camera travel - fly through galaxy infinitely
  float scrollDistance = uScrollProgress * 3000.0; // Much faster travel
  pos.z += scrollDistance;
  
  // Wrap Z space to recycle particles relative to the camera.
  // The camera looks towards -Z. We want particles to wrap from slightly behind camera to far ahead.
  float relativeZ = pos.z - uCameraZ;
  float zSpan = 200.0;
  relativeZ = mod(relativeZ + 150.0, zSpan) - 150.0;
  pos.z = uCameraZ + relativeZ;

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
uniform float uMorphNextStage;
uniform vec2 uMouse;
uniform vec3 uMouseWorld;
uniform float uBreathing;

attribute vec3 aPositionTarget0;
attribute vec3 aPositionTarget1;
attribute vec3 aPositionTarget2;
attribute vec3 aPositionTarget3;
attribute vec3 aPositionTarget4;
attribute vec3 aPositionTarget5;
attribute vec3 aPositionTarget6;
attribute vec3 aPositionRandom;
attribute float aSize;
attribute float aRandom;
attribute vec3 aBatColor;
attribute vec3 aDisplacement;

varying float vAlpha;
varying float vDistToCenter;
varying float vRandom;
varying vec3 vBatColor;
varying float vBatWeight;
varying float vTrophyWeight;
varying float vBlurriness;
varying float vBrightness;
varying float vVisibility;

// Get target position for a given stage
vec3 getTargetPosition(float stage) {
  int s = int(stage);
  if (s == 0) return aPositionRandom;
  if (s == 1) return aPositionTarget6; // Pull shot figure
  if (s == 2) return aPositionTarget0; // Bat
  if (s == 3) return aPositionTarget1; // Ball
  if (s == 4) return aPositionTarget2; // Helmet
  if (s == 5) return aPositionTarget3; // Stumps
  if (s == 6) return aPositionTarget4; // Bails / Winners cup
  if (s == 7) return aPositionTarget5; // Trophy
  return aPositionRandom;
}

// Spring damping easing function (elastic out)
// Removed bouncy effect as per user request
float easeOutCubic(float t) {
  return 1.0 - pow(1.0 - t, 3.0);
}

void main() {
  float stage = uMorphStage;
  float nextStage = uMorphNextStage;
  float t = uMorphProgress;

  vec3 currentTarget = getTargetPosition(stage);
  vec3 nextTarget = getTargetPosition(nextStage);

  // Randomize arrival times so particles form the figure organically and randomly getting closer
  // We offset the 't' value using aRandom. We map t (0 to 1) to a wider range so all particles
  // eventually reach 1.0.
  float particleT = clamp(t * 1.5 - aRandom * 0.5, 0.0, 1.0);
  float smoothT = easeOutCubic(particleT);
  
  vec3 pos = mix(currentTarget, nextTarget, smoothT);
  
  // Apply CPU-computed physical displacement
  pos += aDisplacement;

  // === ALIVE MOTION (Premium Organic Feel) ===
  
  float isTransition = sin(t * 3.14159265);
  vBlurriness = isTransition;

  // Micro-turbulence using simplex noise — very subtle for shape stability
  float noiseScale = 0.8;
  float noiseSpeed = uTime * 0.12;
  float nx = snoise(vec3(pos.x * noiseScale, pos.y * noiseScale, noiseSpeed + aRandom * 100.0));
  float ny = snoise(vec3(pos.y * noiseScale, pos.z * noiseScale, noiseSpeed + aRandom * 200.0));
  float nz = snoise(vec3(pos.z * noiseScale, pos.x * noiseScale, noiseSpeed + aRandom * 300.0));

  // Keep noise very small to preserve clean shape definition
  float noiseAmplitude = 0.02 + aRandom * 0.03; 
  pos += vec3(nx, ny, nz) * noiseAmplitude;

  // Gentle breathing effect
  float breathPhase = uTime * (0.8 + aRandom * 0.4) + aRandom * 6.28;
  float breath = sin(breathPhase) * uBreathing;
  pos *= 1.0 + breath * 0.01;

  // Subtle orbital drift (adds volume)
  float orbitAngle = uTime * 0.1 + aRandom * 6.28;
  float orbitRadius = 0.02 * (1.0 - smoothT * 0.5); // Less orbit when settling
  pos.x += cos(orbitAngle) * orbitRadius;
  pos.y += sin(orbitAngle) * orbitRadius;

  // === FINAL POSITION ===
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // STRICT PARTICLE SIZING — tiny crisp dots like the reference
  float randomSizeCurve = pow(aRandom, 4.0); // Even more skewed toward small
  float pixelBaseSize = 0.8 + randomSizeCurve * 1.5; // 0.8 to 2.3 pixels
  
  // Apply perspective distance attenuation
  float distScale = 50.0 / -mvPosition.z;
  gl_PointSize = clamp(pixelBaseSize * distScale, 0.5, 2.5);

  // Varyings
  float distToCam = length(mvPosition.xyz);
  // Organic randomized opacity
  float baseAlpha = 0.2 + aRandom * 0.8;
  // Dynamic brightness flickering (lifetime effect)
  vBrightness = 0.5 + 0.5 * sin(uTime * (2.0 + aRandom * 2.0) + aRandom * 10.0);
  
  vAlpha = smoothstep(80.0, 3.0, distToCam) * baseAlpha;
  vDistToCenter = length(pos) / 10.0;
  vRandom = aRandom;
  vBatColor = aBatColor;
  
  float exactStage = stage + t;
  vBatWeight = 1.0 - clamp(abs(exactStage - 2.0), 0.0, 1.0);
  vTrophyWeight = 1.0 - clamp(abs(exactStage - 7.0), 0.0, 1.0);

  // Visibility fade to prevent the particles from popping in as a giant white cloud
  // when recycling the system. They are invisible when completely dispersed (stage 0).
  float visibility = 1.0;
  if (stage == 0.0 && nextStage == 0.0) {
    visibility = 0.0;
  } else if (stage == 0.0) {
    visibility = smoothT; // Fade in as they form the figure
  } else if (nextStage == 0.0) {
    visibility = 1.0 - smoothT; // Fade out as they disperse back to random
  }
  
  // Let particles pass right through the camera natively for a volumetric pass-through effect
  float camFade = 1.0;
  
  // Calculate the local position of the particle within the object
  vec3 localPos = mix(currentTarget, nextTarget, smoothT);
  
  vVisibility = visibility * camFade;
}
`;

export const morphFragmentShader = /* glsl */ `
uniform float uTime;

varying float vAlpha;
varying float vDistToCenter;
varying float vRandom;
varying vec3 vBatColor;
varying float vBatWeight;
varying float vTrophyWeight;
varying float vBlurriness;
varying float vBrightness;
varying float vVisibility;

void main() {
  // Crisp circular particle with radial glow falloff
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Strict cut-off for perfect circles
  if (dist > 0.5) discard;

  // Bright core with soft radial falloff — creates a natural glow per particle
  float core = smoothstep(0.5, 0.0, dist); // 1.0 at center, 0.0 at edge
  float coreIntensity = pow(core, 1.5); // Concentrate brightness at center
  
  // Apply visibility fade
  float alpha = coreIntensity * vAlpha * vVisibility;

  // Current color palette (Golden / Amber / White)
  vec3 white = vec3(1.0, 1.0, 1.0);
  vec3 gold = vec3(1.0, 0.843, 0.0);        // #FFD700
  vec3 amber = vec3(1.0, 0.647, 0.0);       // #FFA500

  // Mix colors organically
  float colorMix = sin(vRandom * 6.28 + uTime * 0.3) * 0.5 + 0.5;
  vec3 goldenColor = mix(gold, amber, colorMix * 0.6);

  // Incorporate trophy weight for specific coloring
  vec3 color = mix(white, goldenColor, vTrophyWeight + 0.2); // Always a hint of gold

  // Apply per-particle brightness variation
  color *= (0.85 + 0.3 * vBrightness);
  
  // Bright hot core for some particles (star-like)
  if (vRandom > 0.92 && dist < 0.15) {
      color = mix(color, vec3(1.0), 0.9);
  }

  // Let colors stay bright — the bloom pass will handle the glow spread
  color *= 0.85;

  gl_FragColor = vec4(color, alpha);
}
`;
