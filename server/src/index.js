
import 'dotenv/config';
import dns from 'node:dns';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import { requireAuth } from './middleware/auth.js';

// Fix MongoDB DNS resolution issue
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
}));

app.use(express.json());

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', requireAuth, productRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

const port = process.env.PORT || 5000;

// Check JWT Secret
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stockflow')
  .then(() => {
    console.log('MongoDB connected successfully!');

    app.listen(port, () => {
      console.log(`StockFlow API running on http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  });
