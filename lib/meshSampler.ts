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
export async function generateBatPositionsAsync(count: number = PARTICLE_COUNT): Promise<{positions: Float32Array, colors: Float32Array}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = '/bat.png'; // Load from public directory
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to empty array if no canvas
        return resolve({ positions: new Float32Array(count * 3), colors: new Float32Array(count * 3) });
      }
      
      const targetSize = 200;
      const ratio = img.width / img.height;
      canvas.width = ratio > 1 ? targetSize : targetSize * ratio;
      canvas.height = ratio > 1 ? targetSize / ratio : targetSize;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      const validPixels: {x: number, y: number, r: number, g: number, b: number}[] = [];
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const alpha = imgData[idx + 3];
          if (alpha > 50) { // Non-transparent pixel
             validPixels.push({
               x, y, 
               r: imgData[idx] / 255, 
               g: imgData[idx+1] / 255, 
               b: imgData[idx+2] / 255
             });
          }
        }
      }
      
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      if (validPixels.length === 0) return resolve({ positions, colors });
      
      for (let i = 0; i < count; i++) {
        const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
        
        // Maintain correct aspect ratio based on targetSize
        const px = ((pixel.x / canvas.width) - 0.5) * (canvas.width / targetSize) * 7.0;
        const py = -((pixel.y / canvas.height) - 0.5) * (canvas.height / targetSize) * 7.0;
        
        // Add tiny random jitter
        const jitterX = (Math.random() - 0.5) * (7.0 / targetSize);
        const jitterY = (Math.random() - 0.5) * (7.0 / targetSize);
        
        positions[i * 3] = px + jitterX;
        positions[i * 3 + 1] = py + jitterY;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4; // slight thickness

        colors[i * 3] = pixel.r;
        colors[i * 3 + 1] = pixel.g;
        colors[i * 3 + 2] = pixel.b;
      }
      
      resolve({ positions, colors });
    };
    img.onerror = () => {
      console.warn("Could not load bat.png, falling back to empty positions");
      resolve({ positions: new Float32Array(count * 3), colors: new Float32Array(count * 3) });
    };
  });
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
 * Rohit Sharma Pull Shot Figure
 * Generated from a silhouette image
 */
export async function generatePullShotPositionsAsync(count: number = PARTICLE_COUNT): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = '/pull_shot_silhouette.png';
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(new Float32Array(count * 3));
      }
      
      const targetSize = 200;
      const ratio = img.width / img.height;
      canvas.width = ratio > 1 ? targetSize : targetSize * ratio;
      canvas.height = ratio > 1 ? targetSize / ratio : targetSize;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      const validPixels: {x: number, y: number}[] = [];
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = imgData[idx] / 255;
          const g = imgData[idx+1] / 255;
          const b = imgData[idx+2] / 255;
          const alpha = imgData[idx+3];
          
          // Sample dark pixels (silhouette)
          if (alpha > 50 && (r + g + b) < 1.5) {
             validPixels.push({ x, y });
          }
        }
      }
      
      const positions = new Float32Array(count * 3);
      if (validPixels.length === 0) return resolve(positions);
      
      for (let i = 0; i < count; i++) {
        const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
        
        // Scale to match scene size (~7 units)
        const px = ((pixel.x / canvas.width) - 0.5) * (canvas.width / targetSize) * 7.0;
        const py = -((pixel.y / canvas.height) - 0.5) * (canvas.height / targetSize) * 7.0;
        
        const jitterX = (Math.random() - 0.5) * (7.0 / targetSize);
        const jitterY = (Math.random() - 0.5) * (7.0 / targetSize);
        
        positions[i * 3] = px + jitterX;
        positions[i * 3 + 1] = py + jitterY;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      }
      
      resolve(positions);
    };
    img.onerror = () => {
      console.warn("Could not load pull_shot_silhouette.png, falling back to empty positions");
      resolve(new Float32Array(count * 3));
    };
  });
}

/**
 * Normalizes a set of positions to a standard bounding box scale and centers it.
 * This ensures all shapes appear the exact same size on screen.
 */
function normalizePositions(positions: Float32Array, targetScale: number = 4.5): Float32Array {
  const count = positions.length / 3;
  if (count === 0) return positions;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const scale = targetScale / maxDim;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (positions[i * 3] - cx) * scale;
    positions[i * 3 + 1] = (positions[i * 3 + 1] - cy) * scale;
    positions[i * 3 + 2] = (positions[i * 3 + 2] - cz) * scale;
  }

  return positions;
}

/**
 * Generate all morph targets at once.
 * Returns an object with Float32Array for each target.
 */
export async function generateAllTargetsAsync(count: number = PARTICLE_COUNT) {
  const batData = await generateBatPositionsAsync(count);
  const pullShotPositions = await generatePullShotPositionsAsync(count);
  return {
    random: generateRandomPositions(count),
    pullShot: normalizePositions(pullShotPositions),
    bat: normalizePositions(batData.positions),
    batColors: batData.colors,
    ball: normalizePositions(generateBallPositions(count)),
    helmet: normalizePositions(generateHelmetPositions(count)),
    stumps: normalizePositions(generateStumpsPositions(count)),
    bails: normalizePositions(generateBailsPositions(count)),
    trophy: normalizePositions(generateTrophyPositions(count)),
  };
}

export { PARTICLE_COUNT };
