'use client';

/**
 * Hook to track Lenis scroll progress (0–1).
 * Uses a ref to avoid React re-renders on every scroll frame.
 */

import { useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';

export function useScrollProgress() {
  const progressRef = useRef(0);
  const lenisRef = useRef<Lenis | null>(null);

  const getProgress = useCallback(() => progressRef.current, []);

  useEffect(() => {
    // Find existing Lenis instance from ReactLenis or create listener
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        progressRef.current = Math.min(Math.max(scrollTop / docHeight, 0), 1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial value

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { progressRef, getProgress };
}
