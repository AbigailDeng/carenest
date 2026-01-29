/**
 * Standalone Proxy Server for LLM API
 *
 * This is a simple Express server that can run on any platform.
 * It protects the API key by keeping it on the server side.
 *
 * Usage:
 *   - Local development: node server/proxy-server.js
 *   - Production: Deploy this server to any Node.js hosting (Railway, Render, Fly.io, etc.)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Get API key from environment variables
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://hyperecho-proxy.aelf.dev/v1';
const LLM_MODEL = process.env.LLM_MODEL || 'vibe-coding-app-gemini';

if (!LLM_API_KEY) {
  console.error('❌ Error: LLM_API_KEY is not configured in environment variables');
  console.error('Please set LLM_API_KEY in your .env file or environment variables');
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LLM Proxy Server is running',
    hasApiKey: !!LLM_API_KEY,
  });
});

// LLM Proxy endpoint
app.post('/api/llm-proxy', async (req, res) => {
  try {
    const { messages, temperature, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request: messages array is required',
      });
    }

    console.log(`[Proxy] Forwarding request to LLM API (${messages.length} messages)`);

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
      console.error('[Proxy] LLM API error:', llmResponse.status, errorText);
      return res.status(llmResponse.status).json({
        error: `LLM API error: ${llmResponse.statusText}`,
        details: errorText,
      });
    }

    // Parse and return LLM response
    const data = await llmResponse.json();
    console.log('[Proxy] Successfully forwarded LLM response');
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LLM Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxy endpoint: http://localhost:${PORT}/api/llm-proxy`);
  console.log(`✅ API Key configured: ${LLM_API_KEY ? 'Yes' : 'No'}`);
});
