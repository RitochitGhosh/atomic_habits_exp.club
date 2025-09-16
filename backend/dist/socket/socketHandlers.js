"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const setupSocketHandlers = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, username: true }
            });
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.userId = user.id;
            next();
        }
        catch (error) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);
        socket.join(`user:${socket.userId}`);
        socket.join('leaderboard');
        socket.on('habit:completed', async (data) => {
            try {
                const { habitId, completionId } = data;
                const completion = await prisma_1.prisma.habitCompletion.findFirst({
                    where: {
                        id: completionId,
                        userId: socket.userId,
                        habitId
                    },
                    include: {
                        habit: {
                            select: {
                                title: true,
                                type: true
                            }
                        }
                    }
                });
                if (!completion) {
                    socket.emit('error', { message: 'Completion not found' });
                    return;
                }
                socket.emit('habit:completion:success', {
                    habitId,
                    completionId,
                    habitTitle: completion.habit.title
                });
                if (completion.habit.type === 'Shareable' && completion.isPublished) {
                    const followers = await prisma_1.prisma.follow.findMany({
                        where: { followingId: socket.userId },
                        select: { followerId: true }
                    });
                    followers.forEach(follower => {
                        io.to(`user:${follower.followerId}`).emit('feed:new_atom', {
                            userId: socket.userId,
                            habitTitle: completion.habit.title,
                            message: `${socket.userId} completed their ${completion.habit.title} habit!`
                        });
                    });
                }
                io.to('leaderboard').emit('leaderboard:update', {
                    userId: socket.userId,
                    type: 'habit_completed'
                });
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to process habit completion' });
            }
        });
        socket.on('atom:vote', async (data) => {
            try {
                const { atomId, voteType } = data;
                const atom = await prisma_1.prisma.atom.findUnique({
                    where: { id: atomId },
                    include: {
                        user: {
                            select: { id: true, username: true }
                        }
                    }
                });
                if (!atom) {
                    socket.emit('error', { message: 'Atom not found' });
                    return;
                }
                const existingVote = await prisma_1.prisma.atomVote.findUnique({
                    where: {
                        atomId_userId: {
                            atomId,
                            userId: socket.userId
                        }
                    }
                });
                let voteResult;
                if (existingVote) {
                    if (existingVote.voteType === voteType) {
                        await prisma_1.prisma.atomVote.delete({
                            where: {
                                atomId_userId: {
                                    atomId,
                                    userId: socket.userId
                                }
                            }
                        });
                        const voteChange = voteType === 'upvote' ? -1 : 1;
                        await prisma_1.prisma.atom.update({
                            where: { id: atomId },
                            data: {
                                upvotes: { increment: voteType === 'upvote' ? -1 : 0 },
                                downvotes: { increment: voteType === 'downvote' ? -1 : 0 },
                                netVotes: { increment: voteType === 'upvote' ? -1 : 1 }
                            }
                        });
                        voteResult = { voteType: null, action: 'removed' };
                    }
                    else {
                        await prisma_1.prisma.atomVote.update({
                            where: {
                                atomId_userId: {
                                    atomId,
                                    userId: socket.userId
                                }
                            },
                            data: { voteType }
                        });
                        const upvoteChange = voteType === 'upvote' ? 1 : -1;
                        const downvoteChange = voteType === 'downvote' ? 1 : -1;
                        const netChange = voteType === 'upvote' ? 2 : -2;
                        await prisma_1.prisma.atom.update({
                            where: { id: atomId },
                            data: {
                                upvotes: { increment: upvoteChange },
                                downvotes: { increment: downvoteChange },
                                netVotes: { increment: netChange }
                            }
                        });
                        voteResult = { voteType, action: 'updated' };
                    }
                }
                else {
                    await prisma_1.prisma.atomVote.create({
                        data: {
                            atomId,
                            userId: socket.userId,
                            voteType
                        }
                    });
                    const upvoteChange = voteType === 'upvote' ? 1 : 0;
                    const downvoteChange = voteType === 'downvote' ? 1 : 0;
                    const netChange = voteType === 'upvote' ? 1 : -1;
                    await prisma_1.prisma.atom.update({
                        where: { id: atomId },
                        data: {
                            upvotes: { increment: upvoteChange },
                            downvotes: { increment: downvoteChange },
                            netVotes: { increment: netChange }
                        }
                    });
                    voteResult = { voteType, action: 'added' };
                }
                const updatedAtom = await prisma_1.prisma.atom.findUnique({
                    where: { id: atomId },
                    select: {
                        upvotes: true,
                        downvotes: true,
                        netVotes: true,
                        isCompleted: true
                    }
                });
                io.emit('atom:vote:updated', {
                    atomId,
                    upvotes: updatedAtom?.upvotes,
                    downvotes: updatedAtom?.downvotes,
                    netVotes: updatedAtom?.netVotes,
                    isCompleted: updatedAtom?.isCompleted,
                    userVote: voteResult
                });
                if (atom.userId !== socket.userId) {
                    io.to(`user:${atom.userId}`).emit('atom:vote:notification', {
                        atomId,
                        voterId: socket.userId,
                        voteType: voteResult.voteType,
                        action: voteResult.action
                    });
                }
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to process vote' });
            }
        });
        socket.on('user:follow', async (data) => {
            try {
                const { userId } = data;
                if (userId === socket.userId) {
                    socket.emit('error', { message: 'Cannot follow yourself' });
                    return;
                }
                const existingFollow = await prisma_1.prisma.follow.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: socket.userId,
                            followingId: userId
                        }
                    }
                });
                if (existingFollow) {
                    socket.emit('error', { message: 'Already following this user' });
                    return;
                }
                await prisma_1.prisma.follow.create({
                    data: {
                        followerId: socket.userId,
                        followingId: userId
                    }
                });
                io.to(`user:${userId}`).emit('user:followed', {
                    followerId: socket.userId,
                    message: 'Someone started following you!'
                });
                socket.emit('user:follow:success', { userId });
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to follow user' });
            }
        });
        socket.on('user:unfollow', async (data) => {
            try {
                const { userId } = data;
                const follow = await prisma_1.prisma.follow.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: socket.userId,
                            followingId: userId
                        }
                    }
                });
                if (!follow) {
                    socket.emit('error', { message: 'Not following this user' });
                    return;
                }
                await prisma_1.prisma.follow.delete({
                    where: {
                        followerId_followingId: {
                            followerId: socket.userId,
                            followingId: userId
                        }
                    }
                });
                socket.emit('user:unfollow:success', { userId });
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to unfollow user' });
            }
        });
        socket.on('leaderboard:subscribe', () => {
            socket.join('leaderboard');
        });
        socket.on('leaderboard:unsubscribe', () => {
            socket.leave('leaderboard');
        });
        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected`);
        });
    });
    setInterval(async () => {
        try {
            const topUsers = await prisma_1.prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    totalKarma: true,
                    profileImage: true
                },
                take: 10,
                orderBy: { totalKarma: 'desc' }
            });
            io.to('leaderboard').emit('leaderboard:update', {
                type: 'periodic_update',
                topUsers
            });
        }
        catch (error) {
            console.error('Error broadcasting leaderboard update:', error);
        }
    }, 30000);
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=socketHandlers.js.map