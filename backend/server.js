const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const { corsMiddleware, devCorsMiddleware } = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS configuration for mobile client support
// Requirements 3.2, 3.3: Configure CORS for Android emulator access
const corsToUse = process.env.NODE_ENV === 'development' ? devCorsMiddleware : corsMiddleware;
app.use(corsToUse);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for monitoring
// Requirements 6.5: Health check endpoint for system status
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbStatus] || 'unknown';

    // Get system information
    const healthData = {
      success: true,
      status: 'healthy',
      message: 'Recipe API Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      database: {
        status: dbStatusText,
        connected: dbStatus === 1
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      }
    };

    // If database is not connected, mark as unhealthy but still return 200
    // This allows monitoring systems to detect issues while keeping the service discoverable
    if (dbStatus !== 1) {
      healthData.status = 'degraded';
      healthData.message = 'Service running but database connection issues detected';
    }

    res.status(200).json(healthData);
  } catch (error) {
    // Even if health check fails, return 200 with error info
    // This ensures the service is still discoverable by load balancers
    res.status(200).json({
      success: false,
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Basic route for testing
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Recipe API Backend',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      recipes: '/api/recipes',
      documentation: 'See README.md for API documentation'
    }
  });
});

// API Routes - Mount all route modules
// Requirements 1.1, 1.2: Recipe data management endpoints
app.use('/api/recipes', require('./routes/recipeRoutes'));

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe-app');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Global error handler - Must be after all routes
// Requirements 6.1, 6.3, 6.4: Global error handling middleware
app.use(errorHandler);

// Handle 404 routes - Must be after all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    availableEndpoints: {
      health: '/health',
      recipes: '/api/recipes',
      root: '/'
    }
  });
});

// Start server with enhanced logging
// Requirements 3.2, 3.3: Configure server binding for emulator access (0.0.0.0)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log(`🚀 Recipe API Backend Server Started`);
  console.log('='.repeat(60));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log('');
  console.log('📱 Access URLs:');
  console.log(`   Local:           http://localhost:${PORT}`);
  console.log(`   Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`   Network:         http://0.0.0.0:${PORT}`);
  console.log('');
  console.log('🔍 API Endpoints:');
  console.log(`   Health Check:    http://localhost:${PORT}/health`);
  console.log(`   Recipes API:     http://localhost:${PORT}/api/recipes`);
  console.log(`   Recipe Filter:   http://localhost:${PORT}/api/recipes/filter`);
  console.log('='.repeat(60));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Promise Rejection: ${err.message}`);
  console.log('Shutting down server due to unhandled promise rejection');
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`);
  console.log('Shutting down server due to uncaught exception');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

module.exports = app;