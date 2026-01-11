const mongoose = require('mongoose');

/**
 * Database connection configuration with error handling and logging
 * Implements Requirements 6.1: Database connection error handling and logging
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe-app';
  }

  /**
   * Connect to MongoDB with proper error handling
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      // Configure mongoose options for better connection handling
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      };

      await mongoose.connect(this.connectionString, options);
      this.isConnected = true;
      
      console.log('✅ MongoDB connected successfully');
      console.log(`📍 Database: ${mongoose.connection.name}`);
      console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
      
    } catch (error) {
      this.isConnected = false;
      console.error('❌ MongoDB connection error:', error.message);
      
      // Log detailed error information for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', error);
      }
      
      // Re-throw error to allow calling code to handle it
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Disconnect from MongoDB
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📴 MongoDB disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection details
   * @returns {Object}
   */
  getConnectionInfo() {
    if (!this.isConnected) {
      return { status: 'disconnected' };
    }

    return {
      status: 'connected',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState
    };
  }
}

// Set up connection event listeners for better error handling
mongoose.connection.on('connected', () => {
  console.log('🔄 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB');
});

// Handle application termination gracefully
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
    process.exit(1);
  }
});

// Export singleton instance
const dbConnection = new DatabaseConnection();
module.exports = dbConnection;