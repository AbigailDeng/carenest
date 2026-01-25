import { useState, useEffect } from 'react';
import { CharacterMood } from '../../types';
import { getCharacterConfig } from '../../config/characters';

interface CharacterIllustrationProps {
  imageUrl?: string; // Optional if using mood
  characterId?: string; // Character ID for mood-based illustration lookup
  mood?: CharacterMood; // Character mood for mood-specific illustration (per FR-003, FR-011)
  alt?: string;
  className?: string;
}

// T060, T063: Optimize character image loading with lazy loading and caching strategies
// Image cache for faster subsequent loads
const imageCache = new Map<string, HTMLImageElement>();

export default function CharacterIllustration({
  imageUrl,
  characterId,
  mood,
  alt = 'Character illustration',
  className = '',
}: CharacterIllustrationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get mood-specific illustration URL if characterId and mood provided
  let resolvedImageUrl = imageUrl;
  if (characterId && mood) {
    const config = getCharacterConfig(characterId);
    if (config && config.illustrationUrls[mood]) {
      resolvedImageUrl = config.illustrationUrls[mood];
    }
  }

  // T060: Preload and cache images for better performance
  useEffect(() => {
    if (!resolvedImageUrl) {
      console.warn('[CharacterIllustration] No imageUrl provided');
      setError(true);
      setLoading(false);
      return;
    }

    console.log('[CharacterIllustration] Loading image:', resolvedImageUrl);

    // Check cache first
    if (imageCache.has(resolvedImageUrl)) {
      console.log('[CharacterIllustration] Image found in cache');
      setLoading(false);
      setError(false);
      return;
    }

    // Preload image
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Allow CORS if needed

    img.onload = () => {
      console.log('[CharacterIllustration] Image preloaded successfully:', resolvedImageUrl, {
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      imageCache.set(resolvedImageUrl, img);
      setLoading(false);
      setError(false);
    };
    img.onerror = err => {
      console.error('[CharacterIllustration] Image preload failed:', resolvedImageUrl, {
        error: err,
        attemptedUrl: resolvedImageUrl,
        imgSrc: img.src,
      });
      setLoading(false);
      setError(true);
    };

    // Set src after setting up handlers
    img.src = resolvedImageUrl;

    // Also check if image loads via fetch to get more error details
    fetch(resolvedImageUrl, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          console.error('[CharacterIllustration] Image fetch failed:', resolvedImageUrl, {
            status: response.status,
            statusText: response.statusText,
          });
        } else {
          console.log('[CharacterIllustration] Image fetch successful:', resolvedImageUrl, {
            status: response.status,
            contentType: response.headers.get('content-type'),
          });
        }
      })
      .catch(err => {
        console.error('[CharacterIllustration] Image fetch error:', resolvedImageUrl, err);
      });

    return () => {
      // Cleanup if component unmounts before image loads
      img.onload = null;
      img.onerror = null;
    };
  }, [resolvedImageUrl]);

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
          src={resolvedImageUrl}
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
            console.log('[CharacterIllustration] Image loaded successfully:', resolvedImageUrl, e.target);
            setLoading(false);
            setError(false);
          }}
          onError={e => {
            console.error('[CharacterIllustration] Image load error:', resolvedImageUrl, e);
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
