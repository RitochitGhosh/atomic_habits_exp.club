import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDailyLeaderboard = async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const userId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all users with their today's karma
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        profileImage: true,
        totalKarma: true,
        createdAt: true
      },
      take: Number(limit) * 2 // Get more to calculate daily karma
    });

    // Calculate daily karma for each user
    const usersWithDailyKarma = await Promise.all(
      users.map(async (user) => {
        // Get today's completed habits
        const todayCompletions = await prisma.habitCompletion.findMany({
          where: {
            userId: user.id,
            completedAt: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        // Get current streak
        const allCompletions = await prisma.habitCompletion.findMany({
          where: {
            userId: user.id
          },
          orderBy: { completedAt: 'desc' }
        });

        let currentStreak = 0;
        const checkDate = new Date(today);
        
        for (let i = 0; i < 365; i++) { // Check up to a year
          const dayCompletions = allCompletions.filter(c => {
            const completionDate = new Date(c.completedAt);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === checkDate.getTime();
          });

          if (dayCompletions.length > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        // Get today's votes given
        const todayVotes = await prisma.atomVote.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        // Calculate daily karma
        const starsEarned = todayCompletions.length;
        const streakBonus = Math.floor(currentStreak / 7) * 10; // Bonus every week
        const socialEngagement = todayVotes.length * 2;
        const dailyKarma = starsEarned * 10 + streakBonus + socialEngagement;

        return {
          ...user,
          dailyKarma,
          starsEarned,
          currentStreak,
          socialEngagement: todayVotes.length
        };
      })
    );

    // Sort by daily karma and take top users
    const leaderboard = usersWithDailyKarma
      .sort((a, b) => b.dailyKarma - a.dailyKarma)
      .slice(0, Number(limit));

    // Add ranking
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // Find current user's position
    const currentUserRank = rankedLeaderboard.findIndex(
      user => user.id === userId
    );

    res.json({
      leaderboard: rankedLeaderboard,
      currentUserRank: currentUserRank >= 0 ? currentUserRank + 1 : null,
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    throw error;
  }
}; // Tested

export const getTotalLeaderboard = async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const userId = (req as any).user.id;

    const leaderboard = await prisma.user.findMany({
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

    // Add ranking
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // Find current user's position
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalKarma: true }
    });

    const currentUserRank = await prisma.user.count({
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
  } catch (error) {
    throw error;
  }
}; // Tested

export const getUserRankingHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true }
    });

    if (!user) {
      res.status(404).json({
        error: 'User not found'
      });
      return;
    }

    // Get user's karma history (simplified - in real app, you'd store daily karma)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId: id,
        completedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { completedAt: 'asc' }
    });

    // Group by date and calculate daily karma
    const dailyKarma = completions.reduce((acc, completion) => {
      const date = completion.completedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += 10; // 10 points per habit completion
      return acc;
    }, {} as Record<string, number>);

    // Format for chart
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
  } catch (error) {
    throw error;
  }
}; // Tested

export const getCategoryLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { limit = 50 } = req.query;
    const userId = (req as any).user.id;

    // Verify category exists
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
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

    // Get users with habits in this category
    const users = await prisma.user.findMany({
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

    // Calculate category-specific karma
    const usersWithCategoryKarma = users.map(user => {
      const categoryCompletions = user.habits.flatMap(habit => habit.completions);
      const categoryKarma = categoryCompletions.length * 10; // 10 points per completion

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

    // Sort by category karma
    const leaderboard = usersWithCategoryKarma
      .sort((a, b) => b.categoryKarma - a.categoryKarma)
      .slice(0, Number(limit));

    // Add ranking
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
  } catch (error) {
    throw error;
  }
}; 
