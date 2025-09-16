"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.updateNotificationSettings = exports.getNotificationSettings = exports.deleteNotification = exports.markMultipleAsRead = exports.markNotificationAsRead = exports.getNotifications = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const markAsReadSchema = zod_1.z.object({
    notificationIds: zod_1.z.array(zod_1.z.string().cuid()).optional()
});
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const userId = req.user.id;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            userId
        };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }
        const notifications = await prisma_1.prisma.notification.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma_1.prisma.notification.count({ where });
        const unreadCount = await prisma_1.prisma.notification.count({
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
    }
    catch (error) {
        throw error;
    }
};
exports.getNotifications = getNotifications;
const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notification = await prisma_1.prisma.notification.findFirst({
            where: {
                id,
                userId
            }
        });
        if (!notification) {
            return res.status(404).json({
                error: 'Notification not found'
            });
        }
        const updatedNotification = await prisma_1.prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({
            message: 'Notification marked as read',
            notification: updatedNotification
        });
    }
    catch (error) {
        throw error;
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const markMultipleAsRead = async (req, res) => {
    try {
        const { notificationIds } = markAsReadSchema.parse(req.body);
        const userId = req.user.id;
        if (notificationIds && notificationIds.length > 0) {
            const result = await prisma_1.prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId
                },
                data: { isRead: true }
            });
            res.json({
                message: `${result.count} notifications marked as read`
            });
        }
        else {
            const result = await prisma_1.prisma.notification.updateMany({
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
exports.markMultipleAsRead = markMultipleAsRead;
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notification = await prisma_1.prisma.notification.findFirst({
            where: {
                id,
                userId
            }
        });
        if (!notification) {
            return res.status(404).json({
                error: 'Notification not found'
            });
        }
        await prisma_1.prisma.notification.delete({
            where: { id }
        });
        res.json({
            message: 'Notification deleted'
        });
    }
    catch (error) {
        throw error;
    }
};
exports.deleteNotification = deleteNotification;
const getNotificationSettings = async (req, res) => {
    try {
        const settings = {
            emailNotifications: true,
            pushNotifications: true,
            habitReminders: true,
            streakMilestones: true,
            socialNotifications: true,
            weeklyReports: true
        };
        res.json({ settings });
    }
    catch (error) {
        throw error;
    }
};
exports.getNotificationSettings = getNotificationSettings;
const updateNotificationSettings = async (req, res) => {
    try {
        const { emailNotifications, pushNotifications, habitReminders, streakMilestones, socialNotifications, weeklyReports } = req.body;
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
    }
    catch (error) {
        throw error;
    }
};
exports.updateNotificationSettings = updateNotificationSettings;
const createNotification = async (req, res) => {
    try {
        const { type, title, message, data, scheduledFor } = req.body;
        const userId = req.user.id;
        if (!type || !title || !message) {
            return res.status(400).json({
                error: 'Type, title, and message are required'
            });
        }
        const notification = await prisma_1.prisma.notification.create({
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
    }
    catch (error) {
        throw error;
    }
};
exports.createNotification = createNotification;
//# sourceMappingURL=notificationController.js.map