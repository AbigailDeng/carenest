import { useState, useCallback } from 'react';
import { CharacterState, ConversationMessage, CharacterMood } from '../types';
import { generateCompanionDialogue, getTimeOfDay } from '../services/companionService';
import { useConversation } from './useConversation';
import { useCompanion } from './useCompanion';

export type UserEmotionalState = 'sad' | 'stressed' | 'lonely' | 'happy' | 'neutral' | undefined;

interface UseEmotionalConversationOptions {
  characterId: string;
  memoryContextSize?: number; // Number of recent messages to include (default: 20)
  minResponseDelay?: number; // Minimum response delay in ms (default: 1000)
  maxResponseDelay?: number; // Maximum response delay in ms (default: 3000)
}

interface UseEmotionalConversationReturn {
  messages: ConversationMessage[];
  generating: boolean;
  typingIndicator: boolean;
  messagesLoading: boolean; // Loading state from useConversation
  sendMessage: (userInput: string) => Promise<void>;
  generateResponseForLastMessage: () => Promise<void>; // Generate response for last user message without saving duplicate
  detectEmotionalState: (input: string) => UserEmotionalState;
}

/**
 * Hook for dedicated emotional conversation management
 * Provides memory continuity, emotional variation, and response delay support
 * Per FR-045: Realistic Conversation Mechanisms
 */
