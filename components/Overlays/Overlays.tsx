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
    title: '2024',
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5vw',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        textAlign: 'center',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        transform: `translateY(${(1 - Math.max(titleOpacity, subtitleOpacity)) * 20}px)`,
        transition: 'transform 0.1s ease-out'
      }}>
        {/* Title (Figure) */}
        <h2 style={{
          fontSize: activeSection.title.length <= 5 ? '180px' : 'clamp(60px, 10vw, 140px)',
          fontWeight: 800,
          fontFamily: "var(--font-cinzel), 'Cinzel', serif",
          color: '#F4F1E1',
          lineHeight: 0.9,
          letterSpacing: '0.02em',
          margin: 0,
          opacity: titleOpacity,
        }}>
          {activeSection.title}
        </h2>

        {/* Subtitle (Info) */}
        <p style={{
          fontSize: 'clamp(18px, 3vw, 32px)',
          fontWeight: 300,
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          color: '#CAB061',
          fontStyle: 'italic',
          letterSpacing: '0.05em',
          margin: 0,
          opacity: subtitleOpacity,
        }}>
          {activeSection.subtitle}
        </p>
      </div>
    </div>
  );
}
