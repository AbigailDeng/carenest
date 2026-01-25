import React, { useState, useEffect } from 'react';

interface ImageBackgroundProps {
  imageUrl: string;
  children?: React.ReactNode;
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset states when imageUrl changes
    setImageLoaded(false);
    setImageError(false);
    
    const img = new Image();
    img.src = imageUrl;
    
    let isMounted = true;
    
    img.onload = () => {
      if (isMounted) {
        console.log('[ImageBackground] Image loaded successfully:', imageUrl);
        setImageLoaded(true);
        setImageError(false);
      }
    };
    
    img.onerror = () => {
      if (isMounted) {
        console.error('[ImageBackground] Failed to load background image:', imageUrl);
        setImageError(true);
        setImageLoaded(false);
      }
    };
    
    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return (
    <div
      className={`fixed w-full h-full ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        zIndex: 0, // Background layer - behind all content but above body background
        backgroundColor: 'transparent', // No fallback color - let background image show through
        overflow: 'hidden', // Prevent any overflow that might show default background
        margin: 0,
        padding: 0,
        pointerEvents: 'none', // Allow clicks to pass through to content
      }}
    >
      {/* Background Image Layer - must cover entire viewport with breathing animation */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          backgroundImage: imageError ? 'none' : `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: imageError ? 0 : (imageLoaded ? 1 : 1), // Show immediately, full opacity when loaded
          transition: 'opacity 0.5s ease-in-out',
          zIndex: 0,
          animation: 'breathingAnimation 7s ease-in-out infinite',
          transformOrigin: 'center center',
          margin: 0,
          padding: 0,
        }}
      />
      
      {/* Breathing Animation Keyframes */}
      <style>{`
        @keyframes breathingAnimation {
          0%, 100% {
            transform: scale(1.0) translateY(0px);
          }
          50% {
            transform: scale(1.03) translateY(-10px);
          }
        }
      `}</style>

      {/* White Gradient Overlay (transparent at top → white at bottom) - minimal overlay to preserve image visibility */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.15) 100%)',
          pointerEvents: 'none', // Allow clicks to pass through
        }}
      />

      {/* Content Layer - only render if children provided */}
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  );
}
