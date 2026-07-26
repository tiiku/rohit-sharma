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
    id: 'intro-text',
    title: 'ROHIT SHARMA',
    subtitle: 'THE HITMAN',
    startProgress: 0.085,
    endProgress: 0.135,
  },
  {
    id: 'bat',
    title: '264*',
    subtitle: 'Highest Individual ODI Score',
    startProgress: 0.228,
    endProgress: 0.278,
  },
  {
    id: 'ball',
    title: '3',
    subtitle: 'ODI Double Centuries — A World Record',
    startProgress: 0.371,
    endProgress: 0.421,
  },
  {
    id: 'helmet',
    title: '5',
    subtitle: 'ICC Tournament Centuries',
    startProgress: 0.514,
    endProgress: 0.564,
  },
  {
    id: 'stumps',
    title: 'CAPTAIN',
    subtitle: 'India Cricket Team',
    startProgress: 0.657,
    endProgress: 0.707,
  },
  {
    id: 'bails',
    title: '🏆 2024',
    subtitle: 'T20 World Cup Champion',
    startProgress: 0.800,
    endProgress: 0.850,
  },
  {
    id: 'trophy',
    title: 'LEGACY',
    subtitle: '16,000+ International Runs',
    startProgress: 0.942,
    endProgress: 0.992,
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
  
  const sectionIndex = SECTIONS.findIndex(s => s.id === activeSection.id);
  const isEven = sectionIndex % 2 === 0;

  return (
    <div
      id={`overlay-${activeSection.id}`}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: isEven ? 'flex-start' : 'flex-end',
          justifyContent: 'center',
          padding: '0 10vw',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          textAlign: isEven ? 'left' : 'right',
          padding: '40px 48px',
          borderRadius: '24px',
          background: `rgba(15, 12, 8, ${Math.max(titleOpacity, subtitleOpacity) * 0.4})`,
          backdropFilter: `blur(${Math.max(titleOpacity, subtitleOpacity) * 12}px)`,
          WebkitBackdropFilter: `blur(${Math.max(titleOpacity, subtitleOpacity) * 12}px)`,
          borderTop: `1px solid rgba(255, 215, 0, ${Math.max(titleOpacity, subtitleOpacity) * 0.15})`,
          borderBottom: `1px solid rgba(255, 215, 0, ${Math.max(titleOpacity, subtitleOpacity) * 0.15})`,
          borderLeft: isEven ? `4px solid rgba(255, 215, 0, ${titleOpacity})` : `1px solid rgba(255, 215, 0, ${Math.max(titleOpacity, subtitleOpacity) * 0.15})`,
          borderRight: !isEven ? `4px solid rgba(255, 215, 0, ${titleOpacity})` : `1px solid rgba(255, 215, 0, ${Math.max(titleOpacity, subtitleOpacity) * 0.15})`,
          maxWidth: '500px',
          boxShadow: `0 30px 60px rgba(0,0,0,${Math.max(titleOpacity, subtitleOpacity) * 0.6})`,
          transform: `translateX(${isEven ? (1 - Math.max(titleOpacity, subtitleOpacity)) * -40 : (1 - Math.max(titleOpacity, subtitleOpacity)) * 40}px)`,
          transition: 'transform 0.1s ease-out'
        }}>
          {/* Subtitle (Info) - Comes first visually and chronologically */}
          <p style={{
            fontSize: 'clamp(14px, 2vw, 18px)',
            fontWeight: 400,
            fontFamily: "'Outfit', sans-serif",
            color: '#E8DCC4',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '12px',
            opacity: subtitleOpacity * 0.8,
            transform: `translateY(${(1 - subtitleOpacity) * 20}px)`,
          }}>
            {activeSection.subtitle}
          </p>
  
          {/* Title (Figure) - Comes after */}
          <h2 style={{
            fontSize: activeSection.title.length <= 5
              ? 'clamp(40px, 8vw, 96px)'
              : 'clamp(28px, 5vw, 64px)',
            fontWeight: 800,
            fontFamily: "'Playfair Display', serif",
            background: 'linear-gradient(135deg, #FFD700 0%, #F5C518 50%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            margin: 0,
            opacity: titleOpacity,
            filter: 'drop-shadow(0 0 40px rgba(255,215,0,0.3))',
            transform: `translateY(${(1 - titleOpacity) * 20}px)`,
          }}>
            {activeSection.title}
          </h2>
  
          {/* Decorative line */}
          <div style={{
            width: `${titleOpacity * 60}px`,
            height: '2px',
            background: isEven ? 'linear-gradient(90deg, #FFD700, transparent)' : 'linear-gradient(270deg, #FFD700, transparent)',
            margin: isEven ? '24px 0 0 0' : '24px 0 0 auto',
            opacity: titleOpacity,
            boxShadow: '0 0 10px rgba(255,215,0,0.4)',
          }} />
        </div>
      </div>
  );
}
