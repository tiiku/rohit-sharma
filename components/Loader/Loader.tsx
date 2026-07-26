'use client';

/**
 * Loader — Cinematic loading screen featuring Rohit Sharma's 264* score.
 * Counts up from 0 to 264 with golden particles, then fades out.
 */

import { useState, useEffect, useRef } from 'react';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [count, setCount] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    startTimeRef.current = performance.now();
    const duration = 3000; // 3 seconds to count to 264
    const target = 264;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      setCount(value);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(264);
        // Hold for a moment, then fade
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setVisible(false);
            onComplete();
          }, 1200);
        }, 800);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      id="loader-screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          radial-gradient(at 0% 0%, rgba(135, 206, 235, 0.4) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(0, 0, 0, 0.8) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(135, 206, 235, 0.2) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(0, 0, 0, 0.9) 0px, transparent 50%),
          linear-gradient(-45deg, #050505, #0a192f, #050505)
        `,
        backgroundSize: '400% 400%',
        animation: 'gradientBG 15s ease infinite',
        transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Score counter */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 'clamp(80px, 15vw, 180px)',
          fontWeight: 800,
          fontFamily: "'Playfair Display', serif",
          background: 'linear-gradient(135deg, #FFD700, #FFA500, #B8860B)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          textShadow: 'none',
          filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.3))',
        }}>
          {count}*
        </div>

      </div>


    </div>
  );
}
