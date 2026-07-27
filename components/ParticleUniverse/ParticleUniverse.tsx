'use client';

/**
 * ParticleUniverse — 100,000 background star particles.
 * Creates an immersive starfield that drifts, rotates, and responds to scroll.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { backgroundVertexShader, backgroundFragmentShader } from '@/lib/shaders';
import { createBackgroundParticleSystem } from '@/lib/particleEngine';

interface ParticleUniverseProps {
  scrollProgressRef: React.RefObject<number>;
  mouseRef: React.RefObject<THREE.Vector2>;
}

export default function ParticleUniverse({ scrollProgressRef, mouseRef }: ParticleUniverseProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry } = useMemo(() => {
    return createBackgroundParticleSystem(80000);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uCameraZ: { value: 12 },
    }),
    []
  );

  useFrame(({ clock, camera }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uScrollProgress.value = scrollProgressRef.current ?? 0;
      materialRef.current.uniforms.uCameraZ.value = camera.position.z;
      if (mouseRef.current) {
        materialRef.current.uniforms.uMouse.value.copy(mouseRef.current);
      }
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry attach="geometry" {...geometry} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={backgroundVertexShader}
        fragmentShader={backgroundFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
