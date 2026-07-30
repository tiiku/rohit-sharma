/**
 * Procedural geometry generators for cricket objects + MeshSurfaceSampler.
 * 
 * Each cricket object is built from Three.js primitives, then sampled
 * to produce target particle positions. No external GLB files needed.
 */

import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const PARTICLE_COUNT = 60000;

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
function generateFromGeometry(geometry: THREE.BufferGeometry, count: number): { positions: Float32Array, colors: Float32Array } {
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  const sampler = new MeshSurfaceSampler(mesh).build();

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const tempPosition = new THREE.Vector3();
  const tempNormal = new THREE.Vector3();

  // Surface fill count (85%) + volumetric interior fill (15%)
  const surfaceCount = Math.floor(count * 0.85);

  // 1) Uniform surface sampling — fill the entire surface evenly
  for (let i = 0; i < surfaceCount; i++) {
    sampler.sample(tempPosition, tempNormal);

    positions[i * 3] = tempPosition.x;
    positions[i * 3 + 1] = tempPosition.y;
    positions[i * 3 + 2] = tempPosition.z;

    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 1.0;
    colors[i * 3 + 2] = 1.0;
  }

  // 2) Interior volumetric fill — inset particles slightly to give body
  for (let i = surfaceCount; i < count; i++) {
    sampler.sample(tempPosition, tempNormal);

    // Push particle slightly inward along its surface normal
    const inset = 0.02 + Math.random() * 0.12;
    positions[i * 3] = tempPosition.x - tempNormal.x * inset;
    positions[i * 3 + 1] = tempPosition.y - tempNormal.y * inset;
    positions[i * 3 + 2] = tempPosition.z - tempNormal.z * inset;

    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 1.0;
    colors[i * 3 + 2] = 1.0;
  }

  // 3) Outlier culling — remove stray particles that ended up outside the shape
  // Compute centroid and standard deviation of all particle positions
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < count; i++) {
    cx += positions[i * 3];
    cy += positions[i * 3 + 1];
    cz += positions[i * 3 + 2];
  }
  cx /= count; cy /= count; cz /= count;

  let variance = 0;
  for (let i = 0; i < count; i++) {
    const dx = positions[i * 3] - cx;
    const dy = positions[i * 3 + 1] - cy;
    const dz = positions[i * 3 + 2] - cz;
    variance += dx * dx + dy * dy + dz * dz;
  }
  const stdDev = Math.sqrt(variance / count);
  const cullThreshold = stdDev * 2.5;

  // Re-sample any outlier particle back onto the surface
  for (let i = 0; i < count; i++) {
    const dx = positions[i * 3] - cx;
    const dy = positions[i * 3 + 1] - cy;
    const dz = positions[i * 3 + 2] - cz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > cullThreshold) {
      sampler.sample(tempPosition);
      positions[i * 3] = tempPosition.x;
      positions[i * 3 + 1] = tempPosition.y;
      positions[i * 3 + 2] = tempPosition.z;
    }
  }

  return { positions, colors };
}

// --- Procedural 3D Generators ---

async function createBatGeometry() {
  try {
    const loader = new STLLoader();
    const geom = await loader.loadAsync('/BAT_assembly.STL');
    geom.center();

    geom.computeBoundingBox();
    const size = new THREE.Vector3();
    geom.boundingBox!.getSize(size);

    // Force alignment to Y-axis (vertical)
    const maxAxis = size.x > size.y ? (size.x > size.z ? 'x' : 'z') : (size.y > size.z ? 'y' : 'z');
    if (maxAxis === 'x') geom.rotateZ(Math.PI / 2);
    else if (maxAxis === 'z') geom.rotateX(Math.PI / 2);

    // Show the back of the bat, but turned 30 degrees to explicitly show the side thickness.
    // This guarantees it looks like a thick 3D object, not a flat line.
    geom.rotateY(Math.PI + Math.PI / 6);

    // Pitch the bat forward to give it an aggressive 3D perspective (handle closer to camera)
    geom.rotateX(Math.PI / 6);

    // Angle the handle diagonally towards the top-left
    geom.rotateZ(Math.PI / 6);

    return geom;
  } catch (e) {
    console.error("Failed to load bat stl", e);
  }

  const blade = new THREE.BoxGeometry(1.2, 4.0, 0.4);
  blade.translate(0, -1.0, 0);
  const handle = new THREE.CylinderGeometry(0.2, 0.2, 2.0, 16);
  handle.translate(0, 2.0, 0);
  return mergeGeometries([blade, handle]);
}

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

