import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const markAsReadSchema = z.object({
  notificationIds: z.array(z.string().cuid()).optional()
});

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = (req as any).user.id;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      userId
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    res.json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      unreadCount
    });
  } catch (error) {
    throw error;
  }
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      res.status(404).json({
        error: 'Notification not found'
      });
      return;
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({
      message: 'Notification marked as read',
      notification: updatedNotification
    });
  } catch (error) {
    throw error;
  }
};

export const markMultipleAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notificationIds } = markAsReadSchema.parse(req.body);
    const userId = (req as any).user.id;

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId
        },
        data: { isRead: true }
      });

      res.json({
        message: `${result.count} notifications marked as read`
      });
    } else {
      // Mark all notifications as read
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: { isRead: true }
      });

      res.json({
        message: `${result.count} notifications marked as read`
      });
    }
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

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      res.status(404).json({
        error: 'Notification not found'
      });
      return;
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      message: 'Notification deleted'
    });
  } catch (error) {
    throw error;
  }
};

export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    // In a real app, you'd store user notification preferences
    const settings = {
      emailNotifications: true,
      pushNotifications: true,
      habitReminders: true,
      streakMilestones: true,
      socialNotifications: true,
      weeklyReports: true
    };

    res.json({ settings });
  } catch (error) {
    throw error;
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      habitReminders,
      streakMilestones,
      socialNotifications,
      weeklyReports
    } = req.body;

    // In a real app, you'd save these settings to the database
    const settings = {
      emailNotifications: emailNotifications ?? true,
      pushNotifications: pushNotifications ?? true,
      habitReminders: habitReminders ?? true,
      streakMilestones: streakMilestones ?? true,
      socialNotifications: socialNotifications ?? true,
      weeklyReports: weeklyReports ?? true
    };

    res.json({
      message: 'Notification settings updated',
      settings
    });
  } catch (error) {
    throw error;
  }
};

export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, title, message, data, scheduledFor } = req.body;
    const userId = (req as any).user.id;

    if (!type || !title || !message) {
      res.status(400).json({
        error: 'Type, title, and message are required'
      });
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null
      }
    });

    res.status(201).json({
      message: 'Notification created',
      notification
    });
  } catch (error) {
    throw error;
  }
};
