import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
// @ts-ignore
import swaggerUi from 'swagger-ui-express';
// @ts-ignore
import YAML from 'yamljs';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import categoryRoutes from './routes/categories';
import habitRoutes from './routes/habits';
import trackerRoutes from './routes/tracker';
import feedRoutes from './routes/feed';
import leaderboardRoutes from './routes/leaderboard';
import notificationRoutes from './routes/notifications';
import { setupSocketHandlers } from './socket/socketHandlers';
import path from 'path';
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL!,
    methods: ["*"]
  }
});

const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Middlewares
app.use(helmet());
app.use(compression());
// app.use(limiter);
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const swaggerDocument = YAML.load("./openapi.yaml");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes); // Tested
app.use('/api/users', userRoutes); // Tested
app.use('/api/categories', categoryRoutes); // Tested
app.use('/api/habits', habitRoutes); 
app.use('/api/tracker', trackerRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io setup
setupSocketHandlers(io);

// Error handling
app.use(notFound);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server running on  http://localhost:${PORT}`);
});

export { io };
