'use client';

/**
 * CameraRig — Scroll-driven cinematic camera movement.
 * Uses CatmullRomCurve3 for smooth spline-based path.
 * Camera approaches, flies through, and emerges from each object.
 */

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraRigProps {
  scrollProgressRef: React.RefObject<number>;
  mouseRef: React.RefObject<THREE.Vector2>;
}

export default function CameraRig({ scrollProgressRef, mouseRef }: CameraRigProps) {
  const { camera } = useThree();
  const smoothProgress = useRef(0);
  const smoothMouse = useRef(new THREE.Vector2(0, 0));

  // Camera path keyframes — positions along the journey
  const cameraPath = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 15),      // Start: viewing galaxy close
      new THREE.Vector3(0, 0.5, 10),    // Drift in toward bat
      new THREE.Vector3(0, 0.3, 6),     // Close to bat
      new THREE.Vector3(0, 0, 2),       // Inside bat
      new THREE.Vector3(-0.5, 0.3, 7),  // Pull back for ball
      new THREE.Vector3(-0.3, 0, 3.5),  // Close to ball
      new THREE.Vector3(0, -0.3, 1),    // Through ball seam
      new THREE.Vector3(0.5, 0.5, 7),   // Pull back for helmet
      new THREE.Vector3(0.3, 0.3, 3.5), // Close to helmet
      new THREE.Vector3(0, 0, 1),       // Into visor
      new THREE.Vector3(-1, 0, 8),      // Pull back for stumps
      new THREE.Vector3(0, -0.5, 4),    // Between stumps
      new THREE.Vector3(0, 0.5, 2),     // Under bails
      new THREE.Vector3(0, 2, 10),      // Pull way back for trophy reveal
      new THREE.Vector3(0, 1, 6),       // Trophy approach
      new THREE.Vector3(0, 0.5, 3),     // Trophy close
      new THREE.Vector3(0, 0, 15),      // Final: float away into universe
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, []);

  // Look-at target path
  const lookAtPath = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -3),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -3),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, []);

  useFrame((_, delta) => {
    const targetProgress = scrollProgressRef.current ?? 0;

    // Ultra-smooth cinematic interpolation
    const lerpFactor = 1 - Math.pow(0.005, delta);
    smoothProgress.current += (targetProgress - smoothProgress.current) * lerpFactor;

    const t = Math.min(Math.max(smoothProgress.current, 0), 0.999);

    // Continuous forward movement
    // Total distance = 8 cycles * 30 units = 240 units.
    // Starts at 12 to match cycle formation
    const cameraZ = 12 - t * 240;

    // Remove wobble, just a perfectly straight cinematic push
    const targetX = 0;
    const targetY = 0;

    // Smoothly update camera
    camera.position.set(targetX, targetY, cameraZ);

    // Look slightly ahead
    camera.lookAt(targetX, targetY, cameraZ - 10);
  });

  return null;
}