export function useEmotionalConversation(
  options: UseEmotionalConversationOptions
): UseEmotionalConversationReturn {
  const {
    characterId,
    memoryContextSize = 20,
    minResponseDelay = 1000,
    maxResponseDelay = 3000,
  } = options;

  const {
    messages,
    addMessage,
    getRecent,
    loading: messagesLoading,
  } = useConversation(characterId);
  const { characterState, updateMood, incrementCloseness } = useCompanion(characterId);

  const [generating, setGenerating] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);

  /**
   * Detect user's emotional state from input text
   * FR-045: Emotional variation detection
   */
  const detectEmotionalState = useCallback((input: string): UserEmotionalState => {
    const lowerInput = input.toLowerCase();

    if (
      lowerInput.includes('sad') ||
      lowerInput.includes('unhappy') ||
      lowerInput.includes('depressed') ||
      lowerInput.includes('难过') ||
      lowerInput.includes('不开心')
    ) {
      return 'sad';
    }

    if (
      lowerInput.includes('stress') ||
      lowerInput.includes('worried') ||
      lowerInput.includes('anxious') ||
      lowerInput.includes('压力') ||
      lowerInput.includes('焦虑')
    ) {
      return 'stressed';
    }

    if (
      lowerInput.includes('lonely') ||
      lowerInput.includes('alone') ||
      lowerInput.includes('孤单') ||
      lowerInput.includes('孤独')
    ) {
      return 'lonely';
    }

    if (
      lowerInput.includes('happy') ||
      lowerInput.includes('glad') ||
      lowerInput.includes('great') ||
      lowerInput.includes('开心') ||
      lowerInput.includes('高兴')
    ) {
      return 'happy';
    }

    return 'neutral';
  }, []);

  /**
   * Send a user message and generate character response
   * FR-045: Memory continuity, emotional variation, response delay
   */
  const sendMessage = useCallback(
    async (userInput: string): Promise<void> => {
      const trimmedInput = userInput.trim();
      if (!trimmedInput || generating || !characterState) {
        return;
      }

      try {
        setGenerating(true);
        setTypingIndicator(true);
        const timeOfDay = getTimeOfDay();

        // Save user message
        const userNow = new Date().toISOString();
        const userMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          timestamp: userNow,
          createdAt: userNow,
          updatedAt: userNow,
          characterId,
          sender: 'user',
          content: trimmedInput,
          messageType: 'text',
        };
        await addMessage(userMessage);

        // FR-045: Response delay simulation (varies slightly, not fixed timing)
        const delay = Math.random() * (maxResponseDelay - minResponseDelay) + minResponseDelay;
        await new Promise(resolve => setTimeout(resolve, delay));

        // FR-045: Memory continuity - get recent messages for context
        const recentMessages = await getRecent(memoryContextSize);

        // FR-045: Detect emotional state
        const userEmotionalState = detectEmotionalState(trimmedInput);

        // Generate dialogue with memory continuity and blended personality
        let dialogue;
        try {
          dialogue = await generateCompanionDialogue({
            characterId,
            userMessage: trimmedInput,
            characterState,
            conversationHistory: recentMessages,
            triggerType: 'user_initiated',
            userEmotionalState,
          });
        } catch (err: any) {
          console.warn('LLM generation failed, using template fallback:', err);
          const { selectDialogueTemplate } = await import('../services/companionService');
          const templateContent = selectDialogueTemplate({
            characterId,
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

        setTypingIndicator(false);

        // Create character response message
        const responseNow = new Date().toISOString();
        const characterMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          timestamp: responseNow,
          createdAt: responseNow,
          updatedAt: responseNow,
          characterId,
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
            // FR-045: Include emotionalState in context for visual indicators
            emotionalState: userEmotionalState,
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

        // FR-045: Dynamic mood updates based on user emotional expressions
        if (userEmotionalState === 'sad' || userEmotionalState === 'stressed') {
          await updateMood('concerned');
        } else if (userEmotionalState === 'happy') {
          await updateMood('happy');
        }
      } catch (err: any) {
        console.error('Error sending message:', err);
        setTypingIndicator(false);
      } finally {
        setGenerating(false);
      }
    },
    [
      characterId,
      characterState,
      generating,
      memoryContextSize,
      minResponseDelay,
      maxResponseDelay,
      addMessage,
      getRecent,
      detectEmotionalState,
      updateMood,
      incrementCloseness,
    ]
  );

  /**
   * Generate response for last user message without saving duplicate user message
   * Used when navigating from home page where user message is already saved
   * FR-042: Auto-reply when navigating from home page
   */
  const generateResponseForLastMessage = useCallback(async (): Promise<void> => {
    if (generating || !characterState || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    // Only generate response if last message is from user
    if (lastMessage.sender !== 'user') {
      return;
    }

    try {
      setGenerating(true);
      setTypingIndicator(true);
      const timeOfDay = getTimeOfDay();

      // FR-045: Response delay simulation (varies slightly, not fixed timing)
      const delay = Math.random() * (maxResponseDelay - minResponseDelay) + minResponseDelay;
      await new Promise(resolve => setTimeout(resolve, delay));

      // FR-045: Memory continuity - get recent messages for context
      const recentMessages = await getRecent(memoryContextSize);

      // FR-045: Detect emotional state
      const userEmotionalState = detectEmotionalState(lastMessage.content);

      // Generate dialogue with memory continuity and blended personality
      let dialogue;
      try {
        dialogue = await generateCompanionDialogue({
          characterId,
          userMessage: lastMessage.content,
          characterState,
          conversationHistory: recentMessages,
          triggerType: 'user_initiated',
          userEmotionalState,
        });
      } catch (err: any) {
        console.warn('LLM generation failed, using template fallback:', err);
        const { selectDialogueTemplate } = await import('../services/companionService');
        const templateContent = selectDialogueTemplate({
          characterId,
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

      setTypingIndicator(false);

      // Create character response message
      const responseNow = new Date().toISOString();
      const characterMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        timestamp: responseNow,
        createdAt: responseNow,
        updatedAt: responseNow,
        characterId,
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
          // FR-045: Include emotionalState in context for visual indicators
          emotionalState: userEmotionalState,
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

      // FR-045: Dynamic mood updates based on user emotional expressions
      if (userEmotionalState === 'sad' || userEmotionalState === 'stressed') {
        await updateMood('concerned');
      } else if (userEmotionalState === 'happy') {
        await updateMood('happy');
      }
    } catch (err: any) {
      console.error('Error generating response for last message:', err);
      setTypingIndicator(false);
    } finally {
      setGenerating(false);
    }
  }, [
    characterId,
    characterState,
    generating,
    messages,
    memoryContextSize,
    minResponseDelay,
    maxResponseDelay,
    addMessage,
    getRecent,
    detectEmotionalState,
    updateMood,
    incrementCloseness,
  ]);

  return {
    messages,
    generating,
    typingIndicator,
    messagesLoading,
    sendMessage,
    generateResponseForLastMessage,
    detectEmotionalState,
  };
}
