import React from 'react';

interface ImageBackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * ImageBackground Component
 *
 * Full-screen base layer covering entire app with atmospheric anime background image
 * and subtle white gradient overlay for text readability.
 *
 * FR-031: Global Background & Character Layer
 */
export default function ImageBackground({
  imageUrl,
  children,
  className = '',
}: ImageBackgroundProps) {
  return (
    <div
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{
        zIndex: 0,
      }}
    >
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          // Ensure image covers entire screen without gaps
          minWidth: '100vw',
          minHeight: '100vh',
        }}
      />

      {/* White Gradient Overlay (transparent at top → white at bottom) */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.7) 100%)',
          pointerEvents: 'none', // Allow clicks to pass through
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
