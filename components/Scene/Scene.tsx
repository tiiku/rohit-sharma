'use client';

/**
 * Scene — Top-level R3F scene component.
 * Composes all 3D elements: camera, particles, morph system, and postprocessing.
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import CameraRig from '@/components/CameraRig/CameraRig';
import ParticleUniverse from '@/components/ParticleUniverse/ParticleUniverse';
import MorphSystem from '@/components/MorphSystem/MorphSystem';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useMousePosition } from '@/hooks/useMousePosition';

function SceneContent() {
  const { progressRef } = useScrollProgress();
  const { mouseRef, mouseWorldRef } = useMousePosition();

  return (
    <>
      {/* Atmospheric fog */}
      <fog attach="fog" args={['#050301', 15, 80]} />

      {/* Minimal ambient light */}
      <ambientLight intensity={0.1} color="#FFD700" />

      {/* Camera rig */}
      <CameraRig scrollProgressRef={progressRef} mouseRef={mouseRef} />

      {/* Background star universe */}
      <ParticleUniverse scrollProgressRef={progressRef} mouseRef={mouseRef} />

      {/* Main morph particle system */}
      <MorphSystem
        scrollProgressRef={progressRef}
        mouseRef={mouseRef}
        mouseWorldRef={mouseWorldRef}
      />

      {/* Subtle bloom postprocessing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.4}
          intensity={0.4}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      id="scene-canvas"
      camera={{
        fov: 60,
        near: 0.1,
        far: 200,
        position: [0, 0, 20],
      }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.8,
      }}
      dpr={[1, 1.5]}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        background: '#050301',
      }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
