import { getDB } from '../../db';
import { ConversationMessage } from '../../types';

export interface GetMessagesOptions {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
  startDate?: string; // ISO 8601 date
  endDate?: string; // ISO 8601 date
}

/**
 * Save a conversation message
 */
export async function saveMessage(message: ConversationMessage): Promise<void> {
  const db = await getDB();
  await db.put('conversations', message);
}

/**
 * Get messages for a character with pagination and filtering
 */
export async function getMessages(
  characterId: string,
  options: GetMessagesOptions = {}
): Promise<ConversationMessage[]> {
  const db = await getDB();
  const { limit = 50, offset = 0, order = 'desc', startDate, endDate } = options;

  // Use compound index for efficient querying: ['characterId', 'timestamp']
  const tx = db.transaction('conversations', 'readonly');
  const store = tx.objectStore('conversations');
  const index = store.index('characterId_timestamp');

  const startTs = startDate ? `${startDate}T00:00:00.000Z` : '';
  const endTs = endDate ? `${endDate}T23:59:59.999Z` : '\uffff';

  // Get all messages for this character (optionally in date range)
  const range = IDBKeyRange.bound([characterId, startTs], [characterId, endTs], false, false);
  const messages: ConversationMessage[] = (await index.getAll(range)) as ConversationMessage[];
  await tx.done;

  // Sort by timestamp
  messages.sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return order === 'desc' ? bTime - aTime : aTime - bTime;
  });

  // Apply pagination
  const paginated = messages.slice(offset, offset + limit);

  return paginated;
}

/**
 * Get recent messages for context (last N messages)
 */
export async function getRecentMessages(
  characterId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  return getMessages(characterId, { limit, order: 'desc' });
}

/**
 * Delete messages for a character
 * Optionally filter by date range
 */
export async function deleteMessages(
  characterId: string,
  options: { startDate?: string; endDate?: string } = {}
): Promise<void> {
  const db = await getDB();
  const { startDate, endDate } = options;

  const messages = await getMessages(characterId, { startDate, endDate });

  const tx = db.transaction('conversations', 'readwrite');
  const store = tx.objectStore('conversations');

  for (const message of messages) {
    await store.delete(message.id);
  }

  await tx.done;
}

/**
 * Export conversation history as JSON
 */
export async function exportConversationHistory(
  characterId: string
): Promise<ConversationMessage[]> {
  return getMessages(characterId, { limit: 10000, order: 'asc' }); // Get all messages
}

/**
 * Export conversation history as CSV string
 */
export async function exportConversationHistoryAsCSV(characterId: string): Promise<string> {
  const messages = await exportConversationHistory(characterId);

  // CSV header
  const headers = [
    'timestamp',
    'sender',
    'content',
    'messageType',
    'mood',
    'closeness',
    'timeOfDay',
  ];
  const rows = [headers.join(',')];

  // CSV rows
  for (const msg of messages) {
    const row = [
      msg.timestamp,
      msg.sender,
      `"${msg.content.replace(/"/g, '""')}"`, // Escape quotes
      msg.messageType,
      msg.context?.mood || '',
      msg.context?.closeness?.toString() || '',
      msg.context?.timeOfDay || '',
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}
