require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { apiLimiter } = require('./src/middleware/rateLimit');
const { verifyToken } = require('./src/middleware/auth');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const app = express();

// ===== SECURITY MIDDLEWARE =====
app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) or from allowed origins
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    // Fallback for local development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '100kb' }));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ===== RATE LIMITING =====
app.use('/api/', apiLimiter);

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ===== PUBLIC ROUTES =====
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/bookings', require('./src/routes/bookings'));
app.use('/api/services', require('./src/routes/services'));
app.use('/api/reviews', require('./src/routes/reviews'));

// ===== PROTECTED ROUTES (require auth) =====
app.use('/api/blog', verifyToken, require('./src/routes/blog'));
app.use('/api/branding', verifyToken, require('./src/routes/branding'));
app.use('/api/content', verifyToken, require('./src/routes/content'));
app.use('/api/email', verifyToken, require('./src/routes/email'));
app.use('/api/users', verifyToken, require('./src/routes/users'));
app.use('/api/settings', verifyToken, require('./src/routes/settings'));

// ===== 404 & ERROR HANDLERS =====
app.use(notFound);
app.use(errorHandler);

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ Mearns Gadget API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
});