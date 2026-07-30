'use client';

import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  hx: number;
  hy: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export default function FigureParticles({
  children,
  opacity,
}: {
  children: React.ReactNode;
  opacity: number;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isHovering, setIsHovering] = useState(false);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  
  // Physics constants
  const INFLUENCE_RADIUS = 120;
  const REPULSION_STRENGTH = 0.8;
  const SWIRL_STRENGTH = 0.4;
  const SPRING_K = 0.04;
  const DAMPING = 0.85;
  const MAX_VELOCITY = 15;
  const PARTICLE_COUNT = 400;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas resolution and particles
    const init = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const particles: Particle[] = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        particles.push({
          x,
          y,
          hx: x,
          hy: y,
          vx: 0,
          vy: 0,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
        });
      }
      particlesRef.current = particles;
      // Initial draw
      draw(ctx, rect.width, rect.height, particles, false);
    };

    const draw = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      particles: Particle[],
      hovering: boolean
    ) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#CAB061'; // Dust color

      let needsUpdate = false;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Mouse forces
        if (hovering) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < INFLUENCE_RADIUS) {
            const force = (INFLUENCE_RADIUS - dist) / INFLUENCE_RADIUS;
            // Easing the force to make it organic and soft
            const easedForce = force * force * (3 - 2 * force); 
            const angle = Math.atan2(dy, dx);
            
            // Repulsion
            p.vx += Math.cos(angle) * easedForce * REPULSION_STRENGTH;
            p.vy += Math.sin(angle) * easedForce * REPULSION_STRENGTH;
            
            // Swirl
            p.vx += Math.cos(angle + Math.PI / 2) * easedForce * SWIRL_STRENGTH;
            p.vy += Math.sin(angle + Math.PI / 2) * easedForce * SWIRL_STRENGTH;
          }
        }

        // Spring force
        p.vx += (p.hx - p.x) * SPRING_K;
        p.vy += (p.hy - p.y) * SPRING_K;

        // Damping
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        // Clamp velocity
        const speedSq = p.vx * p.vx + p.vy * p.vy;
        if (speedSq > MAX_VELOCITY * MAX_VELOCITY) {
          const speed = Math.sqrt(speedSq);
          p.vx = (p.vx / speed) * MAX_VELOCITY;
          p.vy = (p.vy / speed) * MAX_VELOCITY;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Check if particle is still moving
        const distFromHome = Math.abs(p.hx - p.x) + Math.abs(p.hy - p.y);
        if (distFromHome > 0.1 || Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05) {
          needsUpdate = true;
        } else {
          // Snap to home if very close to prevent micro-jitter
          p.x = p.hx;
          p.y = p.hy;
          p.vx = 0;
          p.vy = 0;
        }

        // Render
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      return needsUpdate;
    };

    const animate = () => {
      const needsUpdate = draw(
        ctx,
        canvas.width,
        canvas.height,
        particlesRef.current,
        isHovering
      );
      
      if (isHovering || needsUpdate) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    // Initialize and start loop if needed
    init();
    
    if (isHovering) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      init();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isHovering]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  return (
    <figure
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        // We let the animation frame loop wind itself down 
        // as the particles return home.
      }}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        margin: 0,
        pointerEvents: 'auto',
        opacity: opacity, // Fade whole block
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      {children}
    </figure>
  );
}
