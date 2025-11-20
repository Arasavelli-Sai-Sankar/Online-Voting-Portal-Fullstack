require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const electionRoutes = require('./routes/elections');
const voteRoutes = require('./routes/votes');

const app = express();

// Security & middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);

// Basic rate limiter for APIs
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120 // limit each IP to 120 requests per minute
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/votes', voteRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Internal Server Error' });
});

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    const port = process.env.PORT || 5000;
    app.listen(port, () =>
      console.log(`API server running on http://localhost:${port}`)
    );
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
};

start();