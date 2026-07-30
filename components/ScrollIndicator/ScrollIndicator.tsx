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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const p = Math.min(Math.max(scrollTop / docHeight, 0), 1);
        setProgress(p);
        const numStages = 8;
        const cycleLength = 1.0 / numStages;
        const currentIdx = Math.floor(Math.min(p, 0.999) / cycleLength);
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
        gap: '16px',
        pointerEvents: 'none',
      }}
    >
      {ICONS.map((item, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;
        const isHovered = idx === hoveredIndex;
        const Icon = item.Icon;

        const cycleLength = 1.0 / 8;
        const localProgress = Math.max(0, Math.min(1, (progress - idx * cycleLength) / cycleLength));

        return (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                position: 'relative',
                pointerEvents: 'auto',
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: isActive ? '#FFFFFF' : isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
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

            {/* Line indicator ONLY under the active icon */}
            {isActive && idx < ICONS.length - 1 && (
              <div
                style={{
                  width: '1px',
                  height: '40px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  margin: '8px 0',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${localProgress * 100}%`,
                    background: '#FFFFFF',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
