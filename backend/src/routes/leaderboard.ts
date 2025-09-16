import { Router } from 'express';
import { authenticateToken, requireOnboarding } from '../middleware/auth';
import {
  getDailyLeaderboard,
  getTotalLeaderboard,
  getUserRankingHistory,
  getCategoryLeaderboard
} from '../controllers/leaderboardController';

const router = Router();

// Get daily leaderboard
router.get('/daily', authenticateToken, requireOnboarding, getDailyLeaderboard); // Tested

// Get all-time leaderboard
router.get('/total', authenticateToken, requireOnboarding, getTotalLeaderboard); // Tested

// Get user's ranking history
router.get('/user/:id/history', authenticateToken, requireOnboarding, getUserRankingHistory); // Tested

// Get category-specific leaderboard
router.get('/category/:categoryId', authenticateToken, requireOnboarding, getCategoryLeaderboard);

export default router;