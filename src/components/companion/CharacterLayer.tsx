import { useState, useEffect } from 'react';

interface CharacterLayerProps {
  imageUrl: string | string[]; // Support single URL or array of fallback URLs
  resizeMode?: 'cover' | 'contain';
  alt?: string;
}

/**
 * CharacterLayer Component
 *
 * Full-screen or near-full-screen character illustration layer
 * positioned above background but below all dialog boxes and navigation bars.
 *
 * FR-031: Character Layer Implementation
 */
export default function CharacterLayer({
  imageUrl,
  resizeMode = 'cover',
  alt = 'Character illustration',
}: CharacterLayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  // Normalize imageUrl to array
  const imageUrls = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
  const currentUrl = imageUrls[currentUrlIndex];

  useEffect(() => {
    if (!currentUrl) {
      console.warn('[CharacterLayer] No imageUrl provided');
      setError(true);
      setLoading(false);
      setErrorMessage('未提供图片 URL');
      return;
    }

    console.log(
      '[CharacterLayer] Loading image:',
      currentUrl,
      `(${currentUrlIndex + 1}/${imageUrls.length})`
    );
    setLoading(true);
    setError(false);
    setErrorMessage('');

    // Preload image - try without crossOrigin first (external images may not support CORS)
    const img = new Image();

    // For external images, don't set crossOrigin to avoid CORS issues
    // If image is from same origin, crossOrigin can be set
    if (!currentUrl.startsWith('http') || currentUrl.startsWith(window.location.origin)) {
      // Same origin or relative path - can use crossOrigin
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      console.log('[CharacterLayer] Image preloaded successfully:', currentUrl, {
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      setLoading(false);
      setError(false);
    };

    img.onerror = err => {
      console.error('[CharacterLayer] Image preload failed:', currentUrl, {
        error: err,
        attemptedUrl: currentUrl,
        currentIndex: currentUrlIndex,
        totalUrls: imageUrls.length,
      });

      // Try next fallback URL if available
      if (currentUrlIndex < imageUrls.length - 1) {
        console.log('[CharacterLayer] Trying next fallback URL...');
        setCurrentUrlIndex(currentUrlIndex + 1);
        return; // Will retry with next URL
      }

      // All URLs failed, try one more time without CORS
      const imgRetry = new Image();
      imgRetry.onload = () => {
        console.log('[CharacterLayer] Image loaded on retry (no CORS):', currentUrl);
        setLoading(false);
        setError(false);
      };
      imgRetry.onerror = () => {
        console.error('[CharacterLayer] All image URLs failed');
        setLoading(false);
        setError(true);
        setErrorMessage('所有图片 URL 加载失败，请检查网络连接');
      };
      // Retry without setting any CORS attributes
      imgRetry.src = currentUrl;
    };

    img.src = currentUrl;
  }, [currentUrl, currentUrlIndex, imageUrls.length]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100/20 via-rose-100/20 to-lavender-100/20">
          <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50/50 to-rose-50/50">
          <div className="text-center opacity-50">
            <span className="text-6xl block mb-2">👤</span>
            <p className="text-xs text-gray-500 mb-1">图片加载失败</p>
            {errorMessage && <p className="text-xs text-gray-400">{errorMessage}</p>}
            <p className="text-xs text-gray-400 mt-2 break-all px-4">{imageUrl}</p>
          </div>
        </div>
      ) : (
        <>
          <img
            src={currentUrl}
            alt={alt}
            className={`
              w-full
              h-full
              ${loading ? 'opacity-0' : 'opacity-100'}
              transition-opacity
              duration-500
              character-float
            `}
            style={{
              objectFit: resizeMode,
              objectPosition: 'center bottom', // Position character at bottom to avoid navbar overlap
              animation: 'floatAnimation 4s ease-in-out infinite',
              willChange: 'transform',
            }}
            loading="eager"
            decoding="async"
            onLoad={e => {
              console.log(
                '[CharacterLayer] Image loaded successfully in img tag:',
                currentUrl,
                e.target
              );
              setLoading(false);
              setError(false);
            }}
            onError={e => {
              console.error('[CharacterLayer] Image load error in img tag:', currentUrl, e);
              console.error('[CharacterLayer] Error details:', {
                target: e.target,
                currentTarget: e.currentTarget,
                type: e.type,
                currentIndex: currentUrlIndex,
                totalUrls: imageUrls.length,
              });

              // Try next fallback URL if available
              if (currentUrlIndex < imageUrls.length - 1) {
                console.log('[CharacterLayer] Trying next fallback URL from img tag error...');
                setCurrentUrlIndex(currentUrlIndex + 1);
                return;
              }

              setLoading(false);
              setError(true);
              setErrorMessage('图片加载失败，请检查网络连接');
            }}
          />
          <style>{`
            @keyframes floatAnimation {
              0%, 100% {
                transform: translateY(0px) scale(1);
              }
              50% {
                transform: translateY(-12px) scale(1.02);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
