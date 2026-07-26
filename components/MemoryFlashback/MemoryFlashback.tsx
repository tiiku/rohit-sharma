'use client';

import React, { useEffect, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

interface MemoryFlashbackProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function MemoryFlashback({ scrollProgressRef }: MemoryFlashbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      loop: 1,
      modestbranding: 1,
      mute: 1, // Keep the video silent so it doesn't clash with climax music
    },
  };

  useEffect(() => {
    const updateOpacity = () => {
      const p = scrollProgressRef.current ?? 0;
      if (containerRef.current) {
        // Fade in from 0.85 to 0.95
        const startFade = 0.85;
        const endFade = 0.95;
        let opacity = 0;
        
        if (p > startFade) {
          opacity = Math.min((p - startFade) / (endFade - startFade), 1);
        }
        
        containerRef.current.style.opacity = opacity.toString();
        // Prevent clicking video when invisible
        containerRef.current.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
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
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '1200px',
          maxHeight: '800px',
          position: 'relative',
          boxShadow: '0 0 50px rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: '8px',
          overflow: 'hidden',
          filter: 'sepia(0.3) contrast(1.2)', // Cinematic memory look
        }}
      >
        <YouTube
          videoId="iqGsCh_BdnA"
          opts={opts}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
        
        {/* Vignette overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 150%)',
          pointerEvents: 'none',
        }} />
      </div>
      
      {/* Title */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        color: '#FFD700',
        fontFamily: "'Outfit', sans-serif",
        fontSize: '24px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        textShadow: '0 2px 10px rgba(0,0,0,0.8)',
      }}>
        A Legacy Etched in Time
      </div>
    </div>
  );
}
