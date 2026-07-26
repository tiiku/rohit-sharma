'use client';

import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import { Volume2, VolumeX } from 'lucide-react';

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
    playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, loop: 1, modestbranding: 1, start: 155 },
  };

  const optsB: YouTubeProps['opts'] = {
    height: '0', width: '0',
    playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, loop: 1, modestbranding: 1 },
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

  const toggleMute = () => {
    if (isMuted) {
      if (playerA.current) playerA.current.unMute();
      if (playerB.current) playerB.current.unMute();
      setIsMuted(false);
    } else {
      if (playerA.current) playerA.current.mute();
      if (playerB.current) playerB.current.mute();
      setIsMuted(true);
    }
  };

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
        <YouTube videoId="ydPGNrDP6hA" opts={optsA} onReady={onReadyA} />
        <YouTube videoId="Ola4bQ7opeM" opts={optsB} onReady={onReadyB} />
      </div>

      <button
        onClick={toggleMute}
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '30px',
          zIndex: 100,
          background: 'rgba(5, 3, 1, 0.7)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          color: '#F5E6C8',
          padding: '12px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: '0 0 15px rgba(255, 215, 0, 0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(5, 3, 1, 0.7)';
          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
        }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </>
  );
}
