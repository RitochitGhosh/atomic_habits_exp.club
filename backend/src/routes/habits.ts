import { Router } from 'express';
import { authenticateToken, requireOnboarding } from '../middleware/auth';
import {
  getAllHabits,
  createHabit,
  getHabitById,
  updateHabit,
  deleteHabit,
  completeHabit
} from '../controllers/habitController';

const router = Router();

// Get all habits
router.get('/', authenticateToken, requireOnboarding, getAllHabits); // Tested

// Create habit
router.post('/', authenticateToken, requireOnboarding, createHabit); // Tested

// Get habit by ID
router.get('/:id', authenticateToken, requireOnboarding, getHabitById); // Tested

// Update habit
router.put('/:id', authenticateToken, requireOnboarding, updateHabit); // Tested

// Delete habit
router.delete('/:id', authenticateToken, requireOnboarding, deleteHabit); // Tested

// Complete habit
router.post('/:id/complete', authenticateToken, requireOnboarding, completeHabit); // Tested

export default router;
