'use client';

import React, { useEffect, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

interface MemoryFlashbackProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function MemoryFlashback({ scrollProgressRef }: MemoryFlashbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const playerRef = useRef<any>(null);

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
      playsinline: 1,
      playlist: 'iqGsCh_BdnA', // Needed for loop to work
      iv_load_policy: 3, // Hide annotations
      rel: 0, // Hide related videos at the end
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

        if (playerRef.current) {
          if (opacity > 0) {
            if (playerRef.current.getPlayerState() !== 1) { // 1 is playing
              playerRef.current.playVideo();
            }
          } else {
            if (playerRef.current.getPlayerState() === 1) {
              playerRef.current.pauseVideo();
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(updateOpacity);
    };

    rafRef.current = requestAnimationFrame(updateOpacity);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scrollProgressRef]);

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    playerRef.current.playVideo();
  };

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
          pointerEvents: 'none', // Prevent interaction with the iframe
          transform: 'scale(1.5)', // Scale up to hide YouTube UI and black bars
        }}>
          <YouTube
            videoId="iqGsCh_BdnA"
            opts={opts}
            onReady={onPlayerReady}
            style={{ width: '100%', height: '100%', border: 'none' }}
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
