'use client';

/**
 * Loader — Cinematic loading screen featuring Rohit Sharma's 264* score.
 * Counts up from 0 to 264 with golden particles, then transitions to home page with a particle explosion.
 */

import { useState, useEffect, useRef } from 'react';

interface LoaderProps {
  onComplete: () => void;
}

class Particle {
  x: number;
  y: number;
  z: number;
  baseSize: number;
  alpha: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number, isExplosion: boolean = false) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    // Spread them far out on X and Y so they fill the screen when projected
    this.x = (Math.random() - 0.5) * canvasWidth * 4;
    this.y = (Math.random() - 0.5) * canvasHeight * 4;
    
    // Distribute z completely uniformly across a massive depth to prevent any clustering/waves.
    // For explosion, we spread them even deeper (up to 4000) so they flow continuously over time.
    this.z = isExplosion ? Math.random() * 4000 : Math.random() * 3000;
    
    this.baseSize = Math.random() * 3 + 1.5;
    this.alpha = isExplosion ? 1 : Math.random() * 0.5 + 0.5;
  }

  update(speed: number) {
    this.z -= speed;
    if (this.z <= 10) {
      // Add random variation to the reset depth so particles don't fall into a rigid pattern
      this.z = 3000 + Math.random() * 500;
      this.x = (Math.random() - 0.5) * this.canvasWidth * 4;
      this.y = (Math.random() - 0.5) * this.canvasHeight * 4;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const fov = 400; // Wider FOV for a more dramatic depth effect
    const px = (this.x * fov) / this.z + this.canvasWidth / 2;
    const py = (this.y * fov) / this.z + this.canvasHeight / 2;
    const pSize = Math.max(0, (this.baseSize * fov) / this.z);

    // Don't draw if outside the screen bounds by a margin
    if (px < -200 || px > this.canvasWidth + 200 || py < -200 || py > this.canvasHeight + 200) return;

    ctx.save();
    
    // Smooth linear fade in from the far distance (3000 down to 2000)
    let zAlpha = 1;
    if (this.z > 2000) {
      zAlpha = Math.max(0, 1 - ((this.z - 2000) / 1000));
    }
    
    ctx.globalAlpha = Math.max(0, this.alpha * zAlpha);
    ctx.globalCompositeOperation = 'lighter'; // THREE.AdditiveBlending equivalent
    
    if (pSize > 0.5) {
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, pSize);
      gradient.addColorStop(0, `rgba(121, 105, 58, 1)`); // #CAB061 * 0.6
      gradient.addColorStop(0.8, `rgba(121, 105, 58, 1)`); // #CAB061 * 0.6
      gradient.addColorStop(0.9, `rgba(121, 105, 58, 0.5)`); // smoothstep falloff start
      gradient.addColorStop(1, `rgba(121, 105, 58, 0)`); // discard edge

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export default function Loader({ onComplete }: LoaderProps) {
  const [count, setCount] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [waitingForClick, setWaitingForClick] = useState(false);

  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isExplodingRef = useRef(false);
  const waitingForClickRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    startTimeRef.current = performance.now();
    const duration = 3000; // 3 seconds to count to 264
    const target = 264;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    if (canvas) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      // Initialize a highly dense ambient universe
      for (let i = 0; i < 400; i++) {
        particlesRef.current.push(new Particle(canvas.width, canvas.height));
      }
    }

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      setCount(value);

      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Zoom and count happen at the same time:
        // Speed starts moderate and accelerates to hyperspace (warp) speed as the count reaches 264
        const travelSpeed = 10 + (eased * 45); 

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.update(travelSpeed);
          p.draw(ctx);
        }
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(264);
        if (!waitingForClickRef.current && !isExplodingRef.current) {
          waitingForClickRef.current = true;
          setWaitingForClick(true);
        }
        // keep animating particles at max speed while waiting and fading out
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [onComplete]);

  const handleClick = () => {
    if (waitingForClickRef.current && !isExplodingRef.current) {
      isExplodingRef.current = true;
      setWaitingForClick(false);
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 1800);
    }
  };

  if (!visible) return null;

  return (
    <div
      id="loader-screen"
      onClick={handleClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: fadeOut ? 'none' : 'auto',
        cursor: waitingForClick ? 'pointer' : 'default',
      }}
    >
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(at 0% 0%, rgba(135, 206, 235, 0.4) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(0, 0, 0, 0.8) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(135, 206, 235, 0.2) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(0, 0, 0, 0.9) 0px, transparent 50%),
            linear-gradient(-45deg, #050505, #0a192f, #050505)
          `,
          backgroundSize: '400% 400%',
          animation: 'gradientBG 15s ease infinite',
          transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: fadeOut ? 0 : 1,
          zIndex: -1,
        }}
      />
      
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Score counter */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        zIndex: 1,
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? 'scale(1.1)' : 'scale(1)',
      }}>
        <div style={{
          fontSize: 'clamp(80px, 15vw, 180px)',
          fontWeight: 800,
          fontFamily: "'Jersey M54', 'Playfair Display', serif",
          color: '#CAB061',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          textShadow: 'none',
          filter: 'drop-shadow(0 0 30px rgba(202, 176, 97, 0.3))',
        }}>
          {count}*
        </div>

        {/* Click to experience text */}
        <div style={{
          marginTop: '20px',
          fontSize: 'clamp(14px, 2vw, 20px)',
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          color: '#F4F1E1',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          paddingLeft: '0.2em', // Offset letter spacing to perfectly center
          opacity: waitingForClick && !fadeOut ? 0.8 : 0,
          transition: 'opacity 1s ease-in',
          pointerEvents: 'none',
        }}>
          click to experience masterpiece
        </div>
      </div>
    </div>
  );
}
