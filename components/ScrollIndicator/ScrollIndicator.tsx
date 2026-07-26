'use client';

import { useState, useEffect } from 'react';
import { User, Zap, Circle, Shield, Columns3, Minus, Trophy } from 'lucide-react';

const ICONS = [
  { id: 'pull-shot', Icon: User },
  { id: 'bat', Icon: Zap },
  { id: 'ball', Icon: Circle },
  { id: 'helmet', Icon: Shield },
  { id: 'stumps', Icon: Columns3 },
  { id: 'bails', Icon: Minus },
  { id: 'trophy', Icon: Trophy },
];

export default function ScrollIndicator() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
        // There are 7 cycles
        const numStages = 7;
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
        const Icon = item.Icon;

        return (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: isActive ? '#FFD700' : isPast ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)',
                border: isActive ? '1px solid #FFD700' : '1px solid transparent',
                background: isActive ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                transition: 'all 0.5s ease',
                transform: isActive ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
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
