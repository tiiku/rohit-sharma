'use client';

import { useState, useEffect } from 'react';
import { User, Zap, Circle, Shield, Columns3, Minus, Trophy, Film } from 'lucide-react';

const ICONS = [
  { id: 'pull-shot', name: 'Pull Shot', Icon: User },
  { id: 'bat', name: 'Bat', Icon: Zap },
  { id: 'ball', name: 'Ball', Icon: Circle },
  { id: 'helmet', name: 'Helmet', Icon: Shield },
  { id: 'stumps', name: 'Stumps', Icon: Columns3 },
  { id: 'bails', name: 'Bails', Icon: Minus },
  { id: 'trophy', name: 'Trophy', Icon: Trophy },
  { id: 'flashback', name: 'Flashback', Icon: Film },
];

export default function ScrollIndicator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
        const numStages = 8;
        const cycleLength = 1.0 / numStages;
        const currentIdx = Math.floor(Math.min(progress, 0.999) / cycleLength);
        setActiveIndex(currentIdx);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        right: '40px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 15,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        pointerEvents: 'none',
      }}
    >
      {ICONS.map((item, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;
        const isHovered = idx === hoveredIndex;
        const Icon = item.Icon;

        return (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                position: 'relative',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                // Smooth scroll to the start of this cycle
                const targetProgress = (idx / 8) + 0.03; // Slightly past the start to see it forming
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                window.scrollTo({ top: targetProgress * docHeight, behavior: 'smooth' });
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: isActive ? '#FFD700' : isHovered ? '#FFFFFF' : isPast ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)',
                  border: isActive ? '1px solid #FFD700' : isHovered ? '1px solid #FFFFFF' : '1px solid transparent',
                  background: isActive ? 'rgba(255, 215, 0, 0.1)' : isHovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  transition: 'all 0.3s ease',
                  transform: isActive || isHovered ? 'scale(1.2)' : 'scale(1)',
                }}
              >
                <Icon size={16} strokeWidth={isActive || isHovered ? 2 : 1.5} />
              </div>

              {/* Hover Label */}
              <div
                style={{
                  position: 'absolute',
                  right: '40px',
                  top: '50%',
                  transform: `translateY(-50%) translateX(${isHovered ? '0' : '10px'})`,
                  opacity: isHovered ? 1 : 0,
                  visibility: isHovered ? 'visible' : 'hidden',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'rgba(0, 0, 0, 0.5)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {item.name}
              </div>
            </div>
            
            {/* Draw line to next icon */}
            {idx < ICONS.length - 1 && (
              <div
                style={{
                  width: '1px',
                  height: '24px',
                  background: isPast ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  transition: 'background 0.5s ease',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
