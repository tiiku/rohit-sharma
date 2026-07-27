'use client';

/**
 * MorphSystem — 30,000 GPU particles that morph between cricket objects.
 * Core visual element of the experience.
 */

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { morphVertexShader, morphFragmentShader } from '@/lib/shaders';
import { createMorphParticleSystemAsync } from '@/lib/particleEngine';
import { getMorphState } from '@/hooks/useMorph';

interface MorphSystemProps {
  scrollProgressRef: React.RefObject<number>;
  mouseRef: React.RefObject<THREE.Vector2>;
  mouseWorldRef: React.RefObject<THREE.Vector3>;
}

export default function MorphSystem({ scrollProgressRef, mouseRef, mouseWorldRef }: MorphSystemProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let active = true;
    createMorphParticleSystemAsync().then((sys) => {
      if (active) {
        setGeometry(sys.geometry);
      }
    });
    return () => { active = false; };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorphProgress: { value: 0 },
      uMorphStage: { value: 0 },
      uMorphNextStage: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseWorld: { value: new THREE.Vector3(0, 0, 0) },
      uBreathing: { value: 1.0 },
    }),
    []
  );

  const meshRef = useRef<THREE.Points>(null);

  useFrame(({ clock, camera, pointer }) => {
    if (materialRef.current && meshRef.current) {
      const progress = scrollProgressRef.current ?? 0;
      const morphState = getMorphState(progress);

      const numStages = 8;
      const cycleLength = 1.0 / numStages;
      const cycleIdx = Math.floor(Math.min(progress, 0.999) / cycleLength);

      // Snap the entire particle system to the current cycle's depth
      meshRef.current.position.z = -cycleIdx * 30;

      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uMorphStage.value = morphState.stage;
      materialRef.current.uniforms.uMorphNextStage.value = morphState.nextStage;
      materialRef.current.uniforms.uMorphProgress.value = morphState.morphT;
      materialRef.current.uniforms.uBreathing.value = 1.0;

      if (mouseRef.current) {
        materialRef.current.uniforms.uMouse.value.copy(mouseRef.current);
      }

      // Calculate exact world position on z=0 plane matching cursor tip
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      
      if (target) {
        materialRef.current.uniforms.uMouseWorld.value.copy(target);
      }
    }
  });

  if (!geometry) return null;

  return (
    <points ref={meshRef} frustumCulled={false}>
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
