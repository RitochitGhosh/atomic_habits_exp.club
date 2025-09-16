import { Router } from 'express';
import { authenticateToken, requireOnboarding } from '../middleware/auth';
import {
  getTodayHabits,
  getHabitStats,
  getHeatmapData,
  getKarmaPoints
} from '../controllers/trackerController';

const router = Router();

// Get today's habits by time slot
router.get('/today', authenticateToken, requireOnboarding, getTodayHabits); // Fix...

// Get habit statistics
router.get('/stats', authenticateToken, requireOnboarding, getHabitStats); // Tested

// Get heatmap data
router.get('/heatmap', authenticateToken, requireOnboarding, getHeatmapData); // Tested

// Get karma points for today
router.get('/karma', authenticateToken, requireOnboarding, getKarmaPoints); // Tested

export default router;
