import { useNavigate } from 'react-router-dom';
import { ConversationMessage } from '../../types';
import CharacterAvatar from './CharacterAvatar';
import CharacterIllustration from './CharacterIllustration';

interface ConversationBubbleProps {
  message: ConversationMessage;
  characterId: string;
  characterState: any;
}

export default function ConversationBubble({
  message,
  characterId,
  characterState,
}: ConversationBubbleProps) {
  const navigate = useNavigate();
  const isCharacter = message.sender === 'character';

  // T045: Navigation helpers - detect module suggestions in dialogue and add navigation
  const handleNavigateToModule = (module: 'health' | 'nutrition' | 'emotional') => {
    const paths = {
      health: '/health',
      nutrition: '/nutrition',
      emotional: '/emotional',
    };
    navigate(paths[module]);
  };

  // Detect if message suggests navigating to a module
  const detectModuleSuggestion = (content: string): 'health' | 'nutrition' | 'emotional' | null => {
    const lowerContent = content.toLowerCase();
    if (
      lowerContent.includes('health') ||
      lowerContent.includes('symptom') ||
      lowerContent.includes('log your symptom')
    ) {
      return 'health';
    }
    if (
      lowerContent.includes('nutrition') ||
      lowerContent.includes('meal') ||
      lowerContent.includes('food') ||
      lowerContent.includes('log your meal')
    ) {
      return 'nutrition';
    }
    if (
      lowerContent.includes('emotion') ||
      lowerContent.includes('mood') ||
      lowerContent.includes('feeling')
    ) {
      return 'emotional';
    }
    return null;
  };

  const suggestedModule = isCharacter ? detectModuleSuggestion(message.content) : null;

  return (
    <div
      className={`
        flex
        gap-3
        mb-4
        ${isCharacter ? 'justify-start' : 'justify-end'}
      `}
    >
      {isCharacter && (
        <CharacterAvatar
          characterId={characterId}
          characterState={characterState}
          size="sm"
          showBadge={false}
        />
      )}

      <div
        className={`
          relative
          max-w-[75%]
          px-5
          py-4
          ${isCharacter ? 'rounded-tl-sm' : 'rounded-tr-sm'}
        `}
        style={{
          // Readability-first glassmorphism (requested)
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(30px)',
          borderRadius: '24px',
          border: `1px solid ${
            isCharacter && characterState?.mood
              ? characterState.mood === 'happy'
                ? 'rgba(255, 182, 193, 0.6)' // Pink tint for happy
                : characterState.mood === 'concerned'
                ? 'rgba(255, 200, 87, 0.5)' // Warm yellow tint for concerned
                : characterState.mood === 'energetic'
                ? 'rgba(147, 197, 253, 0.5)' // Blue tint for energetic
                : 'rgba(255, 255, 255, 0.55)' // Default white
              : 'rgba(255, 255, 255, 0.55)'
          }`,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(255, 209, 220, 0.18)',
          color: '#4A4A4A',
          fontFamily: "'Montserrat', 'PingFang SC', 'PingFang Light', sans-serif",
          fontWeight: 300,
        }}
      >
        {/* Decorative floral corner (for character messages) */}
        {isCharacter && (
          <div className="absolute -top-2 -left-2 w-8 h-8 opacity-30">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-pink-300">
              <path
                d="M12 2C8 2 6 4 6 8c0 4 2 6 6 6s6-2 6-6c0-4-2-6-6-6z"
                fill="currentColor"
                opacity="0.3"
              />
              <path
                d="M8 12c-2 0-4-2-4-4s2-4 4-4 4 2 4 4-2 4-4 4z"
                fill="currentColor"
                opacity="0.2"
              />
              <path
                d="M16 12c2 0 4-2 4-4s-2-4-4-4-4 2-4 4 2 4 4 4z"
                fill="currentColor"
                opacity="0.2"
              />
            </svg>
          </div>
        )}

        {isCharacter && message.characterImageUrl && (
          <div className="mb-3 -mx-1">
            <CharacterIllustration imageUrl={message.characterImageUrl} />
          </div>
        )}

        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            color: '#4A4A4A',
            fontFamily: "'Montserrat', 'PingFang SC', 'PingFang Light', sans-serif",
            fontWeight: 300,
          }}
        >
          {message.content}
        </p>

        {/* T045: Navigation helper button if module suggestion detected */}
        {suggestedModule && (
          <button
            onClick={() => handleNavigateToModule(suggestedModule)}
            className="
              mt-3
              w-full
              px-4
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              transition-all
              duration-200
              font-body
              backdrop-blur-[15px]
            "
            style={{
              background: '#FFD1DC', // Light pink accent
              color: '#4A4A4A', // Dark gray text
              borderRadius: '12px',
            }}
          >
            {suggestedModule === 'health' && '💊 前往健康模块'}
            {suggestedModule === 'nutrition' && '🍎 前往营养模块'}
            {suggestedModule === 'emotional' && '💝 前往情感模块'}
          </button>
        )}

        {message.choices && message.choices.length > 0 && (
          <div className="mt-4 space-y-2">
            {message.choices.map((choice, index) => (
              <button
                key={index}
                className="
                  w-full
                  text-left
                  px-4
                  py-2.5
                  rounded-xl
                  text-sm
                  transition-all
                  duration-200
                  font-body
                  backdrop-blur-[15px]
                "
                style={{
                  background: 'rgba(255, 255, 255, 0.15)', // Premium glassmorphism
                  color: '#8B5A7A', // Dark gray-pink text
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  fontFamily: "'Montserrat', 'PingFang SC', 'PingFang Light', sans-serif",
                  fontWeight: 300,
                }}
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        <p
          className="text-xs mt-3"
          style={{
            color: '#4A4A4A',
            opacity: 0.6,
            fontFamily: "'Montserrat', 'PingFang SC', 'PingFang Light', sans-serif",
            fontWeight: 300,
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {!isCharacter && (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{
            background: 'rgba(255, 255, 255, 0.15)', // Premium glassmorphism
            backdropFilter: 'blur(25px)',
            color: '#8B5A7A', // Dark gray-pink text
            border: '1px solid rgba(255, 255, 255, 0.4)',
            fontFamily: "'Montserrat', 'PingFang SC', 'PingFang Light', sans-serif",
            fontWeight: 300,
          }}
        >
          我
        </div>
      )}
    </div>
  );
}
