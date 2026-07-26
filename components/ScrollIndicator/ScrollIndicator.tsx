'use client';

/**
 * ScrollIndicator — Subtle animated arrow at the bottom of the screen
 * prompting users to scroll. Fades away after scrolling begins.
 */

import { useState, useEffect } from 'react';

export default function ScrollIndicator() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      id="scroll-indicator"
      style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        opacity: visible ? 0.6 : 0,
        transition: 'opacity 0.8s ease',
        pointerEvents: 'none',
      }}
    >
      <span style={{
        fontSize: '11px',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 300,
        color: '#B8860B',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
      }}>
        Scroll to explore
      </span>
      <div style={{
        width: '1px',
        height: '40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '1px',
          height: '40px',
          background: 'linear-gradient(to bottom, #FFD700, transparent)',
          animation: 'scrollLine 2s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes scrollLine {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