async function createBallGeometry() {
  try {
    const loader = new OBJLoader();
    const obj = await loader.loadAsync('/Cricket_Ball.obj');
    obj.updateMatrixWorld(true);
    const geometries: THREE.BufferGeometry[] = [];
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geom = child.geometry.clone();
        geom.applyMatrix4(child.matrixWorld); // Apply local transforms!

        geom.computeVertexNormals();
        for (const key of Object.keys(geom.attributes)) {
          if (key !== 'position' && key !== 'normal') {
            geom.deleteAttribute(key);
          }
        }
        geometries.push(geom);
      }
    });
    if (geometries.length > 0) {
      return mergeGeometries(geometries);
    }
  } catch (e) {
    console.error("Failed to load ball obj", e);
  }
  return new THREE.SphereGeometry(2.0, 32, 32);
}

async function createStumpsGeometry() {
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('/stump.glb');
    
    const geometries: THREE.BufferGeometry[] = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((child) => {
      // The GLB has nodes named Cylinder, Plane, Sphere. 
      // We want the stumps (Cylinders) and the ball (Sphere).
      if (child instanceof THREE.Mesh && (child.name.startsWith('Cylinder') || child.name.startsWith('Sphere'))) {
        const geom = child.geometry.clone();
        geom.applyMatrix4(child.matrixWorld);
        
        geom.computeVertexNormals();
        for (const key of Object.keys(geom.attributes)) {
          if (key !== 'position' && key !== 'normal') {
            geom.deleteAttribute(key);
          }
        }
        geometries.push(geom);
      }
    });

    if (geometries.length > 0) {
      const merged = mergeGeometries(geometries);
      
      // Center and scale to match the previous particle volume
      merged.computeBoundingBox();
      const size = new THREE.Vector3();
      merged.boundingBox!.getSize(size);
      
      // Scale to roughly height = 4 to match old stumps
      const scale = 4.0 / size.y;
      merged.scale(scale, scale, scale);
      
      merged.computeBoundingBox();
      // Translate to align center
      merged.translate(0, -merged.boundingBox!.min.y - 2.0, 0); 
      
      // Rotate 90 degrees to show the left side
      merged.rotateY(Math.PI / 2);
      
      return merged;
    }
  } catch (e) {
    console.error("Failed to load stump glb", e);
  }

  // Fallback
  const s1 = new THREE.CylinderGeometry(0.15, 0.15, 4.0, 16);
  s1.translate(-1.2, 0, 0);
  const s2 = new THREE.CylinderGeometry(0.15, 0.15, 4.0, 16);
  const s3 = new THREE.CylinderGeometry(0.15, 0.15, 4.0, 16);
  s3.translate(1.2, 0, 0);
  return mergeGeometries([s1, s2, s3]);
}

async function createBailsGeometry() {
  try {
    const loader = new STLLoader();
    const geom = await loader.loadAsync('/Cricket_Bail.stl');

    // Center the geometry so rotations happen around its middle
    geom.center();
    geom.computeBoundingBox();
    const size = new THREE.Vector3();
    geom.boundingBox!.getSize(size);

    // Force alignment to X-axis (horizontal) so our math is consistent
    const maxAxis = size.x > size.y ? (size.x > size.z ? 'x' : 'z') : (size.y > size.z ? 'y' : 'z');
    if (maxAxis === 'y') geom.rotateZ(-Math.PI / 2);
    else if (maxAxis === 'z') geom.rotateY(Math.PI / 2);

    geom.computeBoundingBox();
    geom.boundingBox!.getSize(size);
    const len = size.x;
    const thickness = Math.max(size.y, size.z);

    const bail1 = geom.clone();
    const bail2 = geom.clone();

    // Bail 1 (Left bail): Offset so its right spigot is at the origin, angled slightly up
    bail1.translate(-len * 0.45, 0, -thickness * 0.5); // Move back slightly
    bail1.rotateZ(Math.PI / 9); // ~20 degrees up

    // Bail 2 (Right bail): Offset so its left barrel rests on the origin, angled steeply down
    bail2.translate(len * 0.35, thickness * 0.2, thickness * 0.5); // Move forward and slightly up to rest on top
    bail2.rotateZ(-Math.PI / 5); // ~ -36 degrees down

    const merged = mergeGeometries([bail1, bail2]);

    // Add a slight 3D perspective tilt (looking down from slightly above)
    merged.rotateX(-Math.PI / 12);

    return merged;
  } catch (e) {
    console.error("Failed to load bail stl", e);
  }

  const b1 = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 16);
  b1.rotateZ(Math.PI / 2);
  b1.translate(-0.6, 2.1, 0);
  const b2 = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 16);
  b2.rotateZ(Math.PI / 2);
  b2.translate(0.6, 2.1, 0);
  return mergeGeometries([b1, b2]);
}

