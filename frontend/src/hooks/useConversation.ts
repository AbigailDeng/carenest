import { useState, useEffect, useCallback } from 'react';
import {
  saveMessage,
  getMessages,
  getRecentMessages,
  deleteMessages,
} from '../services/storage/conversationStorage';
import { ConversationMessage } from '../types';

export function useConversation(characterId: string) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load conversation history
   */
  const loadHistory = useCallback(
    async (limit: number = 50) => {
      try {
        setLoading(true);
        const history = await getMessages(characterId, { limit, order: 'desc' });
        // Reverse to show oldest first (for display)
        setMessages(history.reverse());
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load conversation history');
      } finally {
        setLoading(false);
      }
    },
    [characterId]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /**
   * Add a new message to the conversation
   */
  const addMessage = useCallback(async (message: ConversationMessage) => {
    try {
      await saveMessage(message);
      // Keep display order oldest -> newest (append)
      setMessages(prev => [...prev, message]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save message');
      throw err;
    }
  }, []);

  /**
   * Get recent messages for context (last N messages)
   */
  const getRecent = useCallback(
    async (limit: number = 10): Promise<ConversationMessage[]> => {
      try {
        return await getRecentMessages(characterId, limit);
      } catch (err: any) {
        setError(err.message || 'Failed to get recent messages');
        return [];
      }
    },
    [characterId]
  );

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(async () => {
    try {
      await deleteMessages(characterId);
      setMessages([]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to clear conversation history');
    }
  }, [characterId]);

  return {
    messages,
    loading,
    error,
    addMessage,
    loadHistory,
    getRecent,
    clearHistory,
  };
}
