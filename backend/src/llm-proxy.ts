/**
 * Vercel Serverless Function - LLM API Proxy
 *
 * This proxy protects the LLM API key by keeping it on the server side.
 * The frontend calls this endpoint instead of directly calling the LLM API.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({
      error: 'Method not allowed. Use POST.',
    });
  }

  // Get API key from server-side environment variable (not exposed to client)
  const LLM_API_KEY = process.env.LLM_API_KEY;
  const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://hyperecho-proxy.aelf.dev/v1';
  const LLM_MODEL = process.env.LLM_MODEL || 'vibe-coding-app-gemini';

  if (!LLM_API_KEY) {
    console.error('LLM_API_KEY is not configured in server environment variables');
    return response.status(500).json({
      error: 'Server configuration error: LLM API key not configured',
    });
  }

  try {
    // Get request body from client
    const { messages, temperature, max_tokens } = request.body;

    if (!messages || !Array.isArray(messages)) {
      return response.status(400).json({
        error: 'Invalid request: messages array is required',
      });
    }

    // Forward request to LLM API with server-side API key
    const llmResponse = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 2000,
      }),
    });

    // Check if LLM API request was successful
    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('LLM API error:', llmResponse.status, errorText);
      return response.status(llmResponse.status).json({
        error: `LLM API error: ${llmResponse.statusText}`,
        details: errorText,
      });
    }

    // Parse and return LLM response
    const data = await llmResponse.json();
    return response.status(200).json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
