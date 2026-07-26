'use client';

/**
 * Main page — Assembles the entire Rohit Sharma tribute experience.
 * 
 * Structure:
 * 1. Loader (264* count-up)
 * 2. Fixed WebGL Canvas (Scene)
 * 3. Scroll spacer (800vh)
 * 4. Text overlays
 * 5. Scroll indicator
 * 6. Progress track
 */

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import Loader from '@/components/Loader/Loader';
import Overlays from '@/components/Overlays/Overlays';
import ScrollIndicator from '@/components/ScrollIndicator/ScrollIndicator';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';
import MemoryFlashback from '@/components/MemoryFlashback/MemoryFlashback';
import Lenis from 'lenis';

// Dynamic import for the heavy 3D scene
const Scene = lazy(() => import('@/components/Scene/Scene'));

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  const handleLoaderComplete = useCallback(() => {
    setLoaded(true);
  }, []);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Progress bar tracker
  const scrollProgressRef = useRef(0);
  
  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const p = scrollTop / docHeight;
        scrollProgressRef.current = p;
      }
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <>
      {/* Loading screen */}
      <Loader onComplete={handleLoaderComplete} />

      {/* 3D Scene (lazy loaded) */}
      {loaded && (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      )}

      {/* Scroll spacer */}
      <div className="scroll-spacer" aria-hidden="true" />

      {/* Text overlays */}
      {loaded && <Overlays />}

      {/* Scroll indicator */}
      {loaded && <ScrollIndicator />}



      {/* Watermark */}
      {loaded && (
        <div className="watermark">
          Tribute to Rohit Sharma
        </div>
      )}

      {/* Background Music */}
      {loaded && <AudioPlayer scrollProgressRef={scrollProgressRef} />}

      {/* Finale Memory Flashback */}
      {loaded && <MemoryFlashback scrollProgressRef={scrollProgressRef} />}
    </>
  );
}
