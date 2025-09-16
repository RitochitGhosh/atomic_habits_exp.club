import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById
} from '../controllers/categoryController';

const router = Router();

// Get all categories (default + user's custom categories)
router.get('/', authenticateToken, getAllCategories); // Tested

// Create custom category
router.post('/', authenticateToken, createCategory); // Tested

// Update category
router.put('/:id', authenticateToken, updateCategory); // [ Fix: No change still -> sucess ] 

// Delete category
router.delete('/:id', authenticateToken, deleteCategory); // Tested

// Get category by ID
router.get('/:id', authenticateToken, getCategoryById); // Tested

export default router;
