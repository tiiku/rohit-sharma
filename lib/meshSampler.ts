/**
 * Procedural geometry generators for cricket objects + MeshSurfaceSampler.
 * 
 * Each cricket object is built from Three.js primitives, then sampled
 * to produce target particle positions. No external GLB files needed.
 */

import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const PARTICLE_COUNT = 30000;

/**
 * Sample `count` points from the surface of a geometry.
 * Returns a Float32Array of [x,y,z, x,y,z, ...] positions.
 */
function sampleSurface(geometry: THREE.BufferGeometry, count: number): Float32Array {
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  const sampler = new MeshSurfaceSampler(mesh).setWeightAttribute(null).build();

  const positions = new Float32Array(count * 3);
  const tempPosition = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    sampler.sample(tempPosition);
    positions[i * 3] = tempPosition.x;
    positions[i * 3 + 1] = tempPosition.y;
    positions[i * 3 + 2] = tempPosition.z;
  }

  material.dispose();
  geometry.dispose();

  return positions;
}

/**
 * Generate random galaxy positions for the initial particle cloud.
 */
export function generateRandomPositions(count: number = PARTICLE_COUNT): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Spherical distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 3 + Math.random() * 12;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

/**
 * Cricket Bat — Blade + Handle composite
 * Scale: ~5 units tall
 */
export function generateBatPositions(count: number = PARTICLE_COUNT): Float32Array {
  const parts: THREE.BufferGeometry[] = [];

  // Blade: Main flat face
  const bladeFace = new THREE.BoxGeometry(1.4, 3.2, 0.2, 8, 16, 4);
  bladeFace.translate(0, 0.5, 0);
  parts.push(bladeFace);

  // Blade: Spine (thick back of the bat)
  // Approximated by a triangular wedge (cylinder with 3 segments)
  const spine = new THREE.CylinderGeometry(0.3, 0.3, 3.2, 3, 1);
  spine.rotateZ(Math.PI / 2); // Lay it flat
  spine.rotateX(Math.PI / 2); // Point triangle back
  spine.scale(1, 0.5, 1); // Flatten it a bit
  spine.rotateZ(Math.PI / 2); // Stand it upright
  spine.translate(0, 0.5, -0.15);
  parts.push(spine);

  // Shoulders (tapering at the top of the blade)
  const leftShoulder = new THREE.CylinderGeometry(0.1, 0.4, 0.6, 8);
  leftShoulder.rotateZ(-Math.PI / 6);
  leftShoulder.translate(-0.4, 2.1, 0);
  parts.push(leftShoulder);

  const rightShoulder = new THREE.CylinderGeometry(0.1, 0.4, 0.6, 8);
  rightShoulder.rotateZ(Math.PI / 6);
  rightShoulder.translate(0.4, 2.1, 0);
  parts.push(rightShoulder);

  // Handle: cylindrical with grip texture implied by ridges
  const handle = new THREE.CylinderGeometry(0.16, 0.16, 2.0, 12, 16);
  handle.translate(0, 3.1, 0);
  parts.push(handle);

  // Handle Pommel/Grip top
  const gripTop = new THREE.CylinderGeometry(0.18, 0.16, 0.4, 12);
  gripTop.translate(0, 4.2, 0);
  parts.push(gripTop);

  const merged = mergeGeometries(parts);
  if (!merged) throw new Error('Failed to merge bat geometries');

  // Center the entire bat
  merged.center();

  // Rotate to match the reference image exactly (pointing up and to the right, angled to show face and spine)
  merged.rotateX(Math.PI / 8);   // Tilt slightly forward to show face
  merged.rotateY(Math.PI / 6);   // Slight turn
  merged.rotateZ(-Math.PI / 4);  // Point up and to the right
  
  // Scale down so the entire bat fits nicely on screen
  merged.scale(0.65, 0.65, 0.65);

  return sampleSurface(merged, count);
}

/**
 * Cricket Ball — Sphere with prominent seam (torus)
 * Scale: ~3 units diameter
 */
