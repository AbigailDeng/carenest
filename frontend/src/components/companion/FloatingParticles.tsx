import { useEffect, useRef } from 'react';

interface FloatingParticlesProps {
  count?: number; // Number of particles (default: 15)
  className?: string;
}

// T080: Create floating light particles component with GPU acceleration
export default function FloatingParticles({ count = 15, className = '' }: FloatingParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Generate random particles
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      duration: number;
      delay: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * 100, // Random X position (0-100%)
        y: Math.random() * 100, // Random Y position (0-100%)
        size: 4 + Math.random() * 8, // Size between 4-12px
        duration: 3 + Math.random() * 2, // Duration between 3-5s
        delay: Math.random() * 2, // Delay between 0-2s
      });
    }

    // Create particle elements
    particles.forEach((particle, index) => {
      const particleEl = document.createElement('div');
      particleEl.className = 'absolute rounded-full pointer-events-none';
      particleEl.style.left = `${particle.x}%`;
      particleEl.style.top = `${particle.y}%`;
      particleEl.style.width = `${particle.size}px`;
      particleEl.style.height = `${particle.size}px`;
      particleEl.style.opacity = `${0.2 + Math.random() * 0.2}`; // Opacity 0.2-0.4
      particleEl.style.background =
        'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 209, 220, 0.4) 100%)';
      particleEl.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.5)';

      // GPU-accelerated animation using transform
      particleEl.style.transform = 'translateZ(0)'; // Force GPU acceleration
      particleEl.style.willChange = 'transform, opacity';

      // Create keyframe animation
      const keyframes = `
        @keyframes float-${index} {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: ${0.2 + Math.random() * 0.2};
          }
          50% {
            transform: translate(${(Math.random() - 0.5) * 40}px, ${(Math.random() - 0.5) * 40}px) scale(${0.8 + Math.random() * 0.4});
            opacity: ${0.3 + Math.random() * 0.2};
          }
        }
      `;

      // Add keyframes to style if not already added
      if (!document.getElementById(`particle-keyframes-${index}`)) {
        const style = document.createElement('style');
        style.id = `particle-keyframes-${index}`;
        style.textContent = keyframes;
        document.head.appendChild(style);
      }

      particleEl.style.animation = `float-${index} ${particle.duration}s ease-in-out infinite`;
      particleEl.style.animationDelay = `${particle.delay}s`;

      containerRef.current?.appendChild(particleEl);
    });

    // Cleanup
    return () => {
      particles.forEach((_, index) => {
        const styleEl = document.getElementById(`particle-keyframes-${index}`);
        if (styleEl) {
          styleEl.remove();
        }
      });
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)', // GPU acceleration
      }}
    />
  );
}
