import { Router } from 'express';
import { authenticateToken, requireOnboarding } from '../middleware/auth';
import {
  getFeed,
  getAtomById,
  voteOnAtom,
  removeVote,
  getTrendingAtoms
} from '../controllers/feedController';

const router = Router();

// Get feed (atoms from followed users)
router.get('/', authenticateToken, requireOnboarding, getFeed); // Tested

// Get atom by ID
router.get('/:id', authenticateToken, requireOnboarding, getAtomById); // Tested

// Vote on atom
router.post('/:id/vote', authenticateToken, requireOnboarding, voteOnAtom); // Tested

// Remove vote from atom
router.delete('/:id/vote', authenticateToken, requireOnboarding, removeVote); // Tested

// Get trending atoms 
router.get('/trending', authenticateToken, requireOnboarding, getTrendingAtoms); // Tested

export default router;
