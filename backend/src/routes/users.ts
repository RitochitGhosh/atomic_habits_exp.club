import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  completeOnboarding,
  getAllUsers
} from '../controllers/userController';

const router = Router();

router.get('/', getAllUsers);
// Get user profile
router.get('/:id', getUserProfile); // Tested

// Update profile
router.put('/profile', authenticateToken, updateProfile); // Tested

// Search users
router.get('/search/:query', authenticateToken, searchUsers); // Tested

// Follow user
router.post('/:id/follow', authenticateToken, followUser); // Tested

// Unfollow user
router.delete('/:id/unfollow', authenticateToken, unfollowUser); // Tested

// Get followers
router.get('/:id/followers', getFollowers); // Tested

// Get following
router.get('/:id/following', getFollowing); // Tested

// Complete onboarding
router.post('/complete-onboarding', authenticateToken, completeOnboarding);

export default router;
