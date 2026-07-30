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

  const displacements = useMemo(() => new Float32Array(60000 * 3), []);
  const velocities = useMemo(() => new Float32Array(60000 * 3), []);
  const dispAttrRef = useRef<THREE.BufferAttribute>(null);

  useEffect(() => {
    let active = true;
    createMorphParticleSystemAsync().then((sys) => {
      if (active) {
        sys.geometry.setAttribute('aDisplacement', new THREE.BufferAttribute(displacements, 3));
        dispAttrRef.current = sys.geometry.attributes.aDisplacement as THREE.BufferAttribute;
        setGeometry(sys.geometry);
      }
    });
    return () => { active = false; };
  }, [displacements]);

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

  useFrame(({ clock, camera, pointer, size }) => {
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

      // Calculate exact world position on the plane where the mesh is located
      // (We no longer strictly need this for particles, but keeping it for uMouseWorld shader use if needed)
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const meshZ = meshRef.current.position.z;
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -meshZ);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      
      if (target) {
        materialRef.current.uniforms.uMouseWorld.value.copy(target);
      }

      // === CPU PHYSICS FOR DISPLACEMENT ===
      if (geometry && dispAttrRef.current) {
        const stageIndex = Math.floor(morphState.stage);
        const nextStageIndex = Math.floor(morphState.nextStage);

        const getArr = (s: number) => {
          if (s === 0) return geometry.attributes.aPositionRandom.array as Float32Array;
          if (s === 1) return geometry.attributes.aPositionTarget6.array as Float32Array;
          if (s === 2) return geometry.attributes.aPositionTarget0.array as Float32Array;
          if (s === 3) return geometry.attributes.aPositionTarget1.array as Float32Array;
          if (s === 4) return geometry.attributes.aPositionTarget2.array as Float32Array;
          if (s === 5) return geometry.attributes.aPositionTarget3.array as Float32Array;
          if (s === 6) return geometry.attributes.aPositionTarget4.array as Float32Array;
          if (s === 7) return geometry.attributes.aPositionTarget5.array as Float32Array;
          return geometry.attributes.aPositionRandom.array as Float32Array;
        };

        const currArr = getArr(stageIndex);
        const nextArr = getArr(nextStageIndex);
        const randoms = geometry.attributes.aRandom.array as Float32Array;

        let needsUpdate = false;
        
        // Setup 3D to 2D projection matrix
        const aspect = size.width / size.height;
        const mvp = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        mvp.multiply(meshRef.current.matrixWorld);
        const e = mvp.elements;
        
        for (let i = 0; i < 60000; i++) {
          const idx = i * 3;

          let dx = displacements[idx];
          let dy = displacements[idx + 1];
          let dz = displacements[idx + 2];
          let vx = velocities[idx];
          let vy = velocities[idx + 1];
          let vz = velocities[idx + 2];

          // Compute exact base position
          const r = randoms[i];
          let particleT = morphState.morphT * 1.5 - r * 0.5;
          particleT = Math.max(0, Math.min(1, particleT));
          const smoothT = 1.0 - Math.pow(1.0 - particleT, 3.0);

          const bx = currArr[idx] + (nextArr[idx] - currArr[idx]) * smoothT;
          const by = currArr[idx + 1] + (nextArr[idx + 1] - currArr[idx + 1]) * smoothT;
          const bz = currArr[idx + 2] + (nextArr[idx + 2] - currArr[idx + 2]) * smoothT;

          // Particle position in local space
          const px = bx + dx;
          const py = by + dy;
          const pz = bz + dz;

          // 2D Screen Space Interaction
          const w = px * e[3] + py * e[7] + pz * e[11] + e[15];
          if (w > 0) {
            // Convert to NDC (-1 to 1)
            const nx = (px * e[0] + py * e[4] + pz * e[8] + e[12]) / w;
            const ny = (px * e[1] + py * e[5] + pz * e[9] + e[13]) / w;

            // Calculate distance to mouse in screen space (adjusted for aspect ratio)
            const mx = (nx - pointer.x) * aspect;
            const my = ny - pointer.y;
            const distSq = mx * mx + my * my;
            
            // Target radius in NDC (0.04 is a slightly larger, more comfortable hover radius)
            const radius = 0.04;

            if (distSq < radius * radius && distSq > 0.000001) {
              const dist = Math.sqrt(distSq);
              const force = (radius - dist) / radius;
              const eased = force * force * (3 - 2 * force);

              // Apply 3D physical force based on the 2D cursor proximity
              vx += (mx / dist) * eased * 0.08;
              vy += (my / dist) * eased * 0.08;
              
              // Swirl (tangential force)
              vx += -my * eased * 0.04;
              vy += mx * eased * 0.04;
              
              // Add a slight Z pop for organic 3D volume
              vz += eased * 0.02;
            }
          }

          // Spring physics to return to base
          vx += (0 - dx) * 0.04; // Spring K
          vy += (0 - dy) * 0.04;
          vz += (0 - dz) * 0.04;

          // Damping
          vx *= 0.85;
          vy *= 0.85;
          vz *= 0.85;

          dx += vx;
          dy += vy;
          dz += vz;

          // Only write if particle is moving or displaced
          if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001 || Math.abs(dz) > 0.001 || Math.abs(vx) > 0.001 || Math.abs(vy) > 0.001 || Math.abs(vz) > 0.001) {
            needsUpdate = true;
            displacements[idx] = dx;
            displacements[idx + 1] = dy;
            displacements[idx + 2] = dz;
            velocities[idx] = vx;
            velocities[idx + 1] = vy;
            velocities[idx + 2] = vz;
          } else {
            displacements[idx] = 0;
            displacements[idx + 1] = 0;
            displacements[idx + 2] = 0;
            velocities[idx] = 0;
            velocities[idx + 1] = 0;
            velocities[idx + 2] = 0;
          }
        }

        if (needsUpdate) {
          dispAttrRef.current.needsUpdate = true;
        }
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
