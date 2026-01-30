import { CharacterState } from '../../types';
import { getCharacterConfig } from '../../config/characters';
import RelationshipBadge from './RelationshipBadge';

interface CharacterAvatarProps {
  characterId: string;
  characterState: CharacterState | null;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export default function CharacterAvatar({
  characterId,
  characterState,
  size = 'md',
  showBadge = true,
}: CharacterAvatarProps) {
  const config = getCharacterConfig(characterId);
  if (!config) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="relative inline-block">
      {/* Decorative glow effect */}
      <div
        className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gradient-to-br from-pink-200/50 to-rose-200/50 blur-md opacity-60 -z-10`}
      />
      <img
        src="/images/images.jpg"
        alt={config.name.en || config.name.zh || 'Character'}
        className={`${sizeClasses[size]} rounded-full object-cover border-4 border-white/90 shadow-xl ring-2 ring-pink-200/50`}
        onError={e => {
          // Fallback to placeholder if image fails to load
          (e.target as HTMLImageElement).src =
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTIgMTJDMTQuNzYxNCAxMiAxNyA5Ljc2MTQyIDE3IDdDMTcgNC4yMzg1OCAxNC43NjE0IDIgMTIgMkM5LjIzODU4IDIgNyA0LjIzODU4IDcgN0M3IDkuNzYxNDIgOS4yMzg1OCAxMiAxMiAxMloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEyIDE0QzguNjg2MyAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K';
        }}
      />
      {showBadge && characterState && (
        <div className="absolute -bottom-1 -right-1">
          <RelationshipBadge closeness={characterState.closeness} />
        </div>
      )}
    </div>
  );
}
