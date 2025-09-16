# Social Habit Tracker

A comprehensive social habit tracking application that combines personal habit tracking with social accountability features. Users can track personal habits, share achievements as "atoms" (posts), and engage with a community through voting, following, and leaderboards.

## 🚀 Features

### Core Features
- **User Authentication**: JWT-based authentication with refresh tokens
- **Habit Management**: Create, edit, and track habits with categories and scheduling
- **Social Feed**: Share habit completions as "atoms" with AI-generated captions
- **Voting System**: Upvote/downvote system for community validation
- **Follow System**: Follow other users and see their achievements
- **Gamification**: Karma points, streaks, and leaderboards
- **Real-time Updates**: WebSocket integration for live updates
- **AI Integration**: Google Gemini for caption and quote generation

### Technical Features
- **TypeScript**: Full TypeScript implementation
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time**: Socket.io for live updates
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and caching
- **Image Upload**: Cloudinary integration
- **Email Notifications**: Redis queue with Bull for background jobs

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.io for WebSocket connections
- **Queue**: Redis with Bull for background jobs
- **AI**: Google Gemini API integration
- **Storage**: Cloudinary for image uploads

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context for auth state
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion
- **Real-time**: Socket.io client

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd expclub_assignment
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Environment Setup

#### Backend Environment
Create `backend/.env` file:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/habit_tracker"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Google Gemini
GEMINI_API_KEY="your-gemini-api-key"

# Application
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

#### Frontend Environment
Create `frontend/.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database
npm run db:seed
```

### 5. Start the application
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:3001
```

## 🎯 Usage

### Demo Account
- **Email**: demo@example.com
- **Password**: password

### Getting Started
1. Register a new account or use the demo account
2. Complete onboarding by following at least 3 users
3. Create your first habit
4. Track daily completions
5. Share achievements as "atoms"
6. Engage with the community through voting and following

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search/:query` - Search users
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/unfollow` - Unfollow user

### Habits
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/complete` - Complete habit

### Tracker
- `GET /api/tracker/today` - Get today's habits
- `GET /api/tracker/stats` - Get habit statistics
- `GET /api/tracker/heatmap` - Get heatmap data

### Feed
- `GET /api/feed` - Get social feed
- `GET /api/feed/trending` - Get trending atoms
- `POST /api/feed/:id/vote` - Vote on atom

### Leaderboard
- `GET /api/leaderboard/daily` - Daily leaderboard
- `GET /api/leaderboard/total` - All-time leaderboard

## 🗄️ Database Schema

### Core Models
- **User**: User accounts with karma points
- **Category**: Habit categories (default + custom)
- **Habit**: User habits with scheduling
- **HabitCompletion**: Daily habit completions
- **Atom**: Shared habit completions
- **AtomVote**: Votes on atoms
- **Follow**: User follow relationships
- **Notification**: User notifications

### Key Relationships
- Users can have multiple habits
- Habits belong to categories
- Completions link to habits
- Atoms are created from shareable completions
- Users can vote on atoms
- Follow relationships create social connections

## 🔧 Development

### Project Structure
```
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── socket/          # Socket.io handlers
│   │   ├── lib/             # Utilities and configs
│   │   └── scripts/         # Database scripts
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── lib/                 # Utilities
│   └── package.json
└── package.json             # Root package.json
```

### Available Scripts
```bash
# Development
npm run dev                 # Start both frontend and backend
npm run dev:frontend        # Start frontend only
npm run dev:backend         # Start backend only

# Building
npm run build               # Build both projects
npm run build:frontend      # Build frontend
npm run build:backend       # Build backend

# Database
npm run db:generate         # Generate Prisma client
npm run db:push            # Push schema to database
npm run db:seed            # Seed database with sample data

# Production
npm run start              # Start production servers
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment Variables for Production
Ensure all environment variables are set correctly for production:
- Database connection strings
- Redis connection
- JWT secrets
- Cloudinary credentials
- Email SMTP settings
- Google Gemini API key

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support, email support@habittracker.com or create an issue in the repository.

## 🎉 Acknowledgments

- Built with Next.js, Express.js, and PostgreSQL
- UI components with Tailwind CSS
- Real-time features with Socket.io
- AI integration with Google Gemini
- Image handling with Cloudinary
