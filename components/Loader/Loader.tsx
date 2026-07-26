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
        background: '#050301',
        transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Ambient golden particles via CSS */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        opacity: 0.3,
      }}>
        {mounted && Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              borderRadius: '50%',
              background: '#FFD700',
              boxShadow: '0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.3)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `loaderFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.4 + Math.random() * 0.6,
            }}
          />
        ))}
      </div>

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

        <div style={{
          fontSize: 'clamp(12px, 2vw, 18px)',
          fontFamily: "'Playfair Display', serif",
          fontWeight: 300,
          color: '#B8860B',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          marginTop: '16px',
          opacity: count > 100 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}>
          The Greatest ODI Innings
        </div>

        <div style={{
          fontSize: 'clamp(10px, 1.5vw, 14px)',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 400,
          color: 'rgba(245, 230, 200, 0.5)',
          letterSpacing: '0.15em',
          marginTop: '8px',
          opacity: count > 200 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}>
          vs Sri Lanka · Kolkata · 2014
        </div>
      </div>

      {/* Loading bar */}
      <div style={{
        position: 'absolute',
        bottom: '60px',
        width: '200px',
        height: '2px',
        background: 'rgba(255,215,0,0.1)',
        borderRadius: '1px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${(count / 264) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #B8860B, #FFD700)',
          borderRadius: '1px',
          transition: 'width 0.05s linear',
          boxShadow: '0 0 8px rgba(255,215,0,0.5)',
        }} />
      </div>

      <style>{`
        @keyframes loaderFloat {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
