import { getTimeOfDay } from '../../services/companionService';
import { getCharacterConfig } from '../../config/characters';
import { CharacterMood } from '../../types';

interface SceneBackgroundProps {
  characterId: string;
  mood?: CharacterMood; // Character mood for mood-based background variations (per FR-025)
  className?: string;
}

export default function SceneBackground({ characterId, mood, className = '' }: SceneBackgroundProps) {
  const config = getCharacterConfig(characterId);
  if (!config) {
    return null;
  }

  const timeOfDay = getTimeOfDay();
  const backgroundUrl = config.backgroundUrls[timeOfDay] || config.backgroundUrls.morning;
  const floralOverlayUrl = '/assets/characters/overlays/floral.svg';

  // Mood-based background color variations (per FR-025)
  const getMoodOverlay = (mood?: CharacterMood) => {
    if (!mood) return 'from-pink-50/70 via-rose-50/70 via-lavender-50/70 to-purple-50/70';
    switch (mood) {
      case 'happy':
        return 'from-pink-100/80 via-rose-100/80 to-yellow-50/60'; // Warm, bright
      case 'concerned':
        return 'from-blue-50/70 via-indigo-50/70 to-purple-50/70'; // Calming, cool
      case 'energetic':
        return 'from-orange-50/80 via-yellow-50/80 to-pink-50/80'; // Energetic, vibrant
      case 'tired':
        return 'from-gray-50/60 via-slate-50/60 to-blue-50/60'; // Soft, muted
      case 'calm':
      default:
        return 'from-pink-50/70 via-rose-50/70 via-lavender-50/70 to-purple-50/70'; // Default romantic
    }
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* T078: Background scene with dynamic zoom effect - FR-031 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundUrl})`,
          filter: 'blur(1px)',
          animation: 'zoomBackground 25s ease-in-out infinite',
          transform: 'scale(1)',
        }}
      >
        <style>{`
          @keyframes zoomBackground {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
        `}</style>
      </div>

      {/* Mood-based gradient overlay with pastel colors (per FR-025) */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getMoodOverlay(mood)}`} />

      {/* Additional soft pink/rose overlay for romantic feel */}
      <div className="absolute inset-0 bg-gradient-to-t from-pink-100/40 via-transparent to-transparent" />

      {/* Floral overlay - enhanced */}
      <div
        className="absolute inset-0 opacity-40 bg-contain bg-no-repeat mix-blend-soft-light"
        style={{
          backgroundImage: `url(${floralOverlayUrl})`,
          backgroundPosition: 'top left, bottom right',
          backgroundSize: '50% auto',
        }}
      />

      {/* Decorative floating elements (hearts, stars) */}
      <div className="absolute top-20 right-10 w-16 h-16 opacity-20">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-pink-300 animate-pulse">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="absolute bottom-32 left-8 w-12 h-12 opacity-15">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full text-rose-300 animate-pulse"
          style={{ animationDelay: '1s' }}
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="absolute top-1/3 left-12 w-10 h-10 opacity-15">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full text-lavender-300 animate-pulse"
          style={{ animationDelay: '2s' }}
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
