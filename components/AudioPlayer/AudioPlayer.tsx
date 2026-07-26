'use client';

import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  videoId: string;
  startSeconds: number;
}

export default function AudioPlayer({ videoId, startSeconds }: AudioPlayerProps) {
  // Start visually muted because browsers block unmuted autoplay
  const [isMuted, setIsMuted] = useState(true); 
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  const opts: YouTubeProps['opts'] = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1, // Attempt autoplay
      controls: 0,
      disablekb: 1,
      fs: 0,
      loop: 1,
      modestbranding: 1,
      start: startSeconds,
    },
  };

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    event.target.setVolume(50); 
    
    // We start it muted internally to guarantee the video at least starts playing/buffering
    event.target.mute();
    event.target.playVideo();
    
    setIsReady(true);
    setIsPlaying(true);
  };

  // Ensure sound turns on upon the very first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (playerRef.current && isReady) {
        // Unmute the video, play it, and update the UI icon to "Sound On"
        playerRef.current.unMute();
        playerRef.current.playVideo();
        setIsMuted(false);
        setIsPlaying(true);
      }
      // Remove listeners after first interaction
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('scroll', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isReady]);

  const toggleMute = () => {
    if (!playerRef.current || !isReady) return;

    if (isMuted) {
      playerRef.current.unMute();
      if (!isPlaying) {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  return (
    <>
      {/* Hidden YouTube Player */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
        <YouTube videoId={videoId} opts={opts} onReady={onReady} />
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={toggleMute}
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '30px', // Place on left so it doesn't conflict with scroll indicator
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
        aria-label={isMuted ? 'Unmute Background Music' : 'Mute Background Music'}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </>
  );
}
