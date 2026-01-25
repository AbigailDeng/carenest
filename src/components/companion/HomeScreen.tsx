import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useCompanion } from '../../hooks/useCompanion';
import { useConversation } from '../../hooks/useConversation';
import { generateCompanionDialogue, getTimeOfDay } from '../../services/companionService';
import { ConversationMessage } from '../../types';
import CharacterLayer from './CharacterLayer';
import SceneBackground from './SceneBackground';
import FloatingParticles from './FloatingParticles';
import FunctionSpheres from './FunctionSpheres';
import IconExpansionTransition from './IconExpansionTransition';
import FullScreenChartPanel from './FullScreenChartPanel';
import ImageBackground from '../shared/ImageBackground';

const CHARACTER_ID = 'baiqi';

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    characterState,
    loading: characterLoading,
    initializeCharacter,
    updateEnergyByTimeOfDay,
    incrementCloseness,
    updateMood,
  } = useCompanion(CHARACTER_ID);
  const { messages, addMessage, getRecent } = useConversation(CHARACTER_ID);

  const [userInput, setUserInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [expandingIcon, setExpandingIcon] = useState<{
    module: 'health' | 'nutrition' | 'emotion';
    position: { x: number; y: number; width: number; height: number };
    element: React.ReactNode;
  } | null>(null);

  const hasInitialized = useRef(false);
  const greetingGenerated = useRef(false);

  // Initialize character on mount (only once)
  useEffect(() => {
    if (hasInitialized.current) return;

    const init = async () => {
      await initializeCharacter();
      await updateEnergyByTimeOfDay();
      hasInitialized.current = true;
    };
    init();
  }, [initializeCharacter, updateEnergyByTimeOfDay]);

  // Generate initial greeting (only once when characterState is ready)
  useEffect(() => {
    if (characterLoading || greetingGenerated.current || !characterState || messages.length > 0) {
      return;
    }

    greetingGenerated.current = true;

    const generateGreeting = async () => {
      try {
        setGenerating(true);
        const timeOfDay = getTimeOfDay();
        const isFirstTime = characterState.totalInteractions === 0;
        const lastInteractionTime = new Date(characterState.lastInteractionTime);
        const daysSinceInteraction =
          (Date.now() - lastInteractionTime.getTime()) / (1000 * 60 * 60 * 24);
        const isInactive = daysSinceInteraction >= 7;

        let triggerType: 'morning_greeting' | 'evening_greeting' | 'user_initiated' | 'inactivity' =
          'user_initiated';
        if (isFirstTime) {
          triggerType = 'user_initiated';
        } else if (isInactive) {
          triggerType = 'inactivity';
        } else if (timeOfDay === 'morning') {
          triggerType = 'morning_greeting';
        } else if (timeOfDay === 'evening') {
          triggerType = 'evening_greeting';
        }

        const dialogue = await generateCompanionDialogue({
          characterId: CHARACTER_ID,
          characterState,
          conversationHistory: [],
          triggerType: isInactive ? 'inactivity' : triggerType,
        });

        const now = new Date().toISOString();
        const characterMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          timestamp: now,
          createdAt: now,
          updatedAt: now,
          characterId: CHARACTER_ID,
          sender: 'character',
          content: dialogue.content,
          messageType: dialogue.messageType,
          choices: dialogue.choices,
          characterImageUrl: dialogue.characterImageUrl,
          context: {
            mood: characterState.mood,
            closeness: characterState.closeness,
            energy: characterState.energy,
            timeOfDay,
            relationshipStage: characterState.relationshipStage,
          },
          metadata: {
            isProactive: true,
            triggerType: isInactive ? 'inactivity' : triggerType,
            aiGenerated: dialogue.metadata.aiGenerated,
            templateId: dialogue.metadata.templateId,
          },
        };

        await addMessage(characterMessage);
        if (dialogue.suggestedMood) {
          await updateMood(dialogue.suggestedMood);
        }
        await incrementCloseness(1);
      } catch (err) {
        console.warn('Failed to generate greeting, using template fallback:', err);
        const { getCharacterConfig } = await import('../../config/characters');
        const config = getCharacterConfig(CHARACTER_ID);
        if (config) {
          const timeOfDay = getTimeOfDay();
          const templates =
            config.dialogueTemplates.greetings[timeOfDay] ||
            config.dialogueTemplates.greetings.morning;
          const fallbackNow = new Date().toISOString();
          const fallbackMessage: ConversationMessage = {
            id: crypto.randomUUID(),
            timestamp: fallbackNow,
            createdAt: fallbackNow,
            updatedAt: fallbackNow,
            characterId: CHARACTER_ID,
            sender: 'character',
            content: templates[0] || 'Hello! How can I help you today?',
            messageType: 'text',
            context: {
              mood: characterState?.mood || 'calm',
              closeness: characterState?.closeness || 0,
              energy: characterState?.energy || 'medium',
              timeOfDay: getTimeOfDay(),
              relationshipStage: characterState?.relationshipStage || 'stranger',
            },
            metadata: {
              isProactive: true,
              triggerType: 'user_initiated',
              aiGenerated: false,
              templateId: 'fallback',
            },
          };
          await addMessage(fallbackMessage);
        }
      } finally {
        setGenerating(false);
      }
    };

    generateGreeting();
  }, [
    characterLoading,
    characterState?.id,
    messages.length,
    addMessage,
    updateMood,
    incrementCloseness,
  ]);

  const latestCharacterMessage = useMemo(() => {
    // messages are kept oldest -> newest; pick the latest character line
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.sender === 'character') return messages[i];
    }
    return null;
  }, [messages]);

  // Handle user message submission
  const handleSendMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || generating || !characterState) return;

    try {
      setGenerating(true);
      const timeOfDay = getTimeOfDay();

      // Save user message
      const userNow = new Date().toISOString();
      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        timestamp: userNow,
        createdAt: userNow,
        updatedAt: userNow,
        characterId: CHARACTER_ID,
        sender: 'user',
        content: trimmedInput,
        messageType: 'text',
      };
      await addMessage(userMessage);
      setUserInput('');

      // Generate character response
      const recentMessages = await getRecent(10);

      // Detect emotional state
      let userEmotionalState: 'sad' | 'stressed' | 'lonely' | 'happy' | 'neutral' | undefined;
      const lowerInput = trimmedInput.toLowerCase();
      if (
        lowerInput.includes('sad') ||
        lowerInput.includes('unhappy') ||
        lowerInput.includes('depressed')
      ) {
        userEmotionalState = 'sad';
      } else if (
        lowerInput.includes('stress') ||
        lowerInput.includes('worried') ||
        lowerInput.includes('anxious')
      ) {
        userEmotionalState = 'stressed';
      } else if (lowerInput.includes('lonely') || lowerInput.includes('alone')) {
        userEmotionalState = 'lonely';
      } else if (
        lowerInput.includes('happy') ||
        lowerInput.includes('glad') ||
        lowerInput.includes('great')
      ) {
        userEmotionalState = 'happy';
      }

      let dialogue;
      try {
        dialogue = await generateCompanionDialogue({
          characterId: CHARACTER_ID,
          userMessage: trimmedInput,
          characterState,
          conversationHistory: recentMessages,
          triggerType: 'user_initiated',
          userEmotionalState,
        });
      } catch (err) {
        console.warn('LLM generation failed, using template fallback:', err);
        const { selectDialogueTemplate } = await import('../../services/companionService');
        const templateContent = selectDialogueTemplate({
          characterId: CHARACTER_ID,
          characterState,
          conversationHistory: recentMessages,
          triggerType: 'user_initiated',
          userEmotionalState,
        });
        dialogue = {
          content: templateContent,
          messageType: 'text' as const,
          metadata: {
            aiGenerated: false,
            templateId: 'fallback',
            processingTime: 0,
          },
        };
      }

      const responseNow = new Date().toISOString();
      const characterMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        timestamp: responseNow,
        createdAt: responseNow,
        updatedAt: responseNow,
        characterId: CHARACTER_ID,
        sender: 'character',
        content: dialogue.content,
        messageType: dialogue.messageType,
        choices: dialogue.choices,
        characterImageUrl: dialogue.characterImageUrl,
        context: {
          mood: characterState.mood,
          closeness: characterState.closeness,
          energy: characterState.energy,
          timeOfDay,
          relationshipStage: characterState.relationshipStage,
        },
        metadata: {
          isProactive: false,
          triggerType: 'user_initiated',
          aiGenerated: dialogue.metadata.aiGenerated,
          templateId: dialogue.metadata.templateId,
        },
      };

      await addMessage(characterMessage);

      // Update character state
      if (dialogue.suggestedMood) {
        await updateMood(dialogue.suggestedMood);
      }
      await incrementCloseness(1);

      if (userEmotionalState === 'sad' || userEmotionalState === 'stressed') {
        await updateMood('concerned');
      } else if (userEmotionalState === 'happy') {
        await updateMood('happy');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Handle function sphere clicks - FR-031I: Direct navigation to functional screens
  const handleFunctionClick = (module: 'health' | 'nutrition' | 'emotion') => {
    // Route mapping: health → /health, nutrition → /nutrition, emotion → /emotional
    const routeMap: Record<'health' | 'nutrition' | 'emotion', string> = {
      health: '/health',
      nutrition: '/nutrition',
      emotion: '/emotional',
    };

    const route = routeMap[module];
    if (route) {
      navigate(route);
    }
  };

  // Handle panel close
  const handlePanelClose = () => {
    setExpandingIcon(null);
  };

  // Character layer URLs
  const characterLayerUrls = [
    '/assets/characters/baiqi/illustrations/gavin-character.png',
    'https://gd-hbimg-edge.huaban.com/e4b350614dc31956b17bdf09aa2f2eeaa0fc787cc0376-UVVzl0_fw658webp',
    'https://i.pinimg.com/564x/8b/9a/36/8b9a368031f439d94631df685c360739.jpg',
  ];

  // Background image URL
  const backgroundImageUrl =
    'https://i.pinimg.com/564x/a6/39/19/a639190333210fb5da77b4903661354e.jpg';

  return (
    <ImageBackground imageUrl={backgroundImageUrl}>
      <div
        className="relative min-h-screen flex flex-col overflow-hidden"
        style={{ background: '#FDEEF4' }}
      >
        {/* Minimal transparent title (replaces ugly white bar) */}
        <div
          className="fixed left-5 top-5 z-[55]"
          style={{
            color: 'rgba(255,255,255,0.98)',
            textShadow: '0 2px 10px rgba(0,0,0,0.25)',
            fontFamily: "'Montserrat', 'PingFang SC', 'PingFang Light', sans-serif",
            fontWeight: 500,
            letterSpacing: '0.2px',
          }}
        >
          {t('app.title') || 'Wellmate'}
        </div>

        {/* Character Layer - Full-screen with floating animation */}
        <div
          className="fixed inset-0"
          style={{
            zIndex: 3,
            pointerEvents: 'none', // Don't block clicks on conversation area
          }}
        >
          <CharacterLayer
            imageUrl={characterLayerUrls}
            resizeMode="cover"
            alt="Character illustration"
          />
        </div>

        {/* Scene Background */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <SceneBackground characterId={CHARACTER_ID} />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <FloatingParticles count={20} />
        </div>

        {/* Function Spheres - Top Right */}
        <FunctionSpheres
          onHealthClick={() => handleFunctionClick('health')}
          onNutritionClick={() => handleFunctionClick('nutrition')}
          onEmotionClick={() => handleFunctionClick('emotion')}
        />

        {/* Single latest dialogue bubble (focus on Baiqi face) */}
        <div
          className="fixed left-0 right-0 z-20 flex justify-center px-4"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 92px)', // above input capsule
            pointerEvents: 'none',
          }}
        >
          <div
            className="w-full max-w-[92%] px-6 py-5"
            style={{
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(30px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.55)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(255, 209, 220, 0.18)',
              color: '#4A4A4A',
              fontFamily: "'Montserrat', 'PingFang SC', 'PingFang Light', sans-serif",
              fontWeight: 300,
              pointerEvents: 'auto',
            }}
          >
            <p className="text-[15px] leading-relaxed" style={{ color: '#4A4A4A' }}>
              {latestCharacterMessage?.content ||
                (characterLoading ? '' : t('companion.noMessages') || '...')}
            </p>
            {generating && (
              <div className="mt-3 flex items-center gap-2 opacity-70">
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: '#FFD1DC' }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: '#FFD1DC', animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: '#FFD1DC', animationDelay: '0.4s' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom input capsule (90% width, 60px height, minimal glass) */}
        <div
          className="fixed left-0 right-0 z-30 safe-area-bottom flex justify-center pb-4"
          style={{ bottom: 0 }}
        >
          <div
            className="flex items-center gap-3 px-3"
            style={{
              width: '90vw',
              height: '60px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: '9999px',
              boxShadow: '0 12px 44px rgba(0,0,0,0.16)',
            }}
          >
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
              placeholder={t('companion.typeMessage') || '输入消息...'}
              disabled={generating || !characterState}
              className="flex-1 px-4 h-[46px] rounded-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-light text-base"
              style={{
                background: 'rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                color: '#4A4A4A',
                fontFamily: "'Montserrat', 'PingFang SC', 'PingFang Light', sans-serif",
                fontWeight: 300,
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || generating || !characterState}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 touch-target disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  !userInput.trim() || generating || !characterState
                    ? 'rgba(255, 255, 255, 0.3)'
                    : '#FFD1DC',
                color: '#4A4A4A',
                boxShadow:
                  !userInput.trim() || generating || !characterState
                    ? 'none'
                    : '0 2px 8px rgba(255, 209, 220, 0.4)',
              }}
              onMouseDown={e => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.transform = 'scale(0.95)';
                }
              }}
              onMouseUp={e => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

        {/* Icon Expansion Transition */}
        {expandingIcon && (
          <IconExpansionTransition
            isExpanding={true}
            iconElement={expandingIcon.element}
            iconPosition={expandingIcon.position}
            panelContent={<FullScreenChartPanel module={expandingIcon.module} />}
            onClose={handlePanelClose}
          />
        )}
      </div>
    </ImageBackground>
  );
}
