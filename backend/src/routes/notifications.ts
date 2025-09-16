import { Router } from 'express';
import { authenticateToken, requireOnboarding } from '../middleware/auth';
import {
  getNotifications,
  markNotificationAsRead,
  markMultipleAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  createNotification
} from '../controllers/notificationController';

const router = Router();

// Get notifications
router.get('/', authenticateToken, requireOnboarding, getNotifications); // Tested

// Mark notification as read
router.put('/:id/read', authenticateToken, requireOnboarding, markNotificationAsRead); // Tested

// Mark multiple notifications as read
router.put('/mark-read', authenticateToken, requireOnboarding, markMultipleAsRead); // Tested

// Delete notification
router.delete('/:id', authenticateToken, requireOnboarding, deleteNotification); // Tested

// Get notification settings (placeholder for future implementation)
router.get('/settings', authenticateToken, requireOnboarding, getNotificationSettings); // Tested

// Update notification settings (placeholder for future implementation)
router.put('/settings', authenticateToken, requireOnboarding, updateNotificationSettings); // Tested

// Create notification (for testing/admin purposes)
router.post('/', authenticateToken, requireOnboarding, createNotification); // Tested

export default router;