export function generateBallPositions(count: number = PARTICLE_COUNT): Float32Array {
  // Main sphere
  const sphere = new THREE.SphereGeometry(1.5, 32, 32);

  // Cricket balls have one thick continuous seam made of 6 rows of stitching
  // We'll approximate this with 4 parallel toruses
  const seam1 = new THREE.TorusGeometry(1.5, 0.04, 8, 64);
  seam1.translate(0, 0, 0.08);
  
  const seam2 = new THREE.TorusGeometry(1.5, 0.04, 8, 64);
  seam2.translate(0, 0, 0.03);
  
  const seam3 = new THREE.TorusGeometry(1.5, 0.04, 8, 64);
  seam3.translate(0, 0, -0.03);
  
  const seam4 = new THREE.TorusGeometry(1.5, 0.04, 8, 64);
  seam4.translate(0, 0, -0.08);

  const merged = mergeGeometries([sphere, seam1, seam2, seam3, seam4]);
  if (!merged) throw new Error('Failed to merge ball geometries');

  // Rotate the ball so the seam runs diagonally across the front, matching the reference image
  merged.rotateX(Math.PI / 4); // Tilt forward
  merged.rotateY(Math.PI / 4); // Turn diagonally
  merged.rotateZ(Math.PI / 8); // Slight twist

  return sampleSurface(merged, count);
}

/**
 * Cricket Helmet — Dome + Visor + Face guard
 * Scale: ~4 units
 */
export function generateHelmetPositions(count: number = PARTICLE_COUNT): Float32Array {
  // Main dome (half sphere)
  const dome = new THREE.SphereGeometry(2, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6);
  dome.translate(0, 0.5, 0);

  // Brim / visor peak
  const brim = new THREE.RingGeometry(1.8, 2.5, 32, 2);
  brim.rotateX(-Math.PI / 3);
  brim.translate(0, -0.2, 1.2);

  // Ear guards (two half-cylinders on sides)
  const earLeft = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 12, 4, true, 0, Math.PI);
  earLeft.rotateY(Math.PI / 2);
  earLeft.translate(-2.0, -0.3, 0);

  const earRight = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 12, 4, true, 0, Math.PI);
  earRight.rotateY(-Math.PI / 2);
  earRight.translate(2.0, -0.3, 0);

  // Face guard bars (3 horizontal bars)
  const bars: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.TorusGeometry(1.6 - i * 0.15, 0.04, 6, 24, Math.PI * 0.8);
    bar.rotateY(Math.PI / 2);
    bar.rotateX(Math.PI * 0.1);
    bar.translate(0, -0.8 - i * 0.3, 1.0);
    bars.push(bar);
  }

  const merged = mergeGeometries([dome, brim, earLeft, earRight, ...bars]);
  if (!merged) throw new Error('Failed to merge helmet geometries');
  merged.center();

  return sampleSurface(merged, count);
}

/**
 * Cricket Stumps — 3 vertical cylinders
 * Scale: ~6 units tall
 */
export function generateStumpsPositions(count: number = PARTICLE_COUNT): Float32Array {
  const stumps: THREE.BufferGeometry[] = [];
  const stumpSpacing = 0.9;

  for (let i = -1; i <= 1; i++) {
    const stump = new THREE.CylinderGeometry(0.12, 0.12, 5, 12, 8);
    stump.translate(i * stumpSpacing, 2.5, 0);
    stumps.push(stump);

    // Pointed top
    const top = new THREE.ConeGeometry(0.12, 0.3, 12);
    top.translate(i * stumpSpacing, 5.15, 0);
    stumps.push(top);
  }

  // Ground line
  const ground = new THREE.BoxGeometry(3.0, 0.05, 0.3);
  ground.translate(0, 0, 0);
  stumps.push(ground);

  const merged = mergeGeometries(stumps);
  if (!merged) throw new Error('Failed to merge stumps geometries');
  merged.center();

  return sampleSurface(merged, count);
}

/**
 * Cricket Bails — 2 small cylindrical bails resting on top of stumps
 * Scale: ~3 units wide
 */
