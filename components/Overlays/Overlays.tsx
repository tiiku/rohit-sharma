'use client';

/**
 * Overlays — Text overlays that appear/disappear based on scroll progress.
 * Each section showcases a Rohit Sharma milestone.
 */

import { useState, useEffect, useRef } from 'react';

interface Section {
  id: string;
  title: string;
  subtitle: string;
  startProgress: number;
  endProgress: number;
}

const SECTIONS: Section[] = [
  {
    id: 'intro',
    title: 'ROHIT SHARMA',
    subtitle: 'THE HITMAN',
    startProgress: 0.00,
    endProgress: 0.09,
  },
  {
    id: 'bat',
    title: '264*',
    subtitle: 'Highest Individual ODI Score',
    startProgress: 0.12,
    endProgress: 0.23,
  },
  {
    id: 'bat-fly',
    title: '3',
    subtitle: 'ODI Double Centuries — A World Record',
    startProgress: 0.26,
    endProgress: 0.33,
  },
  {
    id: 'ball',
    title: '5',
    subtitle: 'ICC Tournament Centuries',
    startProgress: 0.37,
    endProgress: 0.48,
  },
  {
    id: 'helmet',
    title: 'CAPTAIN',
    subtitle: 'India Cricket Team',
    startProgress: 0.52,
    endProgress: 0.63,
  },
  {
    id: 'stumps',
    title: '🏆 2024',
    subtitle: 'T20 World Cup Champion',
    startProgress: 0.66,
    endProgress: 0.78,
  },
  {
    id: 'bails',
    title: '16,000+',
    subtitle: 'International Runs',
    startProgress: 0.70,
    endProgress: 0.79,
  },
  {
    id: 'trophy',
    title: 'LEGACY',
    subtitle: 'of The Hitman',
    startProgress: 0.85,
    endProgress: 0.94,
  },
  {
    id: 'finale',
    title: 'FOREVER 45',
    subtitle: '🇮🇳',
    startProgress: 0.96,
    endProgress: 1.0,
  },
];

export default function Overlays() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;

      let found: Section | null = null;
      let tOpacity = 0;
      let sOpacity = 0;

      for (const section of SECTIONS) {
        if (progress >= section.startProgress && progress <= section.endProgress) {
          found = section;

          // Fade in/out within the section
          const range = section.endProgress - section.startProgress;
          const localProgress = (progress - section.startProgress) / range;

          // Info (Subtitle) fades in 0.0 -> 0.15
          if (localProgress < 0.15) {
            sOpacity = localProgress / 0.15;
          } else if (localProgress > 0.8) {
            sOpacity = (1 - localProgress) / 0.2;
          } else {
            sOpacity = 1;
          }

          // Figure (Title) fades in 0.15 -> 0.30
          if (localProgress < 0.15) {
            tOpacity = 0;
          } else if (localProgress < 0.3) {
            tOpacity = (localProgress - 0.15) / 0.15;
          } else if (localProgress > 0.8) {
            tOpacity = (1 - localProgress) / 0.2;
          } else {
            tOpacity = 1;
          }
          break;
        }
      }

      setActiveSection(found);
      setTitleOpacity(tOpacity);
      setSubtitleOpacity(sOpacity);
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!activeSection) return null;

  return (
    <div
      id={`overlay-${activeSection.id}`}
        style={{
          // Container doesn't need global opacity anymore, elements handle it
          position: 'fixed',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          textAlign: 'center',
          padding: '60px 80px',
          borderRadius: '24px',
          background: `radial-gradient(ellipse at center, rgba(5,3,1,${Math.max(titleOpacity, subtitleOpacity) * 0.7}) 0%, rgba(5,3,1,${Math.max(titleOpacity, subtitleOpacity) * 0.3}) 50%, transparent 80%)`,
        }}>
          {/* Subtitle (Info) - Comes first visually and chronologically */}
          <p style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 300,
            fontFamily: "'Outfit', sans-serif",
            color: '#F5E6C8',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            opacity: subtitleOpacity * 0.9,
            textShadow: '0 0 20px rgba(5,3,1,0.8), 0 2px 10px rgba(5,3,1,0.6)',
            transform: `translateY(${(1 - subtitleOpacity) * 30}px)`,
          }}>
            {activeSection.subtitle}
          </p>
  
          {/* Title (Figure) - Comes after */}
          <h2 style={{
            fontSize: activeSection.title.length <= 5
              ? 'clamp(48px, 10vw, 120px)'
              : 'clamp(32px, 6vw, 72px)',
            fontWeight: 800,
            fontFamily: "'Playfair Display', serif",
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: 0,
            opacity: titleOpacity,
            filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.4)) drop-shadow(0 0 60px rgba(255,165,0,0.2))',
            transform: `translateY(${(1 - titleOpacity) * 20}px)`,
          }}>
            {activeSection.title}
          </h2>
  
          {/* Decorative line */}
          <div style={{
            width: `${titleOpacity * 80}px`,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
            margin: '24px auto 0',
            opacity: titleOpacity,
            boxShadow: '0 0 8px rgba(255,215,0,0.3)',
          }} />
        </div>
      </div>
  );
}
