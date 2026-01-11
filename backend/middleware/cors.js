const cors = require('cors');

/**
 * CORS middleware configuration for mobile client support
 * Handles Android emulator access and multiple origins
 */

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Define allowed origins including Android emulator IP
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081',      // Expo development server
      'http://127.0.0.1:3000',
      'http://10.0.2.2:3000',       // Android emulator IP
      'http://10.0.2.2:8081',       // Android emulator Expo
      'http://192.168.1.1',         // Local network range start
      'http://192.168.1.255',       // Local network range end
    ];

    // Check for environment-specific origins
    if (process.env.ALLOWED_ORIGINS) {
      const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
      allowedOrigins.push(...envOrigins);
    }

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      // Support for wildcard patterns in local network (192.168.x.x)
      if (allowed.includes('192.168.')) {
        const networkPattern = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/;
        return networkPattern.test(origin);
      }
      return origin === allowed;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  // Enable credentials for authenticated requests
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  
  // Exposed headers that client can access
  exposedHeaders: ['X-Total-Count'],
  
  // Handle preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 200 // For legacy browser support
};

/**
 * Create CORS middleware with mobile client support
 * @returns {Function} Express middleware function
 */
const createCorsMiddleware = () => {
  return cors(corsOptions);
};

/**
 * Development-specific CORS configuration (more permissive)
 * @returns {Function} Express middleware function
 */
const createDevCorsMiddleware = () => {
  const devCorsOptions = {
    ...corsOptions,
    origin: true, // Allow all origins in development
  };
  
  return cors(devCorsOptions);
};

module.exports = {
  corsMiddleware: createCorsMiddleware(),
  devCorsMiddleware: createDevCorsMiddleware(),
  corsOptions
};