export function generateBailsPositions(count: number = PARTICLE_COUNT): Float32Array {
  const bails: THREE.BufferGeometry[] = [];

  // Helper to create a single detailed bail
  const createBail = () => {
    const parts: THREE.BufferGeometry[] = [];
    
    // Central barrel
    const barrel = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 16);
    parts.push(barrel);

    // Left ridge
    const leftRidge = new THREE.TorusGeometry(0.13, 0.04, 8, 32);
    leftRidge.rotateX(Math.PI / 2);
    leftRidge.translate(0, 0.6, 0);
    parts.push(leftRidge);

    // Right ridge
    const rightRidge = new THREE.TorusGeometry(0.13, 0.04, 8, 32);
    rightRidge.rotateX(Math.PI / 2);
    rightRidge.translate(0, -0.6, 0);
    parts.push(rightRidge);

    // Left spigot (short)
    const leftSpigot = new THREE.CylinderGeometry(0.07, 0.07, 0.4, 12);
    leftSpigot.translate(0, 0.8, 0);
    parts.push(leftSpigot);

    // Right spigot (long)
    const rightSpigot = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 12);
    rightSpigot.translate(0, -0.9, 0);
    parts.push(rightSpigot);

    return mergeGeometries(parts) as THREE.BufferGeometry;
  };

  // Bail 1
  const bail1 = createBail();
  bail1.rotateZ(-Math.PI / 4); // Diagonal slant
  bail1.translate(-0.3, 0.5, 0.2);
  bails.push(bail1);

  // Bail 2
  const bail2 = createBail();
  bail2.rotateZ(Math.PI / 3); // Opposite diagonal slant
  bail2.rotateX(Math.PI / 8); // Slight depth tilt
  bail2.translate(0.5, -0.2, -0.2);
  bails.push(bail2);

  const merged = mergeGeometries(bails);
  if (!merged) throw new Error('Failed to merge bails geometries');
  
  merged.center();
  merged.scale(2.0, 2.0, 2.0);

  // Rotate entire group slightly for a dynamic falling/resting view
  merged.rotateX(Math.PI / 6);
  merged.rotateY(-Math.PI / 12);

  return sampleSurface(merged, count);
}

/**
 * ICC Cricket World Cup Trophy — Cup shape via LatheGeometry
 * Scale: ~6 units tall
 */
export function generateTrophyPositions(count: number = PARTICLE_COUNT): Float32Array {
  // Trophy profile (2D cross-section to lathe)
  const points: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),    // Bottom center
    new THREE.Vector2(0.8, 0.0),    // Base outer
    new THREE.Vector2(0.8, 0.3),    // Base top
    new THREE.Vector2(0.3, 0.5),    // Stem bottom
    new THREE.Vector2(0.2, 1.5),    // Stem
    new THREE.Vector2(0.15, 2.5),   // Stem narrow
    new THREE.Vector2(0.3, 3.0),    // Bowl start
    new THREE.Vector2(0.8, 3.8),    // Bowl mid
    new THREE.Vector2(1.2, 4.5),    // Bowl wide
    new THREE.Vector2(1.4, 5.0),    // Bowl top
    new THREE.Vector2(1.3, 5.3),    // Rim
    new THREE.Vector2(1.35, 5.4),   // Rim lip
  ];

  const trophy = new THREE.LatheGeometry(points, 48);

  // Globe on top
  const globe = new THREE.SphereGeometry(0.6, 24, 24);
  globe.translate(0, 5.8, 0);

  // Handles (two arcs on the sides)
  const handleLeft = new THREE.TorusGeometry(0.8, 0.08, 8, 24, Math.PI);
  handleLeft.rotateZ(Math.PI / 2);
  handleLeft.translate(-1.6, 4.2, 0);

  const handleRight = new THREE.TorusGeometry(0.8, 0.08, 8, 24, Math.PI);
  handleRight.rotateZ(-Math.PI / 2);
  handleRight.translate(1.6, 4.2, 0);

  const merged = mergeGeometries([trophy, globe, handleLeft, handleRight]);
  if (!merged) throw new Error('Failed to merge trophy geometries');
  merged.center();

  return sampleSurface(merged, count);
}

/**
 * Generate all morph targets at once.
 * Returns an object with Float32Array for each target.
 */
export function generateAllTargets(count: number = PARTICLE_COUNT) {
  return {
    random: generateRandomPositions(count),
    bat: generateBatPositions(count),
    ball: generateBallPositions(count),
    helmet: generateHelmetPositions(count),
    stumps: generateStumpsPositions(count),
    bails: generateBailsPositions(count),
    trophy: generateTrophyPositions(count),
  };
}

export { PARTICLE_COUNT };
