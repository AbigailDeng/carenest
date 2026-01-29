import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import llmRouter from './routes/llm.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/health', healthRouter);
app.use('/api', llmRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      retryable: err.retryable ?? false,
    },
  });
});

app.listen(PORT, () => {
  console.log(`CareNest API server running on port ${PORT}`);
});
