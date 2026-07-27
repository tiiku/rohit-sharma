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
 * Samples a silhouette image and returns evenly distributed particle positions.
 * Uses a shuffle technique over valid pixels to emulate blue-noise / poisson disk
 * distribution, ensuring no clumping and ~40-50% occupancy.
 */
async function generateFromImageAsync(imagePath: string, count: number): Promise<{positions: Float32Array, colors: Float32Array}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imagePath;
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({ positions: new Float32Array(count * 3), colors: new Float32Array(count * 3) });
      
      // Large canvas to ensure we have way more valid pixels than `count`
      // This prevents particles from sharing the exact same pixel coordinate.
      const targetSize = 600;
      const ratio = img.width / img.height;
      canvas.width = ratio > 1 ? targetSize : targetSize * ratio;
      canvas.height = ratio > 1 ? targetSize / ratio : targetSize;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      const validPixels: {x: number, y: number, r: number, g: number, b: number}[] = [];
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx+1];
          const b = imgData[idx+2];
          
          // Check if pixel is white (silhouette on black background)
          if (r + g + b > 300) {
             validPixels.push({
               x, y, 
               r: r / 255, 
               g: g / 255, 
               b: b / 255
             });
          }
        }
      }
      
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      
      if (validPixels.length === 0) {
        console.warn(`No valid pixels found in ${imagePath}`);
        return resolve({ positions, colors });
      }
      
      // Calculate center of mass for better 3D depth
      let sumX = 0, sumY = 0;
      validPixels.forEach(p => { sumX += p.x; sumY += p.y; });
      const centerX = sumX / validPixels.length;
      const centerY = sumY / validPixels.length;
      
      // Calculate max radius to normalize distance
      let maxDist = 0;
      validPixels.forEach(p => {
        const d = Math.hypot(p.x - centerX, p.y - centerY);
        if (d > maxDist) maxDist = d;
      });
      
      // Fisher-Yates shuffle to randomly distribute selection without replacement (clumping prevention)
      for (let i = validPixels.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = validPixels[i];
        validPixels[i] = validPixels[j];
        validPixels[j] = temp;
      }
      
      for (let i = 0; i < count; i++) {
        // If count > valid pixels, it will safely wrap, but targetSize=600 guarantees enough pixels
        const pixel = validPixels[i % validPixels.length];
        
        let px = ((pixel.x / canvas.width) - 0.5) * (canvas.width / targetSize) * 7.0;
        let py = -((pixel.y / canvas.height) - 0.5) * (canvas.height / targetSize) * 7.0;
        
        // Sub-pixel jitter for organic feel
        const jitterX = (Math.random() - 0.5) * (7.0 / targetSize);
        const jitterY = (Math.random() - 0.5) * (7.0 / targetSize);
        px += jitterX;
        py += jitterY;
        
        // True 3D volume (Pillow/Dome shape)
        // Thicker in the center of mass, tapering off at the edges
        const distFromCenter = Math.hypot(pixel.x - centerX, pixel.y - centerY) / maxDist;
        const thickness = Math.cos(distFromCenter * Math.PI / 2); // 1 at center, 0 at edges
        
        // Add random scatter within that thickness bounds
        // Base volume scale is 2.5 units thick
        const zDepth = (Math.random() - 0.5) * 2.5 * thickness; 
        
        positions[i * 3] = px;
        positions[i * 3 + 1] = py;
        positions[i * 3 + 2] = zDepth;

        colors[i * 3] = pixel.r;
        colors[i * 3 + 1] = pixel.g;
        colors[i * 3 + 2] = pixel.b;
      }
      
      resolve({ positions, colors });
    };
    img.onerror = () => {
      console.warn(`Could not load ${imagePath}`);
      resolve({ positions: new Float32Array(count * 3), colors: new Float32Array(count * 3) });
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
    // Keep Z depth somewhat consistent even after scaling
    positions[i * 3 + 2] = (positions[i * 3 + 2] - cz) * (scale * 0.5); 
  }

  return positions;
}

/**
 * Generate all morph targets at once.
 * Returns an object with Float32Array for each target.
 */
export async function generateAllTargetsAsync(count: number = PARTICLE_COUNT) {
  // Parallel load and sample all 7 SVG/PNG silhouettes
  const [
    pullShotData,
    batData,
    ballData,
    helmetData,
    stumpsData,
    winnersCupData,
    worldCupData
  ] = await Promise.all([
    generateFromImageAsync('/pull_shot_silhouette.png', count),
    generateFromImageAsync('/bat.png', count),
    generateFromImageAsync('/ball.png', count),
    generateFromImageAsync('/helmet.png', count),
    generateFromImageAsync('/stumps.png', count),
    generateFromImageAsync('/winners_cup.png', count),
    generateFromImageAsync('/world_cup.png', count)
  ]);

  return {
    random: generateRandomPositions(count),
    pullShot: normalizePositions(pullShotData.positions),
    bat: normalizePositions(batData.positions),
    batColors: batData.colors,
    ball: normalizePositions(ballData.positions),
    helmet: normalizePositions(helmetData.positions),
    stumps: normalizePositions(stumpsData.positions),
    bails: normalizePositions(winnersCupData.positions), // Re-using bails slot for winners cup
    trophy: normalizePositions(worldCupData.positions),
  };
}

export { PARTICLE_COUNT };
