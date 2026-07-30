'use client';

import React, { useRef, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

interface CricketBallProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

export default function CricketBall(props: CricketBallProps) {
  // Load the OBJ file from the public directory
  const obj = useLoader(OBJLoader, '/Cricket_Ball.obj');
  const groupRef = useRef<THREE.Group>(null);

  // Clone the object so we can safely mutate materials or geometry if needed,
  // without affecting the cached original.
  const clonedObj = useMemo(() => {
    const clone = obj.clone();

    // Optional: Traverse and apply materials if the OBJ lacks an MTL file
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Apply a generic red leather-like material to the ball if you don't have textures
        child.material = new THREE.MeshStandardMaterial({
          color: '#8b0000', // Dark red
          roughness: 0.7,
          metalness: 0.1,
        });
      }
    });

    return clone;
  }, [obj]);

  return (
    <group ref={groupRef} {...props}>
      <primitive object={clonedObj} />
    </group>
  );
}