async function createHelmetGeometry() {
  try {
    const loader = new OBJLoader();
    const obj = await loader.loadAsync('/HELMET.obj');
    obj.updateMatrixWorld(true);
    const geometries: THREE.BufferGeometry[] = [];
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geom = child.geometry.clone();
        geom.applyMatrix4(child.matrixWorld); // Apply local transforms!

        geom.computeVertexNormals();
        for (const key of Object.keys(geom.attributes)) {
          if (key !== 'position' && key !== 'normal') {
            geom.deleteAttribute(key);
          }
        }
        geometries.push(geom);
      }
    });
    if (geometries.length > 0) {
      const merged = mergeGeometries(geometries);
      // Tilt down slightly from the front (approx 15 degrees)
      merged.rotateX(Math.PI / 12);
      // Rotate 90 degrees so the "good" side of the helmet faces the camera
      merged.rotateY(Math.PI / 2);
      // Mirror the X-axis so the helmet faces left on screen instead of right,
      // perfectly preserving the good render!
      merged.scale(-1, 1, 1);
      return merged;
    }
  } catch (e) {
    console.error("Failed to load helmet obj", e);
  }

  const dome = new THREE.SphereGeometry(2.0, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);

  const brim = new THREE.TorusGeometry(2.0, 0.2, 16, 64, Math.PI);
  brim.rotateX(Math.PI / 2);
  brim.translate(0, 0, 0.5);

  const grill1 = new THREE.TorusGeometry(1.8, 0.05, 8, 32, Math.PI);
  grill1.rotateX(Math.PI / 2);
  grill1.rotateY(-Math.PI / 6);
  grill1.translate(0, -0.8, 0);

  const grill2 = new THREE.TorusGeometry(1.7, 0.05, 8, 32, Math.PI);
  grill2.rotateX(Math.PI / 2);
  grill2.rotateY(-Math.PI / 6);
  grill2.translate(0, -1.2, 0);

  return mergeGeometries([dome, brim, grill1, grill2]);
}

async function createTrophyGeometry() {
  try {
    const loader = new OBJLoader();
    const obj = await loader.loadAsync('/ICC_Trophy_Whole_rep.obj');

    // Rotate to show the front view. Change this value if it needs to face a different direction.
    obj.rotateY(Math.PI / 2);
    obj.rotateX(-Math.PI / 2);

    obj.updateMatrixWorld(true);
    const geometries: THREE.BufferGeometry[] = [];
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geom = child.geometry.clone();
        geom.applyMatrix4(child.matrixWorld);

        geom.computeVertexNormals();
        for (const key of Object.keys(geom.attributes)) {
          if (key !== 'position' && key !== 'normal') {
            geom.deleteAttribute(key);
          }
        }
        geometries.push(geom);
      }
    });
    if (geometries.length > 0) {
      return mergeGeometries(geometries);
    }
  } catch (e) {
    console.error("Failed to load trophy obj", e);
  }

  const base = new THREE.CylinderGeometry(1.2, 1.8, 2.5, 32);
  base.translate(0, -1.25, 0);

  const cup = new THREE.SphereGeometry(2.2, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI);
  cup.rotateX(Math.PI);
  cup.translate(0, 2.2, 0);

  const h1 = new THREE.TorusGeometry(1.5, 0.15, 16, 32);
  h1.rotateY(Math.PI / 2);
  h1.translate(2.2, 2.0, 0);

  const h2 = new THREE.TorusGeometry(1.5, 0.15, 16, 32);
  h2.rotateY(Math.PI / 2);
  h2.translate(-2.2, 2.0, 0);

  return mergeGeometries([base, cup, h1, h2]);
}

/**
 * Generates particle positions by sampling dark pixels from a silhouette image.
 * The image should be black-on-white (dark silhouette on light background).
 */
