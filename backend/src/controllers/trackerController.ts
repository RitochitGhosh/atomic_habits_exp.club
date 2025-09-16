import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getTodayHabits = async (req: Request, res: Response) => {
  try {
    const { slot } = req.query;
    const userId = (req as any).user.id;
    console.log("UserId: ", userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      userId,
      isActive: true,
      startDate: { lte: today }
    };

    if (slot) {
      where.slot = slot;
    }

    const habits = await prisma.habit.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        },
        completions: {
          where: {
            completedAt: {
              gte: today
            }
          },
          select: {
            id: true,
            completedAt: true,
            image: true,
            notes: true,
            isPublished: true
          }
        }
      },
      orderBy: [
        { slot: 'asc' },
        { title: 'asc' }
      ]
    });

    // Group habits by time slot
    const habitsBySlot = habits.reduce((acc, habit) => {
      if (!acc[habit.slot]) {
        acc[habit.slot] = [];
      }
      acc[habit.slot].push(habit);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate today's stats
    const completedHabits = habits.filter(habit => habit.completions.length > 0);
    const totalHabits = habits.length;
    const completionRate = totalHabits > 0 ? (completedHabits.length / totalHabits) * 100 : 0;

    res.json({
      habits: slot ? habits : habitsBySlot,
      stats: {
        totalHabits,
        completedHabits: completedHabits.length,
        completionRate: Math.round(completionRate),
        starsEarned: completedHabits.length
      }
    });
  } catch (error) {
    throw error;
  }
};

export const getHabitStats = async (req: Request, res: Response) => {
  try {
    const { habitId, days = 30 } = req.query;
    const userId = (req as any).user.id;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    let where: any = {
      userId,
      completedAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (habitId) {
      where.habitId = habitId;
    }

    const completions = await prisma.habitCompletion.findMany({
      where,
      include: {
        habit: {
          select: {
            id: true,
            title: true,
            occurrence: true,
            slot: true
          }
        }
      },
      orderBy: { completedAt: 'asc' }
    });

    // Calculate completion rate
    const totalDays = Number(days);
    const completedDays = new Set(
      completions.map(c => c.completedAt.toDateString())
    ).size;
    const completionRate = (completedDays / totalDays) * 100;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalDays; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasCompletion = completions.some(c => {
        const completionDate = new Date(c.completedAt);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === checkDate.getTime();
      });

      if (hasCompletion) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Group by date for heatmap
    const heatmapData = completions.reduce((acc, completion) => {
      const date = completion.completedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {} as Record<string, number>);

    // Get weekly trends
    const weeklyTrends = completions.reduce((acc, completion) => {
      const week = getWeekNumber(completion.completedAt);
      if (!acc[week]) {
        acc[week] = 0;
      }
      acc[week]++;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      stats: {
        completionRate: Math.round(completionRate),
        currentStreak,
        totalCompletions: completions.length,
        completedDays,
        totalDays
      },
      heatmapData,
      weeklyTrends,
      completions: completions.slice(-10) // Last 10 completions
    });
  } catch (error) {
    throw error;
  }
};

export const getHeatmapData = async (req: Request, res: Response) => {
  try {
    const { habitId, year = new Date().getFullYear() } = req.query;
    const userId = (req as any).user.id;
    
    const startDate = new Date(Number(year), 0, 1);
    const endDate = new Date(Number(year), 11, 31);

    let where: any = {
      userId,
      completedAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (habitId) {
      where.habitId = habitId;
    }

    const completions = await prisma.habitCompletion.findMany({
      where,
      select: {
        completedAt: true,
        habit: {
          select: {
            title: true
          }
        }
      }
    });

    // Create heatmap data
    const heatmapData = completions.reduce((acc, completion) => {
      const date = completion.completedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          habits: new Set()
        };
      }
      acc[date].count++;
      acc[date].habits.add(completion.habit.title);
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and format
    const formattedData = Object.values(heatmapData).map((item: any) => ({
      date: item.date,
      count: item.count,
      habits: Array.from(item.habits)
    }));

    res.json({
      year: Number(year),
      data: formattedData
    });
  } catch (error) {
    throw error;
  }
};

export const getKarmaPoints = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's completed habits
    const todayCompletions = await prisma.habitCompletion.findMany({
      where: {
        userId,
        completedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get current streak
    const allCompletions = await prisma.habitCompletion.findMany({
      where: {
        userId
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
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Calculate karma points
    const starsEarned = todayCompletions.length;
    const streakBonus = Math.floor(currentStreak / 7) * 10; // Bonus every week
    const socialEngagement = todayVotes.length * 2;

    const dailyKarma = starsEarned * 10 + streakBonus + socialEngagement;

    res.json({
      karma: {
        daily: dailyKarma,
        streak: currentStreak,
        starsEarned,
        streakBonus,
        socialEngagement
      }
    });
  } catch (error) {
    throw error;
  }
};

// Helper function to get week number
function getWeekNumber(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNumber}`;
}
