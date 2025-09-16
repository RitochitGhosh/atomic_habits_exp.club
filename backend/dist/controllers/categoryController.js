"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryById = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getAllCategories = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    icon: zod_1.z.string().min(1).max(10),
});
const updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).optional(),
    icon: zod_1.z.string().min(1).max(10).optional(),
});
const getAllCategories = async (req, res) => {
    try {
        const userId = req.user.id;
        const categories = await prisma_1.prisma.category.findMany({
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
    }
    catch (error) {
        throw error;
    }
};
exports.getAllCategories = getAllCategories;
const createCategory = async (req, res) => {
    try {
        const { name, icon } = createCategorySchema.parse(req.body);
        const userId = req.user.id;
        const existingCategory = await prisma_1.prisma.category.findFirst({
            where: {
                name,
                userId
            }
        });
        if (existingCategory) {
            return res.status(400).json({
                error: 'Category already exists'
            });
        }
        const category = await prisma_1.prisma.category.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
        }
        throw error;
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon } = updateCategorySchema.parse(req.body);
        const userId = req.user.id;
        const category = await prisma_1.prisma.category.findFirst({
            where: {
                id,
                userId,
                isDefault: false
            }
        });
        if (!category) {
            return res.status(404).json({
                error: 'Category not found or cannot be edited'
            });
        }
        if (name && name !== category.name) {
            const existingCategory = await prisma_1.prisma.category.findFirst({
                where: {
                    name,
                    userId,
                    id: { not: id }
                }
            });
            if (existingCategory) {
                return res.status(400).json({
                    error: 'Category name already exists'
                });
            }
        }
        const updatedCategory = await prisma_1.prisma.category.update({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
        }
        throw error;
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const category = await prisma_1.prisma.category.findFirst({
            where: {
                id,
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
        if (!category) {
            return res.status(404).json({
                error: 'Category not found or cannot be deleted'
            });
        }
        if (category._count.habits > 0) {
            return res.status(400).json({
                error: 'Cannot delete category with existing habits',
                message: `This category has ${category._count.habits} habit(s). Please move or delete them first.`
            });
        }
        await prisma_1.prisma.category.delete({
            where: { id }
        });
        res.json({
            message: 'Category deleted successfully'
        });
    }
    catch (error) {
        throw error;
    }
};
exports.deleteCategory = deleteCategory;
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const category = await prisma_1.prisma.category.findFirst({
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
            return res.status(404).json({
                error: 'Category not found'
            });
        }
        res.json({ category });
    }
    catch (error) {
        throw error;
    }
};
exports.getCategoryById = getCategoryById;
//# sourceMappingURL=categoryController.js.map