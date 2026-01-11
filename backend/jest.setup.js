// Jest setup file for global test configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/recipe-app-test';

// Increase timeout for database operations
jest.setTimeout(10000);