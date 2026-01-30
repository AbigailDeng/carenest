import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useCompanion } from '../../hooks/useCompanion';
import { useEmotionalConversation } from '../../hooks/useEmotionalConversation';
import ImageBackground from '../shared/ImageBackground';
import FloatingParticles from './FloatingParticles';
import CharacterAvatar from './CharacterAvatar';
import { format } from 'date-fns';

const CHARACTER_ID = 'baiqi';

// Character illustration for emotional page (different from Health and Nutrition)
const EMOTIONAL_BACKGROUND_IMAGE = '/images/008fP45sly1hrx5691oorj318h1qyavr.jpg';

export default function EmotionalScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    characterState,
    loading: characterLoading,
    initializeCharacter,
    updateEnergyByTimeOfDay,
  } = useCompanion(CHARACTER_ID);

  // FR-045: Use dedicated emotional conversation hook
  const {
    messages,
    generating,
    typingIndicator,
    messagesLoading,
    sendMessage,
    generateResponseForLastMessage,
  } = useEmotionalConversation({
    characterId: CHARACTER_ID,
    memoryContextSize: 20, // Last 10-20 messages for memory continuity
    minResponseDelay: 1000, // 1-3 seconds minimum
    maxResponseDelay: 3000, // Up to 5 seconds for longer responses
  });

  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasCheckedForUnrepliedMessage = useRef(false);
  const hasScrolledOnMount = useRef(false);

  // Initialize character on mount
  useEffect(() => {
    if (isInitialized) return;

    const init = async () => {
      await initializeCharacter();
      await updateEnergyByTimeOfDay();
      setIsInitialized(true);
    };
    init();
  }, [initializeCharacter, updateEnergyByTimeOfDay, isInitialized]);

  // Scroll to bottom anchor when page loads or messages change
  // CRITICAL: First scroll on mount MUST be 'instant', not 'smooth'
  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }

    // First scroll on mount: use 'instant' behavior (must be instant, not smooth)
    if (!hasScrolledOnMount.current) {
      // Wait for messages to load and DOM to render
      if (!messagesLoading) {
        // Use multiple requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (messagesEndRef.current) {
              // CRITICAL: First scroll MUST be 'instant', not 'smooth'
              messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
              hasScrolledOnMount.current = true;
            }
          });
        });
      }
    } else {
      // Subsequent scrolls: use 'smooth' for new messages during conversation
      if (messages.length > 0) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length, messagesLoading]); // Trigger when messages load or change

  // FR-042: Auto-reply to user message when navigating from home page
  // Check if there's an unreplied user message (last message is from user) and auto-generate response
  useEffect(() => {
    // Only check once after:
    // 1. Character is initialized
    // 2. Messages are loaded (not loading and messages.length > 0)
    // 3. Not already checked
    // 4. Not currently generating
    if (
      !isInitialized ||
      hasCheckedForUnrepliedMessage.current ||
      generating ||
      messagesLoading ||
      !characterState ||
      messages.length === 0
    ) {
      return;
    }

    // Check if last message is from user (unreplied)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === 'user') {
      hasCheckedForUnrepliedMessage.current = true;
      // Auto-generate response to the user's message (without saving duplicate user message)
      generateResponseForLastMessage().catch(err => {
        console.error('Error auto-replying to user message:', err);
        hasCheckedForUnrepliedMessage.current = false; // Allow retry on error
      });
    }
  }, [
    messages,
    isInitialized,
    generating,
    messagesLoading,
    characterState,
    generateResponseForLastMessage,
  ]);

  // Handle user message submission
  const handleSendMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || generating || !characterState) return;

    setUserInput('');
    await sendMessage(trimmedInput);
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* FR-043: Full-screen character illustration background - same UI style as home page */}
      {/* ImageBackground only (no CharacterLayer) to match home page structure */}
      <ImageBackground imageUrl={EMOTIONAL_BACKGROUND_IMAGE} />

      {/* FR-043: FloatingParticles component */}
      <FloatingParticles count={20} />

      {/* FR-043: Navigation header with glassmorphism back button - fixed at top */}
      <div
        className="fixed top-0 left-0 right-0 z-30 flex items-center px-4 py-3"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          pointerEvents: 'none', // Allow clicks to pass through container
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-opacity active:opacity-80"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)',
            pointerEvents: 'auto', // Enable clicks on button
          }}
          aria-label={t('common.back') || 'Back'}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </button>
      </div>

      {/* FR-043: Conversation history display - scrollable area */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 60px)', // Space for fixed back button
          paddingBottom: '120px', // Space for fixed input field
        }}
      >
        {messages.length === 0 && !generating && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <CharacterAvatar
              characterId={CHARACTER_ID}
              characterState={characterState}
              size="lg"
              showBadge={true}
            />
            <p className="mt-4 text-base" style={{ color: '#FFFFFF' }}>
              {t('companion.noMessages') || 'No messages yet. Start a conversation!'}
            </p>
          </div>
        )}

        {/* FR-043: Message bubbles - user right-aligned, AI left-aligned */}
        {/* FR-045: Visual indicators for emotional state - CharacterAvatar expression changes, dialogue bubble styling variations */}
        {messages.map(message => {
          const isUser = message.sender === 'user';
          // FR-045: Get emotional state from message context or character state
          const messageMood = message.context?.mood || characterState?.mood || 'calm';

          // FR-045: Determine bubble styling based on emotional state
          const getBubbleStyle = (mood: string) => {
            const baseStyle = {
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(25px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)',
            };

            // FR-045: Visual variations based on mood
            switch (mood) {
              case 'happy':
                return {
                  ...baseStyle,
                  background: 'rgba(255, 240, 245, 0.25)',
                  border: '1px solid rgba(255, 182, 193, 0.5)',
                  boxShadow: '0 4px 24px rgba(255, 182, 193, 0.3)',
                };
              case 'concerned':
                return {
                  ...baseStyle,
                  background: 'rgba(255, 250, 240, 0.25)',
                  border: '1px solid rgba(255, 200, 150, 0.5)',
                  boxShadow: '0 4px 24px rgba(255, 200, 150, 0.3)',
                };
              case 'energetic':
                return {
                  ...baseStyle,
                  background: 'rgba(255, 245, 238, 0.25)',
                  border: '1px solid rgba(255, 160, 122, 0.5)',
                  boxShadow: '0 4px 24px rgba(255, 160, 122, 0.3)',
                };
              case 'tired':
                return {
                  ...baseStyle,
                  background: 'rgba(240, 240, 255, 0.25)',
                  border: '1px solid rgba(200, 200, 220, 0.5)',
                  boxShadow: '0 4px 24px rgba(200, 200, 220, 0.3)',
                };
              default: // calm
                return baseStyle;
            }
          };

          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* CharacterAvatar for AI messages - FR-045: Expression changes based on mood */}
              {!isUser && (
                <CharacterAvatar
                  characterId={CHARACTER_ID}
                  characterState={
                    characterState
                      ? { ...characterState, mood: messageMood as any }
                      : characterState
                  }
                  size="sm"
                  showBadge={false}
                />
              )}

              {/* Message bubble - FR-045: Styling variations reflect emotional state */}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
                }`}
                style={
                  isUser
                    ? {
                        background: 'rgba(255, 126, 157, 0.2)',
                        backdropFilter: 'blur(25px)',
                        border: '1px solid rgba(255, 126, 157, 0.4)',
                        boxShadow: '0 4px 24px rgba(255, 126, 157, 0.2)',
                      }
                    : getBubbleStyle(messageMood)
                }
              >
                <p className="text-base leading-relaxed" style={{ color: '#FFFFFF' }}>
                  {message.content}
                </p>
                <p
                  className="text-xs mt-1 opacity-60"
                  style={{ color: '#FFFFFF', textAlign: isUser ? 'right' : 'left' }}
                >
                  {format(new Date(message.timestamp), 'HH:mm')}
                </p>
              </div>

              {/* User avatar placeholder (right side) */}
              {isUser && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(255, 126, 157, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <span className="text-lg">👤</span>
                </div>
              )}
            </div>
          );
        })}

        {/* FR-045: Typing indicator */}
        {typingIndicator && (
          <div className="flex items-start gap-3 mb-4">
            <CharacterAvatar
              characterId={CHARACTER_ID}
              characterState={characterState}
              size="sm"
              showBadge={false}
            />
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#FFFFFF',
                    animation: 'typingDot 1.4s infinite',
                    animationDelay: '0s',
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#FFFFFF',
                    animation: 'typingDot 1.4s infinite',
                    animationDelay: '0.2s',
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#FFFFFF',
                    animation: 'typingDot 1.4s infinite',
                    animationDelay: '0.4s',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom anchor for scrolling - CRITICAL: Must use id='bottom-anchor' */}
        <div id="bottom-anchor" ref={messagesEndRef} />
      </div>

      {/* FR-043: Input field fixed at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 px-4 py-4"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(25px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.4)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        }}
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={t('companion.typeMessage') || 'Type a message...'}
            disabled={generating || !characterState}
            className="flex-1 px-4 py-3 rounded-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-base placeholder-white placeholder-opacity-70"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#FFFFFF',
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || generating || !characterState}
            className="flex items-center justify-center w-11 h-11 rounded-xl transition-opacity active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                !userInput.trim() || generating || !characterState
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 126, 157, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
            aria-label={t('companion.send') || 'Send'}
          >
            <Send
              size={20}
              color={!userInput.trim() || generating || !characterState ? '#999' : '#FFFFFF'}
            />
          </button>
        </div>
      </div>

      {/* Typing animation keyframes */}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
