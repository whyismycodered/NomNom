/**
 * Global Error Handling Middleware
 * Handles Mongoose errors, validation errors, and server exceptions
 * Requirements: 6.1, 6.3, 6.4
 */

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details for debugging
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value for ${field}. Please use another value.`;
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    const message = 'Database connection error';
    error = { message, statusCode: 503 };
  }

  // Request timeout errors
  if (err.code === 'ETIMEDOUT') {
    const message = 'Request timeout';
    error = { message, statusCode: 408 };
  }

  // Syntax errors in JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'Invalid JSON format';
    error = { message, statusCode: 400 };
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: error.message || 'Server Error'
  };

  // Include stack trace in development mode only
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = {
      name: err.name,
      code: err.code,
      statusCode: error.statusCode
    };
  }

  // Send error response with appropriate status code
  res.status(error.statusCode || 500).json(errorResponse);
};

module.exports = errorHandler;