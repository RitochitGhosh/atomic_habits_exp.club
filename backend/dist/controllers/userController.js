"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeOnboarding = exports.getFollowing = exports.getFollowers = exports.unfollowUser = exports.followUser = exports.searchUsers = exports.updateProfile = exports.getUserProfile = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const updateProfileSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(20).optional(),
    bio: zod_1.z.string().max(160).optional(),
});
const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                profileImage: true,
                bio: true,
                totalKarma: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        habits: true,
                        atoms: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        res.json({ user });
    }
    catch (error) {
        throw error;
    }
};
exports.getUserProfile = getUserProfile;
const updateProfile = async (req, res) => {
    try {
        const { username, bio } = updateProfileSchema.parse(req.body);
        const userId = req.user.id;
        if (username) {
            const existingUser = await prisma_1.prisma.user.findFirst({
                where: {
                    username,
                    id: { not: userId }
                }
            });
            if (existingUser) {
                return res.status(400).json({
                    error: 'Username already taken'
                });
            }
        }
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(username && { username }),
                ...(bio !== undefined && { bio }),
            },
            select: {
                id: true,
                email: true,
                username: true,
                profileImage: true,
                bio: true,
                totalKarma: true,
                hasCompletedOnboarding: true,
                createdAt: true,
            }
        });
        res.json({
            message: 'Profile updated successfully',
            user
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
exports.updateProfile = updateProfile;
const searchUsers = async (req, res) => {
    try {
        const { query } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.id;
        const skip = (Number(page) - 1) * Number(limit);
        const users = await prisma_1.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: userId } },
                    {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                username: true,
                profileImage: true,
                bio: true,
                totalKarma: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true
                    }
                }
            },
            skip,
            take: Number(limit),
            orderBy: { totalKarma: 'desc' }
        });
        res.json({ users });
    }
    catch (error) {
        throw error;
    }
};
exports.searchUsers = searchUsers;
const followUser = async (req, res) => {
    try {
        const { id: followingId } = req.params;
        const userId = req.user.id;
        if (followingId === userId) {
            return res.status(400).json({
                error: 'Cannot follow yourself'
            });
        }
        const userToFollow = await prisma_1.prisma.user.findUnique({
            where: { id: followingId }
        });
        if (!userToFollow) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        const existingFollow = await prisma_1.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId
                }
            }
        });
        if (existingFollow) {
            return res.status(400).json({
                error: 'Already following this user'
            });
        }
        await prisma_1.prisma.follow.create({
            data: {
                followerId: userId,
                followingId
            }
        });
        res.json({
            message: 'User followed successfully'
        });
    }
    catch (error) {
        throw error;
    }
};
exports.followUser = followUser;
const unfollowUser = async (req, res) => {
    try {
        const { id: followingId } = req.params;
        const userId = req.user.id;
        const follow = await prisma_1.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId
                }
            }
        });
        if (!follow) {
            return res.status(404).json({
                error: 'Not following this user'
            });
        }
        await prisma_1.prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId
                }
            }
        });
        res.json({
            message: 'User unfollowed successfully'
        });
    }
    catch (error) {
        throw error;
    }
};
exports.unfollowUser = unfollowUser;
const getFollowers = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const followers = await prisma_1.prisma.follow.findMany({
            where: { followingId: id },
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        profileImage: true,
                        bio: true,
                        totalKarma: true,
                        createdAt: true
                    }
                }
            },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            followers: followers.map(f => f.follower)
        });
    }
    catch (error) {
        throw error;
    }
};
exports.getFollowers = getFollowers;
const getFollowing = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const following = await prisma_1.prisma.follow.findMany({
            where: { followerId: id },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        profileImage: true,
                        bio: true,
                        totalKarma: true,
                        createdAt: true
                    }
                }
            },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            following: following.map(f => f.following)
        });
    }
    catch (error) {
        throw error;
    }
};
exports.getFollowing = getFollowing;
const completeOnboarding = async (req, res) => {
    try {
        const { followingIds } = req.body;
        const userId = req.user.id;
        if (!Array.isArray(followingIds) || followingIds.length < 3) {
            return res.status(400).json({
                error: 'Must follow at least 3 users to complete onboarding'
            });
        }
        const users = await prisma_1.prisma.user.findMany({
            where: {
                id: { in: followingIds }
            }
        });
        if (users.length !== followingIds.length) {
            return res.status(400).json({
                error: 'One or more users not found'
            });
        }
        const followData = followingIds.map(followingId => ({
            followerId: userId,
            followingId
        }));
        await prisma_1.prisma.follow.createMany({
            data: followData,
            skipDuplicates: true
        });
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { hasCompletedOnboarding: true }
        });
        res.json({
            message: 'Onboarding completed successfully'
        });
    }
    catch (error) {
        throw error;
    }
};
exports.completeOnboarding = completeOnboarding;
//# sourceMappingURL=userController.js.map