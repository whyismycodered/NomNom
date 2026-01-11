# Recipe API Backend

A Node.js/Express REST API backend for the Budget Recipe Viewer mobile application.

## Features

- RESTful API for recipe management
- Budget-based ingredient optimization
- MongoDB integration with Mongoose
- CORS support for mobile clients (Android emulator)
- MVC architecture pattern
- Comprehensive error handling
- Property-based testing support

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The server will be available at:
   - Local: http://localhost:3000
   - Android Emulator: http://10.0.2.2:3000

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /` - Welcome message

Additional endpoints will be added as development progresses.

## Testing

Run tests with:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Project Structure

```
server/
├── config/          # Configuration files
├── controllers/     # Business logic controllers
├── middleware/      # Custom Express middleware
├── models/          # Mongoose data models
├── routes/          # Express route definitions
├── utils/           # Utility functions and helpers
├── server.js        # Application entry point
└── package.json     # Dependencies and scripts
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production/test)
- `MONGODB_URI` - MongoDB connection string
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins