import dotenv from 'dotenv';

// Load environment variables FIRST, before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';

// Import logger middleware
import { logger, errorLogger } from './middleware/logger.js';

// Import database connection
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import moverRoutes from './routes/movers.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import uploadRoutes from './routes/upload.js';
import paymentRoutes, { handleWebhook } from './routes/payment.js';
import jobDistributionRoutes from './routes/jobDistribution.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Security middleware
app.use(helmet());

// Logger middleware (add before other middleware to log all requests)
app.use(logger);
app.set('trust proxy', 1);
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);
// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim().replace(/\/$/, '')) // Remove trailing slashes
  : ['http://localhost:8081'];

// Debug logging for CORS configuration
console.log('🔧 CORS Configuration:');
console.log('  Raw FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('  Parsed allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🌐 CORS request from origin: ${origin || 'null'}`);
    
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }

    // Remove trailing slash from origin for comparison
    const cleanOrigin = origin.replace(/\/$/, '');
    
    if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin blocked:', origin);
      console.log('   Clean origin:', cleanOrigin);
      console.log('   Allowed origins:', allowedOrigins);
      
      // In development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Allowing origin anyway');
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed. Allowed origins: ${allowedOrigins.join(', ')}`));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'BooknMove API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movers', moverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/jobs', jobDistributionRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorLogger);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Start server only after MongoDB connects
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
    });

    // Start subscription sync service after server is running
    try {
      const subscriptionSyncService = (await import('./services/subscriptionSyncService.js')).default;
      subscriptionSyncService.start();
      console.log('✅ Subscription sync service started');
    } catch (error) {
      console.error('⚠️ Failed to start subscription sync service:', error.message);
      console.log('💡 Subscription sync service will not be available');
    }

    // Start cron job service for job distribution
    try {
      const cronJobService = (await import('./services/cronJobService.js')).default;
      await cronJobService.init();
      console.log('✅ Cron job service started - job alerts will run every 2 minutes');
    } catch (error) {
      console.error('⚠️ Failed to start cron job service:', error.message);
      console.log('💡 Automated job distribution will not be available');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
