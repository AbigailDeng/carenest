/**
 * AI Processing Queue System
 * Manages offline queueing of AI requests
 */

export interface QueuedRequest {
  id: string;
  type: 'medical-record' | 'meal-suggestion' | 'emotional-response' | 'symptom-analysis';
  data: any;
  timestamp: string;
  retries: number;
  status: 'pending' | 'processing' | 'failed';
}

const QUEUE_STORAGE_KEY = 'wellmate_ai_queue';
const MAX_RETRIES = 3;

/**
 * Get queue from storage
 */
function getQueue(): QueuedRequest[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save queue to storage
 */
function saveQueue(queue: QueuedRequest[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to save AI queue:', error);
  }
}

/**
 * Add request to queue
 */
export function queueRequest(
  type: QueuedRequest['type'],
  data: any
): string {
  const queue = getQueue();
  const id = crypto.randomUUID();
  
  const request: QueuedRequest = {
    id,
    type,
    data,
    timestamp: new Date().toISOString(),
    retries: 0,
    status: 'pending',
  };

  queue.push(request);
  saveQueue(queue);
  
  return id;
}

/**
 * Get all pending requests
 */
export function getPendingRequests(): QueuedRequest[] {
  const queue = getQueue();
  return queue.filter((req) => req.status === 'pending');
}

/**
 * Update request status
 */
export function updateRequestStatus(
  id: string,
  status: QueuedRequest['status']
): void {
  const queue = getQueue();
  const index = queue.findIndex((req) => req.id === id);
  
  if (index !== -1) {
    queue[index].status = status;
    if (status === 'failed') {
      queue[index].retries += 1;
    }
    saveQueue(queue);
  }
}

/**
 * Remove completed request from queue
 */
export function removeRequest(id: string): void {
  const queue = getQueue();
  const filtered = queue.filter((req) => req.id !== id);
  saveQueue(filtered);
}

/**
 * Clear all requests
 */
export function clearQueue(): void {
  saveQueue([]);
}

/**
 * Process queue when online
 */
export async function processQueue(
  processor: (request: QueuedRequest) => Promise<void>
): Promise<void> {
  if (!navigator.onLine) {
    return;
  }

  const pending = getPendingRequests();
  
  for (const request of pending) {
    if (request.retries >= MAX_RETRIES) {
      updateRequestStatus(request.id, 'failed');
      continue;
    }

    try {
      updateRequestStatus(request.id, 'processing');
      await processor(request);
      removeRequest(request.id);
    } catch (error) {
      console.error('Failed to process queued request:', error);
      updateRequestStatus(request.id, 'failed');
    }
  }
}

/**
 * Process medical record queue item
 */
export async function processMedicalRecordQueue(
  request: QueuedRequest,
  updateRecordFn: (id: string, updates: any) => Promise<void>,
  summarizeFn: (input: any) => Promise<any>
): Promise<void> {
  if (request.type !== 'medical-record') {
    throw new Error('Invalid request type for medical record processor');
  }

  const { recordId, content, fileType } = request.data;

  try {
    await updateRecordFn(recordId, { processingStatus: 'processing' });

    const summary = await summarizeFn({
      content,
      fileType,
    });

    await updateRecordFn(recordId, {
      aiSummary: summary.observations, // Keep for backward compatibility
      aiAnalysis: {
        observations: summary.observations,
        possibleCauses: summary.possibleCauses,
        suggestions: summary.suggestions,
        whenToSeekHelp: summary.whenToSeekHelp,
        disclaimer: summary.disclaimer,
      },
      processingStatus: 'completed',
    });
  } catch (error: any) {
    await updateRecordFn(recordId, {
      processingStatus: 'failed',
      errorMessage: error.message || 'AI processing failed',
    });
    throw error;
  }
}

