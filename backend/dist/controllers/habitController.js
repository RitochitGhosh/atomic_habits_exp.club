"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeHabit = exports.deleteHabit = exports.updateHabit = exports.getHabitById = exports.createHabit = exports.getAllHabits = exports.generateMotivationalQuote = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
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
const generateCaption = async (habitTitle, categoryName, occurrence, notes) => {
    try {
        const prompt = `Create an engaging and motivational social media caption for someone who just completed their habit. 

Context:
- Habit: ${habitTitle}
- Category: ${categoryName}
- Frequency: ${occurrence}
${notes ? `- Additional notes: ${notes}` : ''}

Requirements:
- Keep it under 100 characters
- Make it motivational and inspiring
- Include relevant emojis (2-3 max)
- Make it feel authentic and personal
- Use hashtags sparingly (1-2 max)
- Avoid being overly dramatic

Examples of good captions:
- "Morning run complete! 🏃‍♂️ Small steps, big progress ✨"
- "30 minutes of reading done 📚 Knowledge is power! 💪"
- "Meditation session finished 🧘‍♀️ Inner peace restored ✨"

Generate a similar caption for this habit completion:`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const caption = response.text().trim();
        console.log("Caption_generated: ", caption);
        if (!caption) {
            return `Just completed my ${habitTitle} habit! 💪 #${categoryName.toLowerCase()}`;
        }
        return caption;
    }
    catch (error) {
        console.error('Gemini caption generation failed:', error);
        return `Completed my ${habitTitle} habit! 💪 #${categoryName.toLowerCase()}`;
    }
};
const checkTodayCompletion = async (habit, userId) => {
    const now = new Date();
    let startDate;
    let endDate;
    switch (habit.occurrence) {
        case 'daily':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            break;
        case 'weekly':
        case 'once_weekly':
            const dayOfWeek = now.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - daysToMonday);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
            break;
        case 'weekdays':
            const today = now.getDay();
            if (today === 0 || today === 6) {
                return { alreadyCompleted: false };
            }
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            break;
        case 'weekends':
            const todayWeekend = now.getDay();
            if (todayWeekend !== 0 && todayWeekend !== 6) {
                return { alreadyCompleted: false };
            }
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            break;
        case 'biweekly':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 14);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'twice_weekly':
            const weekDay = now.getDay();
            const daysToMondayTwice = weekDay === 0 ? 6 : weekDay - 1;
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - daysToMondayTwice);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
            const weeklyCount = await prisma_1.prisma.habitCompletion.count({
                where: {
                    habitId: habit.id,
                    userId,
                    completedAt: {
                        gte: startDate,
                        lt: endDate
                    }
                }
            });
            return {
                alreadyCompleted: weeklyCount >= 2,
                message: weeklyCount >= 2 ? 'Habit already completed twice this week' : ''
            };
        default:
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
    }
    const existingCompletion = await prisma_1.prisma.habitCompletion.findFirst({
        where: {
            habitId: habit.id,
            userId,
            completedAt: {
                gte: startDate,
                lt: endDate
            }
        }
    });
    return {
        alreadyCompleted: !!existingCompletion,
        message: existingCompletion ? `Habit already completed for this ${habit.occurrence} period` : ''
    };
};
const updateUserKarma = async (userId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayCompletions = await prisma_1.prisma.habitCompletion.count({
            where: {
                userId,
                completedAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { totalKarma: true }
        });
        const basePoints = todayCompletions * 10;
        const streakBonus = Math.floor(todayCompletions / 3) * 5;
        const totalDailyKarma = basePoints + streakBonus;
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                totalKarma: {
                    increment: 10
                }
            }
        });
        console.log(`✨ Updated karma for user ${userId}: +10 points`);
    }
    catch (error) {
        console.error('Failed to update user karma:', error);
    }
};
const generateMotivationalQuote = async (habitTitle, categoryName) => {
    try {
        const prompt = `Generate a short, motivational quote (under 80 characters) for someone who missed their habit today. 

Habit details:
- Habit: ${habitTitle}
- Category: ${categoryName}

The quote should be:
- Encouraging and positive
- Forward-looking (focus on tomorrow/next attempt)
- Not guilt-inducing or negative
- Inspiring action
- Personal and relatable

Examples:
- "Tomorrow is a fresh start. You've got this! 🌟"
- "One missed day doesn't define your journey. Keep going! 💪"
- "Progress isn't perfection. Tomorrow is your comeback day! ✨"

Generate a similar motivational quote:`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const quote = response.text().trim();
        if (!quote || quote.length > 100) {
            return "Tomorrow is a new opportunity. You've got this! 💪";
        }
        return quote;
    }
    catch (error) {
        console.error('Gemini quote generation failed:', error);
        return "Every day is a chance to restart. Keep going! ✨";
    }
};
exports.generateMotivationalQuote = generateMotivationalQuote;
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
            res.status(404).json({
                error: 'Category not found'
            });
            return;
        }
        const existingHabit = await prisma_1.prisma.habit.findFirst({
            where: {
                title: data.title,
                userId
            }
        });
        if (existingHabit) {
            res.status(400).json({
                error: 'Habit with this title already exists'
            });
            return;
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
            res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
            return;
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
            res.status(404).json({
                error: 'Habit not found'
            });
            return;
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
            res.status(404).json({
                error: 'Habit not found'
            });
            return;
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
                res.status(404).json({
                    error: 'Category not found'
                });
                return;
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
                res.status(400).json({
                    error: 'Habit with this title already exists'
                });
                return;
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
            res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
            return;
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
            res.status(404).json({
                error: 'Habit not found'
            });
            return;
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
            res.status(404).json({
                success: false,
                error: 'Habit not found or inactive'
            });
            return;
        }
        if (habit.type === 'Shareable' && publishAsAtom && !image) {
            res.status(400).json({
                success: false,
                error: 'Shareable habits require an image to be published as atom',
                code: 'IMAGE_REQUIRED_FOR_SHAREABLE'
            });
            return;
        }
        if (habit.type === 'Personal' && publishAsAtom) {
            res.status(400).json({
                success: false,
                error: 'Personal habits cannot be published as atoms',
                code: 'PERSONAL_HABIT_NOT_SHAREABLE'
            });
            return;
        }
        const completionCheck = await checkTodayCompletion(habit, userId);
        if (completionCheck.alreadyCompleted) {
            res.status(400).json({
                success: false,
                error: completionCheck.message,
                code: 'ALREADY_COMPLETED'
            });
            return;
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
            try {
                const aiCaption = await generateCaption(habit.title, habit.category.name, habit.occurrence, notes);
                atom = await prisma_1.prisma.atom.create({
                    data: {
                        userId,
                        habitId: id,
                        completionId: completion.id,
                        image,
                        caption: aiCaption,
                        habitTitle: habit.title,
                        habitType: habit.occurrence,
                        completionTime: completion.completedAt
                    }
                });
                await prisma_1.prisma.habitCompletion.update({
                    where: { id: completion.id },
                    data: { isPublished: true }
                });
                console.log(`AI Caption generated for ${habit.title}: ${aiCaption}`);
            }
            catch (atomError) {
                console.error('Failed to create atom:', atomError);
            }
        }
        await updateUserKarma(userId);
        res.status(201).json({
            success: true,
            message: 'Habit completed successfully',
            data: {
                completion,
                atom,
                habitType: habit.type,
                wasPublished: !!atom
            }
        });
    }
    catch (error) {
        console.error('Complete habit error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while completing habit'
        });
    }
};
exports.completeHabit = completeHabit;
//# sourceMappingURL=habitController.js.map