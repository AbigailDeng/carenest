import { useState, useEffect } from 'react';

interface CharacterIllustrationProps {
  imageUrl: string;
  alt?: string;
  className?: string;
}

// T060, T063: Optimize character image loading with lazy loading and caching strategies
// Image cache for faster subsequent loads
const imageCache = new Map<string, HTMLImageElement>();

export default function CharacterIllustration({
  imageUrl,
  alt = 'Character illustration',
  className = '',
}: CharacterIllustrationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // T060: Preload and cache images for better performance
  useEffect(() => {
    if (!imageUrl) {
      console.warn('[CharacterIllustration] No imageUrl provided');
      setError(true);
      setLoading(false);
      return;
    }

    console.log('[CharacterIllustration] Loading image:', imageUrl);

    // Check cache first
    if (imageCache.has(imageUrl)) {
      console.log('[CharacterIllustration] Image found in cache');
      setLoading(false);
      setError(false);
      return;
    }

    // Preload image
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Allow CORS if needed

    img.onload = () => {
      console.log('[CharacterIllustration] Image preloaded successfully:', imageUrl, {
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      imageCache.set(imageUrl, img);
      setLoading(false);
      setError(false);
    };
    img.onerror = err => {
      console.error('[CharacterIllustration] Image preload failed:', imageUrl, {
        error: err,
        attemptedUrl: imageUrl,
        imgSrc: img.src,
      });
      setLoading(false);
      setError(true);
    };

    // Set src after setting up handlers
    img.src = imageUrl;

    // Also check if image loads via fetch to get more error details
    fetch(imageUrl, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          console.error('[CharacterIllustration] Image fetch failed:', imageUrl, {
            status: response.status,
            statusText: response.statusText,
          });
        } else {
          console.log('[CharacterIllustration] Image fetch successful:', imageUrl, {
            status: response.status,
            contentType: response.headers.get('content-type'),
          });
        }
      })
      .catch(err => {
        console.error('[CharacterIllustration] Image fetch error:', imageUrl, err);
      });

    return () => {
      // Cleanup if component unmounts before image loads
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100/50 via-rose-100/50 to-lavender-100/50 rounded-lg">
          <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error ? (
        <div className="w-full h-full bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg flex items-center justify-center text-gray-400">
          <div className="text-center">
            <span className="text-6xl block mb-2">👤</span>
            <p className="text-xs text-gray-500">图片加载失败</p>
            <p className="text-xs text-gray-400 mt-1">{imageUrl}</p>
          </div>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={alt}
          className={`
            w-full
            h-auto
            rounded-lg
            object-contain
            ${loading ? 'opacity-0' : 'opacity-100'}
            transition-opacity
            duration-300
          `}
          loading="eager"
          decoding="async"
          crossOrigin="anonymous"
          onLoad={e => {
            console.log('[CharacterIllustration] Image loaded successfully:', imageUrl, e.target);
            setLoading(false);
            setError(false);
          }}
          onError={e => {
            console.error('[CharacterIllustration] Image load error:', imageUrl, e);
            console.error('[CharacterIllustration] Error details:', {
              target: e.target,
              currentTarget: e.currentTarget,
              type: e.type,
            });
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
}
