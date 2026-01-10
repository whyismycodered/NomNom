# NomNom - Budget Recipe Viewer

A full-stack application consisting of a React Native mobile frontend and a Node.js/Express backend API for budget-conscious recipe management.

## Project Structure

```
NomNom/
├── frontend/          # React Native mobile application
│   ├── app/          # App screens and navigation
│   ├── assets/       # Images, fonts, and static assets
│   ├── components/   # Reusable UI components
│   ├── theme/        # Theme and styling configuration
│   ├── package.json  # Frontend dependencies
│   └── app.json      # Expo/React Native configuration
├── backend/          # Node.js/Express API server
│   ├── config/       # Database and server configuration
│   ├── controllers/  # Business logic controllers
│   ├── middleware/   # Custom Express middleware
│   ├── models/       # Mongoose data models
│   ├── routes/       # API route definitions
│   ├── utils/        # Utility functions and helpers
│   ├── server.js     # Server entry point
│   └── package.json  # Backend dependencies
└── .kiro/            # Kiro specifications and documentation
    └── specs/
        └── recipe-api-backend/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The backend API will be available at:
- Local: http://localhost:3000
- Android Emulator: http://10.0.2.2:3000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Features

### Backend API
- RESTful API for recipe management
- Budget-based ingredient optimization
- MongoDB integration with Mongoose
- CORS support for mobile clients
- Comprehensive error handling and logging

### Frontend Mobile App
- Browse recipes with detailed ingredient information
- Budget optimization for ingredient quantities
- Clean, intuitive mobile interface
- Android emulator support for development

## Development

- **Backend**: Node.js/Express with MongoDB
- **Frontend**: React Native with Expo
- **Testing**: Jest with property-based testing support
- **Architecture**: MVC pattern with clear separation of concerns

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get specific recipe
- `POST /api/budget/optimize` - Optimize recipe for budget

Additional endpoints are documented in the backend README.

## Contributing

1. Follow the MVC architecture pattern for backend development
2. Use the established component structure for frontend development
3. Write tests for new functionality
4. Update documentation as needed

## License

MIT