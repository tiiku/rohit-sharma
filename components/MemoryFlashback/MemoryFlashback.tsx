'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MemoryFlashbackProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function MemoryFlashback({ scrollProgressRef }: MemoryFlashbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const playerRef = useRef<HTMLVideoElement>(null);
  
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate particles only on the client to avoid hydration mismatch
    setParticles(
      Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * -20,
      }))
    );
  }, []);

  useEffect(() => {
    const updateOpacity = () => {
      const p = scrollProgressRef.current ?? 0;
      if (containerRef.current) {
        // Fade in from 0.88 to 0.95 (After the Trophy is fully zoomed in)
        const startFade = 0.88;
        const endFade = 0.95;
        let opacity = 0;
        
        if (p > startFade) {
          opacity = Math.min((p - startFade) / (endFade - startFade), 1);
        }
        
        containerRef.current.style.opacity = opacity.toString();
        // Prevent clicking video when invisible
        containerRef.current.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';

        if (playerRef.current) {
          if (opacity > 0) {
            if (playerRef.current.paused) {
              playerRef.current.play().catch(() => {});
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(updateOpacity);
    };

    rafRef.current = requestAnimationFrame(updateOpacity);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scrollProgressRef]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5, // Above particles (0) but below overlays (10)
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        pointerEvents: 'none',
        transition: 'opacity 0.1s linear',
      }}
    >
      <style>{`
        @keyframes float-flashback {
          0% { transform: translateY(0px) scale(0.5); opacity: 0; }
          20% { opacity: 0.7; }
          80% { opacity: 0.7; }
          100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* Floating Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: 'rgba(255, 230, 180, 0.8)', // Warm, cinematic flashback color
            borderRadius: '50%',
            boxShadow: `0 0 ${p.size * 2}px rgba(255, 230, 180, 0.6)`,
            animation: `float-flashback ${p.duration}s infinite linear ${p.delay}s`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      ))}
      <div
        style={{
          width: '90vw',
          height: '70vh',
          maxWidth: '1200px',
          maxHeight: '800px',
          position: 'relative',
          overflow: 'hidden',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
          filter: 'grayscale(1) contrast(1.3) brightness(0.9)', // Black and white cinematic memory look
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // Prevent interaction with the video
          transform: 'scale(1.2)', // Slight scale up to fill edge
        }}>
          <video
            ref={playerRef}
            src="/rohit-sharma.mp4"
            loop
            muted
            playsInline
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        
        {/* Vignette overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.9) 120%)',
          pointerEvents: 'none',
        }} />
      </div>
      
      {/* Title */}
      <div style={{
        position: 'absolute',
        bottom: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        width: '100%',
        color: '#CAB061',
        fontFamily: "var(--font-cinzel), 'Cinzel', serif",
        fontSize: '28px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        textShadow: '0 2px 10px rgba(0,0,0,0.8)',
      }}>
        A Legacy Etched in Time
      </div>
    </div>
  );
}
