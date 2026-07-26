'use client';

/**
 * Track normalized mouse position (-1 to 1) and project to 3D world coordinates.
 * Uses refs to avoid re-renders.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function useMousePosition() {
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const mouseWorldRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        targetRef.current.set(
          (touch.clientX / window.innerWidth) * 2 - 1,
          -(touch.clientY / window.innerHeight) * 2 + 1
        );
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Smooth interpolation via rAF
    let frameId: number;
    const lerp = () => {
      mouseRef.current.lerp(targetRef.current, 0.05);

      // Project to world space (simple approximation at z=0 plane)
      mouseWorldRef.current.set(
        mouseRef.current.x * 10,
        mouseRef.current.y * 6,
        0
      );

      frameId = requestAnimationFrame(lerp);
    };
    frameId = requestAnimationFrame(lerp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return { mouseRef, mouseWorldRef };
}
