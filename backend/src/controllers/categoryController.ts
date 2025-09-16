import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1).max(10),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(10).optional(),
});

export const getAllCategories = async (req: Request, res: Response) => { // Tested
  try {
    const userId = (req as any).user.id;

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { isDefault: true },
          { userId }
        ]
      },
      include: {
        _count: {
          select: {
            habits: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({ categories });
  } catch (error) {
    throw error;
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => { // Tested
  try {
    const { name, icon } = createCategorySchema.parse(req.body);
    const userId = (req as any).user.id;

    // Check if category already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        userId
      }
    });

    if (existingCategory) {
      res.status(400).json({
        error: 'Category already exists'
      });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon,
        userId,
        isDefault: false
      },
      include: {
        _count: {
          select: {
            habits: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    throw error;
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => { // Tested
  try {
    const { id } = req.params;
    const { name, icon } = updateCategorySchema.parse(req.body);
    const userId = (req as any).user.id;

    // Check if category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
        isDefault: false // Can't edit default categories
      }
    });

    if (!category) {
      res.status(404).json({
        error: 'Category not found or cannot be edited'
      });
      return;
    }

    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name,
          userId,
          id: { not: id }
        }
      });

      if (existingCategory) {
        res.status(400).json({
          error: 'Category name already exists'
        });
        return;
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(icon && { icon }),
      },
      include: {
        _count: {
          select: {
            habits: true
          }
        }
      }
    });

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    throw error;
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => { // Tested
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
        isDefault: false // Can't delete default categories
      },
      include: {
        _count: {
          select: {
            habits: true
          }
        }
      }
    });

    if (!category) {
      res.status(404).json({
        error: 'Category not found or cannot be deleted'
      });
      return;
    }

    // Check if category has habits
    if (category._count.habits > 0) {
      res.status(400).json({
        error: 'Cannot delete category with existing habits',
        message: `This category has ${category._count.habits} habit(s). Please move or delete them first.`
      });
      return;
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    throw error;
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => { // Tested
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [
          { isDefault: true },
          { userId }
        ]
      },
      include: {
        habits: {
          where: {
            userId,
            isActive: true
          },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            occurrence: true,
            slot: true,
            startDate: true,
            endDate: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            habits: true
          }
        }
      }
    });

    if (!category) {
      res.status(404).json({
        error: 'Category not found'
      });
      return;
    }

    res.json({ category });
  } catch (error) {
    throw error;
  }
};
