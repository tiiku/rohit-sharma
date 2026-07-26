'use client';

/**
 * MorphSystem — 30,000 GPU particles that morph between cricket objects.
 * Core visual element of the experience.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { morphVertexShader, morphFragmentShader } from '@/lib/shaders';
import { createMorphParticleSystem } from '@/lib/particleEngine';
import { getMorphState } from '@/hooks/useMorph';

interface MorphSystemProps {
  scrollProgressRef: React.RefObject<number>;
  mouseRef: React.RefObject<THREE.Vector2>;
  mouseWorldRef: React.RefObject<THREE.Vector3>;
}

export default function MorphSystem({ scrollProgressRef, mouseRef, mouseWorldRef }: MorphSystemProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry } = useMemo(() => {
    return createMorphParticleSystem();
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorphProgress: { value: 0 },
      uMorphStage: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseWorld: { value: new THREE.Vector3(0, 0, 0) },
      uBreathing: { value: 1.0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      const progress = scrollProgressRef.current ?? 0;
      const morphState = getMorphState(progress);

      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uMorphStage.value = morphState.stage;
      materialRef.current.uniforms.uMorphProgress.value = morphState.morphT;
      materialRef.current.uniforms.uBreathing.value = 1.0;

      if (mouseRef.current) {
        materialRef.current.uniforms.uMouse.value.copy(mouseRef.current);
      }
      if (mouseWorldRef.current) {
        materialRef.current.uniforms.uMouseWorld.value.copy(mouseWorldRef.current);
      }
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry attach="geometry" {...geometry} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={morphVertexShader}
        fragmentShader={morphFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
