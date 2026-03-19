import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import appsRouter from './routes/apps.js';
import campaignRouter from './routes/campaign.js';
import subscribersRouter from './routes/subscribers.js';
import contactRouter from './routes/contact.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// Request ID
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(7);
  next();
});

// Routes
app.use('/api/apps', appsRouter);
app.use('/api/campaign', campaignRouter);
app.use('/api/subscribers', subscribersRouter);
app.use('/api/contact', contactRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Ham-Head AI API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`[${req.id}] ${err.message}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🐷 HAM-HEAD AI API RUNNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Port:        ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Database:    PostgreSQL via Prisma
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
