/**
 * Particle engine — creates the InstancedBufferGeometry with all morph targets.
 * This is the core data structure powering the morph particle system.
 */

import * as THREE from 'three';
import { generateAllTargetsAsync, PARTICLE_COUNT } from './meshSampler';

export interface ParticleSystem {
  geometry: THREE.BufferGeometry;
  particleCount: number;
  dispose: () => void;
}

/**
 * Creates the main morph particle geometry with all target attributes.
 */
export async function createMorphParticleSystemAsync(): Promise<ParticleSystem> {
  const count = PARTICLE_COUNT;

  // Generate all morph targets
  const targets = await generateAllTargetsAsync(count);

  // Create geometry
  const geometry = new THREE.BufferGeometry();

  // Base position (starts as random cloud)
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(targets.random), 3)
  );

  // Morph targets
  geometry.setAttribute('aPositionRandom', new THREE.BufferAttribute(new Float32Array(targets.random), 3));
  geometry.setAttribute('aPositionTarget0', new THREE.BufferAttribute(targets.bat, 3));
  geometry.setAttribute('aPositionTarget1', new THREE.BufferAttribute(targets.ball, 3));
  geometry.setAttribute('aPositionTarget2', new THREE.BufferAttribute(targets.helmet, 3));
  geometry.setAttribute('aPositionTarget3', new THREE.BufferAttribute(targets.stumps, 3));
  geometry.setAttribute('aPositionTarget4', new THREE.BufferAttribute(targets.bails, 3));
  geometry.setAttribute('aPositionTarget5', new THREE.BufferAttribute(targets.trophy, 3));
  geometry.setAttribute('aBatColor', new THREE.BufferAttribute(targets.batColors, 3));

  // Per-particle size variation
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    sizes[i] = 0.5 + Math.random() * 1.5;
  }
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  // Random seed per particle (for noise variation)
  const randoms = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    randoms[i] = Math.random();
  }
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  return {
    geometry,
    particleCount: count,
    dispose: () => {
      geometry.dispose();
    },
  };
}

/**
 * Creates the background universe particle geometry.
 */
export function createBackgroundParticleSystem(count: number = 100000): ParticleSystem {
  const geometry = new THREE.BufferGeometry();

  // Spread particles in a large volume
  const offsets = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const randoms = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Large spherical distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 5 + Math.pow(Math.random(), 0.5) * 80;

    offsets[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    offsets[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    offsets[i * 3 + 2] = r * Math.cos(phi) - 50; // Offset behind camera initially

    sizes[i] = 0.3 + Math.random() * 0.9;
    randoms[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  return {
    geometry,
    particleCount: count,
    dispose: () => {
      geometry.dispose();
    },
  };
}