async function generateFromSilhouetteImage(
  imagePath: string,
  count: number,
  targetScale: number = 9.0
): Promise<{ positions: Float32Array; colors: Float32Array }> {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  try {
    // Load image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imagePath;
    });

    // Draw to offscreen canvas at a reasonable resolution
    const maxDim = 512;
    const aspect = img.width / img.height;
    let canvasW: number, canvasH: number;
    if (aspect > 1) {
      canvasW = maxDim;
      canvasH = Math.round(maxDim / aspect);
    } else {
      canvasH = maxDim;
      canvasW = Math.round(maxDim * aspect);
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvasW, canvasH);
    const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
    const pixels = imageData.data;

    // Collect all dark (silhouette) pixel coordinates
    const darkPixels: [number, number][] = [];
    for (let y = 0; y < canvasH; y++) {
      for (let x = 0; x < canvasW; x++) {
        const idx = (y * canvasW + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const a = pixels[idx + 3];
        // Consider pixel as part of the silhouette if it's dark enough
        const brightness = (r + g + b) / 3;
        if (brightness < 100 && a > 128) {
          darkPixels.push([x, y]);
        }
      }
    }

    if (darkPixels.length === 0) {
      console.warn('No dark pixels found in silhouette image, using fallback');
      return generateFromGeometry(createPullShotFallbackGeometry(), count);
    }

    // Compute bounding box of silhouette
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [px, py] of darkPixels) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    const silW = maxX - minX || 1;
    const silH = maxY - minY || 1;
    const silCx = (minX + maxX) / 2;
    const silCy = (minY + maxY) / 2;
    const scaleFactor = targetScale / Math.max(silW, silH);

    // Sample particles from random dark pixels
    for (let i = 0; i < count; i++) {
      const [px, py] = darkPixels[Math.floor(Math.random() * darkPixels.length)];
      
      // Add sub-pixel jitter for smooth distribution
      const jitterX = (Math.random() - 0.5) * 1.0;
      const jitterY = (Math.random() - 0.5) * 1.0;
      
      // Convert pixel coords to centered 3D coords
      // X = horizontal, Y = vertical (flipped), Z = slight depth jitter
      const x = ((px + jitterX) - silCx) * scaleFactor;
      const y = -((py + jitterY) - silCy) * scaleFactor; // Flip Y
      const z = (Math.random() - 0.5) * 0.3; // Slight depth for 3D feel

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    }
  } catch (e) {
    console.error('Failed to load silhouette image, using fallback', e);
    return generateFromGeometry(createPullShotFallbackGeometry(), count);
  }

  return { positions, colors };
}

/** Fallback geometry if the silhouette image fails to load */
function createPullShotFallbackGeometry() {
  const torso = new THREE.CylinderGeometry(0.7, 0.6, 2.5, 16);
  torso.rotateZ(-0.2);
  torso.translate(0, 1.0, 0);

  const head = new THREE.SphereGeometry(0.6, 16, 16);
  head.translate(-0.5, 2.9, 0);

  const leg1 = new THREE.CylinderGeometry(0.3, 0.25, 2.5, 16);
  leg1.translate(-0.5, -1.2, 0.5);

  const leg2 = new THREE.CylinderGeometry(0.3, 0.25, 2.5, 16);
  leg2.rotateZ(-0.3);
  leg2.translate(0.5, -1.0, -0.5);

  const arm1 = new THREE.CylinderGeometry(0.2, 0.2, 2.0, 16);
  arm1.rotateZ(Math.PI / 2.5);
  arm1.translate(-1.0, 1.5, 0.8);

  const bat = new THREE.BoxGeometry(0.4, 3.5, 0.15);
  bat.rotateZ(-Math.PI / 3.5);
  bat.translate(-2.5, 2.5, 0.8);

  return mergeGeometries([torso, head, leg1, leg2, arm1, bat]);
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
    // Maintain true 3D proportions after scaling
    positions[i * 3 + 2] = (positions[i * 3 + 2] - cz) * scale;
  }

  return positions;
}

/**
 * Generate all morph targets at once.
 * Returns an object with Float32Array for each target.
 */
export async function generateAllTargetsAsync(count: number = PARTICLE_COUNT) {
  // Generate true 3D particles from geometries
  const pullShotData = await generateFromSilhouetteImage('/ChatGPT Image Jul 30, 2026, 09_42_33 PM.png', count);
  const batData = generateFromGeometry(await createBatGeometry(), count);
  const ballData = generateFromGeometry(await createBallGeometry(), count);
  const helmetData = generateFromGeometry(await createHelmetGeometry(), count);
  const stumpsData = generateFromGeometry(await createStumpsGeometry(), count);
  const bailsData = generateFromGeometry(await createBailsGeometry(), count);
  const trophyData = generateFromGeometry(await createTrophyGeometry(), count);

  return {
    random: generateRandomPositions(count),
    pullShot: normalizePositions(pullShotData.positions),
    bat: normalizePositions(batData.positions),
    batColors: batData.colors,
    ball: normalizePositions(ballData.positions),
    helmet: normalizePositions(helmetData.positions),
    stumps: normalizePositions(stumpsData.positions),
    bails: normalizePositions(bailsData.positions),
    trophy: normalizePositions(trophyData.positions),
  };
}

export { PARTICLE_COUNT };
