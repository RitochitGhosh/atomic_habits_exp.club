import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout
} from '../controllers/authController';

const router = Router();

// Register
router.post('/register', register); // Tested

// Login
router.post('/login', login); // Tested

// Refresh token
router.post('/refresh', refreshToken); // Tested

// Get current user
router.get('/me', authenticateToken, getCurrentUser); // Tested

// Logout (client-side token removal)
router.post('/logout', logout);

export default router;
