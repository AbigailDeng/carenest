import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useCompanion } from '../../hooks/useCompanion';
import { useConversation } from '../../hooks/useConversation';
import { useProactiveDialogue } from '../../hooks/useProactiveDialogue';
import { generateCompanionDialogue, getTimeOfDay } from '../../services/companionService';
import { ConversationMessage } from '../../types';
import ConversationBubble from './ConversationBubble';
import SceneBackground from './SceneBackground';
import CharacterAvatar from './CharacterAvatar';
import FloatingParticles from './FloatingParticles';
import { useOffline } from '../../hooks/useOffline';

const CHARACTER_ID = 'baiqi';

export default function CompanionScreen() {
  const { t } = useTranslation();
  const isOffline = useOffline();

  const {
    characterState,
    initializeCharacter,
    incrementCloseness,
    updateMood,
    updateEnergyByTimeOfDay,
  } = useCompanion(CHARACTER_ID);
  const { messages, addMessage, getRecent } = useConversation(CHARACTER_ID);

  const [userInput, setUserInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const inactivityCheckDone = useRef(false);
  const activityCheckDone = useRef(false);

  // Initialize character on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      initializeCharacter();
      updateEnergyByTimeOfDay();
      hasInitialized.current = true;
    }
  }, [initializeCharacter, updateEnergyByTimeOfDay]);

  // Handle proactive dialogue initiation
  const handleProactiveInitiate = useCallback(
    async (triggerType: any) => {
      if (!characterState || generating) return;

      try {
        setGenerating(true);
        setError(null);

        const recentMessages = await getRecent(10);
        const timeOfDay = getTimeOfDay();

        const dialogue = await generateCompanionDialogue({
          characterId: CHARACTER_ID,
          characterState,
          conversationHistory: recentMessages,
          triggerType,
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
            triggerType,
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
      } catch (err: any) {
        setError(err.message || t('companion.error'));
      } finally {
        setGenerating(false);
      }
    },
    [characterState, generating, getRecent, addMessage, updateMood, incrementCloseness, t]
  );

  // T047: Check for inactive health logging (3+ days) and implement gentle reminder dialogue
  useEffect(() => {
    // Skip if already checked or conditions not met
    if (inactivityCheckDone.current || !characterState || generating || messages.length === 0) {
      return;
    }

    const checkInactiveHealthLogging = async () => {
      try {
        inactivityCheckDone.current = true; // Mark as checked to prevent duplicate checks

        const { getDB } = await import('../../db');
        const db = await getDB();
        const now = new Date();
        const threeDaysAgo = new Date(now);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

        // Check for recent symptom entries (last 3 days)
        const symptomStore = db
          .transaction('symptomEntries', 'readonly')
          .objectStore('symptomEntries');
        const symptomIndex = symptomStore.index('loggedDate');
        const recentSymptoms = await symptomIndex.getAll(threeDaysAgoStr);

        // Check for recent food reflections (last 3 days)
        const foodStore = db
          .transaction('foodReflections', 'readonly')
          .objectStore('foodReflections');
        const foodIndex = foodStore.index('date');
        const recentFood = await foodIndex.getAll(threeDaysAgoStr);

        // Check if user has been inactive (no health or nutrition logging in 3+ days)
        const hasRecentActivity = recentSymptoms.length > 0 || recentFood.length > 0;
        const lastMessage = messages[0];
        const lastMessageTime = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;
        const hoursSinceLastMessage = (now.getTime() - lastMessageTime) / (1000 * 60 * 60);

        // Only remind if inactive AND haven't reminded recently (at least 24 hours since last message)
        if (!hasRecentActivity && hoursSinceLastMessage >= 24 && characterState) {
          const recentMessages = await getRecent(10);
          const dialogue = await generateCompanionDialogue({
            characterId: CHARACTER_ID,
            characterState,
            conversationHistory: recentMessages,
            triggerType: 'inactivity',
            integrationHint: 'health', // Gently suggest health module
          });

          const inactivityNow = new Date().toISOString();
          const characterMessage: ConversationMessage = {
            id: crypto.randomUUID(),
            timestamp: inactivityNow,
            createdAt: inactivityNow,
            updatedAt: inactivityNow,
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
              timeOfDay: getTimeOfDay(),
              relationshipStage: characterState.relationshipStage,
            },
            metadata: {
              isProactive: true,
              triggerType: 'inactivity',
              aiGenerated: dialogue.metadata.aiGenerated,
              templateId: dialogue.metadata.templateId,
            },
          };

          await addMessage(characterMessage);
        }
      } catch (err) {
        // Silently fail - inactivity check is optional
        console.warn('Failed to check inactive health logging:', err);
        inactivityCheckDone.current = false; // Reset on error to allow retry
      }
    };

    checkInactiveHealthLogging();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterState?.id]); // Only check once per character state load

  // Check for proactive dialogue
  useProactiveDialogue(characterState, handleProactiveInitiate);

  // Detect recent user activities and acknowledge them (User Story 2)
  useEffect(() => {
    // Skip if already checked or conditions not met
    if (activityCheckDone.current || !characterState || generating || messages.length === 0) {
      return;
    }

    const checkRecentActivities = async () => {
      activityCheckDone.current = true; // Mark as checked to prevent duplicate checks

      try {
        const { getDB } = await import('../../db');
        const db = await getDB();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Check for recent symptom entries (last 24 hours)
        const symptomStore = db
          .transaction('symptomEntries', 'readonly')
          .objectStore('symptomEntries');
        const symptomIndex = symptomStore.index('loggedDate');
        const recentSymptoms = await symptomIndex.getAll(yesterdayStr);
        const todaySymptoms = await symptomIndex.getAll(today);
        const allRecentSymptoms = [...recentSymptoms, ...todaySymptoms].filter(entry => {
          const entryTime = new Date(entry.loggedTime);
          const hoursAgo = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
          return hoursAgo <= 24 && hoursAgo >= 0.5; // Between 30 minutes and 24 hours ago
        });

        // Check for recent food reflections (last 24 hours)
        const foodStore = db
          .transaction('foodReflections', 'readonly')
          .objectStore('foodReflections');
        const foodIndex = foodStore.index('date');
        const recentFood = await foodIndex.getAll(yesterdayStr);
        const todayFood = await foodIndex.getAll(today);
        const allRecentFood = [...recentFood, ...todayFood].filter(entry => {
          const entryTime = new Date(entry.createdAt);
          const hoursAgo = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
          return hoursAgo <= 24 && hoursAgo >= 0.5; // Between 30 minutes and 24 hours ago
        });

        // Check if we've already acknowledged these activities
        const lastMessage = messages[0];
        const lastMessageTime = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;
        const shouldAcknowledge =
          (allRecentSymptoms.length > 0 || allRecentFood.length > 0) &&
          now.getTime() - lastMessageTime > 5 * 60 * 1000; // At least 5 minutes since last message

        if (shouldAcknowledge && characterState) {
          let activityType: 'health' | 'nutrition' | 'both' | null = null;
          if (allRecentSymptoms.length > 0 && allRecentFood.length > 0) {
            activityType = 'both';
          } else if (allRecentSymptoms.length > 0) {
            activityType = 'health';
          } else if (allRecentFood.length > 0) {
            activityType = 'nutrition';
          }

          if (activityType) {
            const recentMessages = await getRecent(10);
            const dialogue = await generateCompanionDialogue({
              characterId: CHARACTER_ID,
              characterState,
              conversationHistory: recentMessages,
              triggerType: 'activity_acknowledgment',
              integrationHint: activityType === 'both' ? null : activityType,
            });

            const activityNow = new Date().toISOString();
            const characterMessage: ConversationMessage = {
              id: crypto.randomUUID(),
              timestamp: activityNow,
              createdAt: activityNow,
              updatedAt: activityNow,
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
                timeOfDay: getTimeOfDay(),
                relationshipStage: characterState.relationshipStage,
              },
              metadata: {
                isProactive: true,
                triggerType: 'activity_acknowledgment',
                aiGenerated: dialogue.metadata.aiGenerated,
                templateId: dialogue.metadata.templateId,
              },
            };

            await addMessage(characterMessage);
            await incrementCloseness(1);
          }
        }
      } catch (err) {
        // Silently fail - activity detection is optional
        console.warn('Failed to check recent activities:', err);
        activityCheckDone.current = false; // Reset on error to allow retry
      }
    };

    checkRecentActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterState?.id, messages.length]); // Only check when character or message count changes

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle user message submission
  const handleSendMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || generating || !characterState) return;

    try {
      setError(null);
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
      setGenerating(true);
      const recentMessages = await getRecent(10);

      // Detect emotional state (simple keyword detection)
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

      // T064, T067: Graceful error handling for LLM service failures
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
      } catch (err: any) {
        // Fallback to template if LLM fails
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

      // Update mood based on user emotional state
      if (userEmotionalState === 'sad' || userEmotionalState === 'stressed') {
        await updateMood('concerned');
      } else if (userEmotionalState === 'happy') {
        await updateMood('happy');
      }
    } catch (err: any) {
      setError(err.message || t('companion.error'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: '#FDEEF4' }}>
      {/* Scene Background with mood variations (per FR-025) */}
      <SceneBackground characterId={CHARACTER_ID} mood={characterState?.mood} />

      {/* T081: Floating light particles */}
      <FloatingParticles count={15} />

      {/* Header - Refined Glassmorphism */}
      <div
        className="relative z-10 flex items-center justify-between px-4 py-4 backdrop-blur-[15px]"
        style={{
          background: '#ffffff66', // Semi-transparent white
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <div className="flex items-center gap-3">
          <CharacterAvatar
            characterId={CHARACTER_ID}
            characterState={characterState}
            size="md"
            showBadge={true}
          />
          <div>
            <h1 className="text-lg font-heading" style={{ color: '#8B5A7A' }}>
              {characterState ? t('companion.title') || 'Companion' : '...'}
            </h1>
            {characterState && (
              <p className="text-xs" style={{ color: '#8B5A7A', opacity: 0.7 }}>
                {characterState.relationshipStage}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-xl transition-colors touch-target backdrop-blur-[15px]"
          style={{
            background: '#ffffff66',
            color: '#8B5A7A',
          }}
          aria-label={t('common.close')}
        >
          <span className="text-xl">←</span>
        </button>
      </div>

      {/* Conversation Area */}
      <div
        className="relative z-10 flex-1 overflow-y-auto px-4 py-6"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(255, 182, 193, 0.05))',
        }}
      >
        {messages.length === 0 && !generating && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <CharacterAvatar
              characterId={CHARACTER_ID}
              characterState={characterState}
              size="lg"
              showBadge={true}
            />
            <p className="mt-4 text-gray-600">{t('companion.noMessages')}</p>
          </div>
        )}

        {generating && messages.length === 0 && (
          <div className="flex items-center gap-3 mb-4">
            <CharacterAvatar
              characterId={CHARACTER_ID}
              characterState={characterState}
              size="sm"
              showBadge={false}
            />
            <div className="bg-gradient-to-br from-pink-50/95 via-rose-50/95 to-lavender-50/95 rounded-2xl px-4 py-3 shadow-lg border border-pink-200/50 backdrop-blur-sm">
              <p className="text-sm text-gray-700 font-body">{t('companion.generating')}</p>
            </div>
          </div>
        )}

        {messages.map(message => (
          <ConversationBubble
            key={message.id}
            message={message}
            characterId={CHARACTER_ID}
            characterState={characterState}
          />
        ))}

        {generating && messages.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <CharacterAvatar
              characterId={CHARACTER_ID}
              characterState={characterState}
              size="sm"
              showBadge={false}
            />
            <div className="bg-gradient-to-br from-pink-50/95 via-rose-50/95 to-lavender-50/95 rounded-2xl px-4 py-3 shadow-lg border border-pink-200/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl px-4 py-3 mb-4 backdrop-blur-[15px]"
            style={{
              background: '#ffcccc66', // Light red with transparency
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '12px',
            }}
          >
            <p className="text-sm" style={{ color: '#8B5A7A' }}>
              {error}
            </p>
          </div>
        )}

        {isOffline && (
          <div
            className="rounded-xl px-4 py-3 mb-4 backdrop-blur-[15px]"
            style={{
              background: '#ffffcc66', // Light yellow with transparency
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '12px',
            }}
          >
            <p className="text-sm" style={{ color: '#8B5A7A' }}>
              {t('companion.offline')}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Refined Glassmorphism */}
      <div
        className="relative z-10 backdrop-blur-[15px] px-4 py-4"
        style={{
          background: '#ffffff66', // Semi-transparent white
          borderTop: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <div className="flex gap-3">
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
            placeholder={t('companion.typeMessage')}
            disabled={generating || !characterState}
            className="
              flex-1
              px-4
              py-3
              rounded-xl
              backdrop-blur-[15px]
              focus:outline-none
              disabled:opacity-50
              disabled:cursor-not-allowed
              font-body
            "
            style={{
              background: '#ffffff66', // Semi-transparent white
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: '#8B5A7A', // Dark gray-pink text
              borderRadius: '12px',
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || generating || !characterState}
            style={{
              background:
                !userInput.trim() || generating || !characterState ? '#cccccc' : '#FFD1DC', // Light pink accent
              color: '#8B5A7A', // Dark gray-pink text
              borderRadius: '12px',
            }}
            className="
              px-6
              py-3
              font-semibold
              backdrop-blur-[15px]
              disabled:cursor-not-allowed
              transition-all
              duration-200
              touch-target
              font-body
            "
          >
            {t('companion.send')}
          </button>
        </div>

        {/* Footer CTA */}
        <div className="mt-4 text-center relative">
          {/* Decorative hearts */}
          <div className="absolute -top-2 left-1/4 w-4 h-4 opacity-30">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-pink-300">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="absolute -top-2 right-1/4 w-4 h-4 opacity-30">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-rose-300">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="currentColor"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-700 font-medium font-body">
            {t('companion.contactByPhone')}
          </p>
          <p className="text-xs text-gray-600 mt-1 font-body">{t('companion.chatFreely')}</p>
        </div>
      </div>
    </div>
  );
}
