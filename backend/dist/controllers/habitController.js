"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeHabit = exports.deleteHabit = exports.updateHabit = exports.getHabitById = exports.createHabit = exports.getAllHabits = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const createHabitSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    categoryId: zod_1.z.string().cuid(),
    type: zod_1.z.enum(['Personal', 'Shareable']),
    occurrence: zod_1.z.enum(['daily', 'weekly', 'weekdays', 'weekends', 'once_weekly', 'biweekly', 'twice_weekly']),
    slot: zod_1.z.enum(['Morning', 'Afternoon', 'Evening', 'Night']),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional(),
});
const updateHabitSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    categoryId: zod_1.z.string().cuid().optional(),
    type: zod_1.z.enum(['Personal', 'Shareable']).optional(),
    occurrence: zod_1.z.enum(['daily', 'weekly', 'weekdays', 'weekends', 'once_weekly', 'biweekly', 'twice_weekly']).optional(),
    slot: zod_1.z.enum(['Morning', 'Afternoon', 'Evening', 'Night']).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    isActive: zod_1.z.boolean().optional(),
});
const getAllHabits = async (req, res) => {
    try {
        const { page = 1, limit = 20, categoryId, isActive } = req.query;
        const userId = req.user.id;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            userId
        };
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const habits = await prisma_1.prisma.habit.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true
                    }
                },
                _count: {
                    select: {
                        completions: true,
                        atoms: true
                    }
                }
            },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma_1.prisma.habit.count({ where });
        res.json({
            habits,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        throw error;
    }
};
exports.getAllHabits = getAllHabits;
const createHabit = async (req, res) => {
    try {
        const data = createHabitSchema.parse(req.body);
        const userId = req.user.id;
        const category = await prisma_1.prisma.category.findFirst({
            where: {
                id: data.categoryId,
                OR: [
                    { isDefault: true },
                    { userId }
                ]
            }
        });
        if (!category) {
            return res.status(404).json({
                error: 'Category not found'
            });
        }
        const existingHabit = await prisma_1.prisma.habit.findFirst({
            where: {
                title: data.title,
                userId
            }
        });
        if (existingHabit) {
            return res.status(400).json({
                error: 'Habit with this title already exists'
            });
        }
        const habit = await prisma_1.prisma.habit.create({
            data: {
                ...data,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                userId
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true
                    }
                }
            }
        });
        res.status(201).json({
            message: 'Habit created successfully',
            habit
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
exports.createHabit = createHabit;
const getHabitById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const habit = await prisma_1.prisma.habit.findFirst({
            where: {
                id,
                userId
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true
                    }
                },
                completions: {
                    orderBy: { completedAt: 'desc' },
                    take: 10
                },
                atoms: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        votes: {
                            where: { userId }
                        }
                    }
                },
                _count: {
                    select: {
                        completions: true,
                        atoms: true
                    }
                }
            }
        });
        if (!habit) {
            return res.status(404).json({
                error: 'Habit not found'
            });
        }
        res.json({ habit });
    }
    catch (error) {
        throw error;
    }
};
exports.getHabitById = getHabitById;
const updateHabit = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateHabitSchema.parse(req.body);
        const userId = req.user.id;
        const existingHabit = await prisma_1.prisma.habit.findFirst({
            where: {
                id,
                userId
            }
        });
        if (!existingHabit) {
            return res.status(404).json({
                error: 'Habit not found'
            });
        }
        if (data.categoryId) {
            const category = await prisma_1.prisma.category.findFirst({
                where: {
                    id: data.categoryId,
                    OR: [
                        { isDefault: true },
                        { userId }
                    ]
                }
            });
            if (!category) {
                return res.status(404).json({
                    error: 'Category not found'
                });
            }
        }
        if (data.title && data.title !== existingHabit.title) {
            const titleConflict = await prisma_1.prisma.habit.findFirst({
                where: {
                    title: data.title,
                    userId,
                    id: { not: id }
                }
            });
            if (titleConflict) {
                return res.status(400).json({
                    error: 'Habit with this title already exists'
                });
            }
        }
        const updateData = { ...data };
        if (data.startDate) {
            updateData.startDate = new Date(data.startDate);
        }
        if (data.endDate) {
            updateData.endDate = new Date(data.endDate);
        }
        const habit = await prisma_1.prisma.habit.update({
            where: { id },
            data: updateData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true
                    }
                }
            }
        });
        res.json({
            message: 'Habit updated successfully',
            habit
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
exports.updateHabit = updateHabit;
const deleteHabit = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const habit = await prisma_1.prisma.habit.findFirst({
            where: {
                id,
                userId
            },
            include: {
                _count: {
                    select: {
                        completions: true,
                        atoms: true
                    }
                }
            }
        });
        if (!habit) {
            return res.status(404).json({
                error: 'Habit not found'
            });
        }
        await prisma_1.prisma.habit.delete({
            where: { id }
        });
        res.json({
            message: 'Habit deleted successfully'
        });
    }
    catch (error) {
        throw error;
    }
};
exports.deleteHabit = deleteHabit;
const completeHabit = async (req, res) => {
    try {
        const { id } = req.params;
        const { image, notes, publishAsAtom } = req.body;
        const userId = req.user.id;
        const habit = await prisma_1.prisma.habit.findFirst({
            where: {
                id,
                userId,
                isActive: true
            },
            include: {
                category: true
            }
        });
        if (!habit) {
            return res.status(404).json({
                error: 'Habit not found or inactive'
            });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const existingCompletion = await prisma_1.prisma.habitCompletion.findFirst({
            where: {
                habitId: id,
                userId,
                completedAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });
        if (existingCompletion) {
            return res.status(400).json({
                error: 'Habit already completed today'
            });
        }
        const completion = await prisma_1.prisma.habitCompletion.create({
            data: {
                habitId: id,
                userId,
                image: image || null,
                notes: notes || null,
                isPublished: publishAsAtom || false
            }
        });
        let atom = null;
        if (habit.type === 'Shareable' && publishAsAtom && image) {
            const caption = `Just completed my ${habit.title} habit! 💪 #${habit.category.name.toLowerCase()}`;
            atom = await prisma_1.prisma.atom.create({
                data: {
                    userId,
                    habitId: id,
                    completionId: completion.id,
                    image,
                    caption,
                    habitTitle: habit.title,
                    habitType: habit.occurrence,
                    completionTime: completion.completedAt
                }
            });
            await prisma_1.prisma.habitCompletion.update({
                where: { id: completion.id },
                data: { isPublished: true }
            });
        }
        res.status(201).json({
            message: 'Habit completed successfully',
            completion,
            atom
        });
    }
    catch (error) {
        throw error;
    }
};
exports.completeHabit = completeHabit;
//# sourceMappingURL=habitController.js.map