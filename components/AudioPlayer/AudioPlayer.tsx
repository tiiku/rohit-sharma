'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';

const CosmicWaveIcon = ({ isMuted }: { isMuted: boolean }) => {
  const dots = 15;
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '30px', width: '64px', justifyContent: 'center' }}>
      <style>
        {`
          @keyframes cosmic-wave {
            0%, 100% { transform: translateY(4px) scale(0.8); opacity: 0.3; box-shadow: 0 0 3px currentColor; }
            50% { transform: translateY(-10px) scale(1.6); opacity: 1; box-shadow: 0 0 8px currentColor, 0 0 14px currentColor; }
          }
          .cosmic-dot {
            width: 3px;
            height: 3px;
            background-color: currentColor;
            border-radius: 50%;
            transition: all 0.5s ease;
            opacity: 0.3;
          }
          .cosmic-dot.playing {
            animation: cosmic-wave 1.2s ease-in-out infinite;
          }
        `}
      </style>
      {Array.from({ length: dots }).map((_, i) => {
        // Create a fluid wave delay pattern using a sine function
        const delay = (Math.sin((i / dots) * Math.PI * 2) * 0.6).toFixed(3);
        return (
          <div
            key={i}
            className={`cosmic-dot ${!isMuted ? 'playing' : ''}`}
            style={{ animationDelay: `${delay}s` }}
          />
        );
      })}
    </div>
  );
};

interface AudioPlayerProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function AudioPlayer({ scrollProgressRef }: AudioPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [readyA, setReadyA] = useState(false);
  const [readyB, setReadyB] = useState(false);

  const playerA = useRef<any>(null);
  const playerB = useRef<any>(null);
  const rafRef = useRef<number>(0);

  const optsA: YouTubeProps['opts'] = {
    height: '0', width: '0',
    playerVars: { autoplay: 1, mute: 0, controls: 0, disablekb: 1, fs: 0, loop: 1, modestbranding: 1, start: 155 },
  };

  const optsB: YouTubeProps['opts'] = {
    height: '0', width: '0',
    playerVars: { autoplay: 0, mute: 0, controls: 0, disablekb: 1, fs: 0, loop: 1, modestbranding: 1 },
  };

  const isPlayingBRef = useRef(false);

  const onReadyA = (event: YouTubeEvent) => {
    playerA.current = event.target;
    event.target.setVolume(50);
    event.target.unMute();
    event.target.playVideo();
    setReadyA(true);
  };

  const onReadyB = (event: YouTubeEvent) => {
    playerB.current = event.target;
    event.target.setVolume(0);
    event.target.unMute();
    // Do NOT play yet, wait until we scroll to the climax
    setReadyB(true);
  };

  const toggleMute = useCallback(() => {
    if (isMuted) {
      if (playerA.current) playerA.current.unMute();
      if (playerB.current) playerB.current.unMute();
      setIsMuted(false);
    } else {
      if (playerA.current) playerA.current.mute();
      if (playerB.current) playerB.current.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  // Handle browser autoplay policies dynamically
  useEffect(() => {
    const handleInteraction = () => {
      // If browser paused it due to autoplay policy, try to play and unmute
      if (playerA.current && playerA.current.getPlayerState() !== 1) {
        playerA.current.playVideo();
      }
      if (isMuted) {
        toggleMute();
      }
      const events = ['scroll', 'wheel', 'touchstart', 'click', 'keydown'];
      events.forEach((e) => window.removeEventListener(e, handleInteraction));
    };

    const events = ['scroll', 'wheel', 'touchstart', 'click', 'keydown'];
    events.forEach((e) => window.addEventListener(e, handleInteraction, { once: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleInteraction));
    };
  }, [isMuted, toggleMute]);

  // Crossfader loop
  useEffect(() => {
    const updateVolumes = () => {
      const p = scrollProgressRef.current ?? 0;

      if (playerA.current && playerB.current && readyA && readyB && !isMuted) {
        // Assume climax starts near 0.85 progress
        const climaxStart = 0.80;
        const climaxEnd = 0.95;

        let climaxProgress = 0;
        if (p > climaxStart) {
          climaxProgress = Math.min((p - climaxStart) / (climaxEnd - climaxStart), 1);

          // Start playing B if it isn't already
          if (!isPlayingBRef.current) {
            playerB.current.playVideo();
            isPlayingBRef.current = true;
          }
        } else {
          // Pause B if we scroll back up
          if (isPlayingBRef.current) {
            playerB.current.pauseVideo();
            isPlayingBRef.current = false;
          }
        }

        const volA = Math.floor((1 - climaxProgress) * 50);
        const volB = Math.floor(climaxProgress * 80); // Climax gets louder

        playerA.current.setVolume(volA);
        playerB.current.setVolume(volB);
      }
      rafRef.current = requestAnimationFrame(updateVolumes);
    };

    rafRef.current = requestAnimationFrame(updateVolumes);
    return () => cancelAnimationFrame(rafRef.current);
  }, [readyA, readyB, scrollProgressRef, isMuted]);

  return (
    <>
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
        <YouTube videoId="ydPGNrDP6hA" opts={optsA} onReady={onReadyA} onEnd={(e) => { e.target.seekTo(155); e.target.playVideo(); }} />
        <YouTube videoId="Ola4bQ7opeM" opts={optsB} onReady={onReadyB} onEnd={(e) => { e.target.seekTo(0); e.target.playVideo(); }} />
      </div>

      <button
        onClick={toggleMute}
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '30px',
          zIndex: 100,
          background: 'transparent',
          border: 'none',
          color: '#F5E6C8',
          padding: '0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#CAB061'; // Highlight color on hover
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#F5E6C8';
        }}
      >
        <CosmicWaveIcon isMuted={isMuted} />
      </button>
    </>
  );
}
