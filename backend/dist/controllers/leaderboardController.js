"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryLeaderboard = exports.getUserRankingHistory = exports.getTotalLeaderboard = exports.getDailyLeaderboard = void 0;
const prisma_1 = require("../lib/prisma");
const getDailyLeaderboard = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                profileImage: true,
                totalKarma: true,
                createdAt: true
            },
            take: Number(limit) * 2
        });
        const usersWithDailyKarma = await Promise.all(users.map(async (user) => {
            const todayCompletions = await prisma_1.prisma.habitCompletion.findMany({
                where: {
                    userId: user.id,
                    completedAt: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            });
            const allCompletions = await prisma_1.prisma.habitCompletion.findMany({
                where: {
                    userId: user.id
                },
                orderBy: { completedAt: 'desc' }
            });
            let currentStreak = 0;
            const checkDate = new Date(today);
            for (let i = 0; i < 365; i++) {
                const dayCompletions = allCompletions.filter(c => {
                    const completionDate = new Date(c.completedAt);
                    completionDate.setHours(0, 0, 0, 0);
                    return completionDate.getTime() === checkDate.getTime();
                });
                if (dayCompletions.length > 0) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
                else {
                    break;
                }
            }
            const todayVotes = await prisma_1.prisma.atomVote.findMany({
                where: {
                    userId: user.id,
                    createdAt: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            });
            const starsEarned = todayCompletions.length;
            const streakBonus = Math.floor(currentStreak / 7) * 10;
            const socialEngagement = todayVotes.length * 2;
            const dailyKarma = starsEarned * 10 + streakBonus + socialEngagement;
            return {
                ...user,
                dailyKarma,
                starsEarned,
                currentStreak,
                socialEngagement: todayVotes.length
            };
        }));
        const leaderboard = usersWithDailyKarma
            .sort((a, b) => b.dailyKarma - a.dailyKarma)
            .slice(0, Number(limit));
        const rankedLeaderboard = leaderboard.map((user, index) => ({
            ...user,
            rank: index + 1
        }));
        const currentUserRank = rankedLeaderboard.findIndex(user => user.id === userId);
        res.json({
            leaderboard: rankedLeaderboard,
            currentUserRank: currentUserRank >= 0 ? currentUserRank + 1 : null,
            date: today.toISOString().split('T')[0]
        });
    }
    catch (error) {
        throw error;
    }
};
exports.getDailyLeaderboard = getDailyLeaderboard;
const getTotalLeaderboard = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const userId = req.user.id;
        const leaderboard = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                profileImage: true,
                totalKarma: true,
                createdAt: true,
                _count: {
                    select: {
                        habits: true,
                        atoms: true,
                        followers: true,
                        following: true
                    }
                }
            },
            take: Number(limit),
            orderBy: { totalKarma: 'desc' }
        });
        const rankedLeaderboard = leaderboard.map((user, index) => ({
            ...user,
            rank: index + 1
        }));
        const currentUser = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { totalKarma: true }
        });
        const currentUserRank = await prisma_1.prisma.user.count({
            where: {
                totalKarma: {
                    gt: currentUser?.totalKarma || 0
                }
            }
        });
        res.json({
            leaderboard: rankedLeaderboard,
            currentUserRank: currentUserRank + 1,
            currentUserKarma: currentUser?.totalKarma || 0
        });
    }
    catch (error) {
        throw error;
    }
};
exports.getTotalLeaderboard = getTotalLeaderboard;
const getUserRankingHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { days = 30 } = req.query;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: { id: true, username: true }
        });
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(days));
        const completions = await prisma_1.prisma.habitCompletion.findMany({
            where: {
                userId: id,
                completedAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { completedAt: 'asc' }
        });
        const dailyKarma = completions.reduce((acc, completion) => {
            const date = completion.completedAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = 0;
            }
            acc[date] += 10;
            return acc;
        }, {});
        const history = Object.entries(dailyKarma).map(([date, karma]) => ({
            date,
            karma
        }));
        res.json({
            user: {
                id: user.id,
                username: user.username
            },
            history,
            totalDays: Number(days)
        });
    }
    catch (error) {
        throw error;
    }
};
exports.getUserRankingHistory = getUserRankingHistory;
const getCategoryLeaderboard = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { limit = 50 } = req.query;
        const userId = req.user.id;
        const category = await prisma_1.prisma.category.findFirst({
            where: {
                id: categoryId,
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
        const users = await prisma_1.prisma.user.findMany({
            where: {
                habits: {
                    some: {
                        categoryId
                    }
                }
            },
            select: {
                id: true,
                username: true,
                profileImage: true,
                totalKarma: true,
                createdAt: true,
                habits: {
                    where: {
                        categoryId
                    },
                    include: {
                        completions: {
                            select: {
                                completedAt: true
                            }
                        }
                    }
                }
            },
            take: Number(limit) * 2
        });
        const usersWithCategoryKarma = users.map(user => {
            const categoryCompletions = user.habits.flatMap(habit => habit.completions);
            const categoryKarma = categoryCompletions.length * 10;
            return {
                id: user.id,
                username: user.username,
                profileImage: user.profileImage,
                totalKarma: user.totalKarma,
                createdAt: user.createdAt,
                categoryKarma,
                categoryHabits: user.habits.length,
                categoryCompletions: categoryCompletions.length
            };
        });
        const leaderboard = usersWithCategoryKarma
            .sort((a, b) => b.categoryKarma - a.categoryKarma)
            .slice(0, Number(limit));
        const rankedLeaderboard = leaderboard.map((user, index) => ({
            ...user,
            rank: index + 1
        }));
        res.json({
            category: {
                id: category.id,
                name: category.name,
                icon: category.icon
            },
            leaderboard: rankedLeaderboard
        });
    }
    catch (error) {
        throw error;
    }
};
exports.getCategoryLeaderboard = getCategoryLeaderboard;
//# sourceMappingURL=leaderboardController.js.map