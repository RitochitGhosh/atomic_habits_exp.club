"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingAtoms = exports.removeVote = exports.voteOnAtom = exports.getAtomById = exports.getFeed = void 0;
const prisma_1 = require("../lib/prisma");
const getFeed = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user.id;
        const skip = (Number(page) - 1) * Number(limit);
        const following = await prisma_1.prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });
        const followingIds = following.map(f => f.followingId);
        if (followingIds.length === 0) {
            res.json({
                atoms: [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: 0,
                    pages: 0
                }
            });
            return;
        }
        const atoms = await prisma_1.prisma.atom.findMany({
            where: {
                userId: { in: followingIds }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profileImage: true,
                        totalKarma: true
                    }
                },
                habit: {
                    select: {
                        id: true,
                        title: true,
                        category: {
                            select: {
                                name: true,
                                icon: true
                            }
                        }
                    }
                },
                votes: {
                    where: { userId },
                    select: {
                        voteType: true
                    }
                },
                _count: {
                    select: {
                        votes: true
                    }
                }
            },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });
        const total = await prisma_1.prisma.atom.count({
            where: {
                userId: { in: followingIds }
            }
        });
        res.json({
            atoms,
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
exports.getFeed = getFeed;
const getAtomById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const atom = await prisma_1.prisma.atom.findUnique({
            where: { id },
            include: {
                user: {
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
                    }
                },
                habit: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        occurrence: true,
                        slot: true,
                        category: {
                            select: {
                                name: true,
                                icon: true
                            }
                        }
                    }
                },
                votes: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profileImage: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        votes: true
                    }
                }
            }
        });
        if (!atom) {
            res.status(404).json({
                error: 'Atom not found'
            });
            return;
        }
        res.json({ atom });
    }
    catch (error) {
        throw error;
    }
};
exports.getAtomById = getAtomById;
const voteOnAtom = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const userId = req.user.id;
        if (!['upvote', 'downvote'].includes(voteType)) {
            res.status(400).json({
                error: 'Invalid vote type'
            });
            return;
        }
        const atom = await prisma_1.prisma.atom.findUnique({
            where: { id }
        });
        if (!atom) {
            res.status(404).json({
                error: 'Atom not found'
            });
            return;
        }
        const existingVote = await prisma_1.prisma.atomVote.findUnique({
            where: {
                atomId_userId: {
                    atomId: id,
                    userId
                }
            }
        });
        if (existingVote) {
            if (existingVote.voteType === voteType) {
                await prisma_1.prisma.atomVote.delete({
                    where: {
                        atomId_userId: {
                            atomId: id,
                            userId
                        }
                    }
                });
                const voteChange = voteType === 'upvote' ? -1 : 1;
                await prisma_1.prisma.atom.update({
                    where: { id },
                    data: {
                        upvotes: { increment: voteType === 'upvote' ? -1 : 0 },
                        downvotes: { increment: voteType === 'downvote' ? -1 : 0 },
                        netVotes: { increment: voteType === 'upvote' ? -1 : 1 }
                    }
                });
                res.json({
                    message: 'Vote removed',
                    voteType: null
                });
            }
            else {
                await prisma_1.prisma.atomVote.update({
                    where: {
                        atomId_userId: {
                            atomId: id,
                            userId
                        }
                    },
                    data: { voteType }
                });
                const upvoteChange = voteType === 'upvote' ? 1 : -1;
                const downvoteChange = voteType === 'downvote' ? 1 : -1;
                const netChange = voteType === 'upvote' ? 2 : -2;
                await prisma_1.prisma.atom.update({
                    where: { id },
                    data: {
                        upvotes: { increment: upvoteChange },
                        downvotes: { increment: downvoteChange },
                        netVotes: { increment: netChange }
                    }
                });
                res.json({
                    message: 'Vote updated',
                    voteType
                });
            }
        }
        else {
            await prisma_1.prisma.atomVote.create({
                data: {
                    atomId: id,
                    userId,
                    voteType
                }
            });
            const upvoteChange = voteType === 'upvote' ? 1 : 0;
            const downvoteChange = voteType === 'downvote' ? 1 : 0;
            const netChange = voteType === 'upvote' ? 1 : -1;
            await prisma_1.prisma.atom.update({
                where: { id },
                data: {
                    upvotes: { increment: upvoteChange },
                    downvotes: { increment: downvoteChange },
                    netVotes: { increment: netChange }
                }
            });
            res.json({
                message: 'Vote added',
                voteType
            });
        }
        const updatedAtom = await prisma_1.prisma.atom.findUnique({
            where: { id },
            select: { netVotes: true, isCompleted: true }
        });
        if (updatedAtom && updatedAtom.netVotes > 0 && !updatedAtom.isCompleted) {
            await prisma_1.prisma.atom.update({
                where: { id },
                data: { isCompleted: true }
            });
        }
        else if (updatedAtom && updatedAtom.netVotes <= 0 && updatedAtom.isCompleted) {
            await prisma_1.prisma.atom.update({
                where: { id },
                data: { isCompleted: false }
            });
        }
    }
    catch (error) {
        throw error;
    }
};
exports.voteOnAtom = voteOnAtom;
const removeVote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const existingVote = await prisma_1.prisma.atomVote.findUnique({
            where: {
                atomId_userId: {
                    atomId: id,
                    userId
                }
            }
        });
        if (!existingVote) {
            res.status(404).json({
                error: 'No vote found'
            });
            return;
        }
        await prisma_1.prisma.atomVote.delete({
            where: {
                atomId_userId: {
                    atomId: id,
                    userId
                }
            }
        });
        const voteChange = existingVote.voteType === 'upvote' ? -1 : 1;
        await prisma_1.prisma.atom.update({
            where: { id },
            data: {
                upvotes: { increment: existingVote.voteType === 'upvote' ? -1 : 0 },
                downvotes: { increment: existingVote.voteType === 'downvote' ? -1 : 0 },
                netVotes: { increment: existingVote.voteType === 'upvote' ? -1 : 1 }
            }
        });
        res.json({
            message: 'Vote removed'
        });
    }
    catch (error) {
        throw error;
    }
};
exports.removeVote = removeVote;
const getTrendingAtoms = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user.id;
        const skip = (Number(page) - 1) * Number(limit);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const atoms = await prisma_1.prisma.atom.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                },
                netVotes: {
                    gt: 0
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profileImage: true,
                        totalKarma: true
                    }
                },
                habit: {
                    select: {
                        id: true,
                        title: true,
                        category: {
                            select: {
                                name: true,
                                icon: true
                            }
                        }
                    }
                },
                votes: {
                    where: { userId },
                    select: {
                        voteType: true
                    }
                },
                _count: {
                    select: {
                        votes: true
                    }
                }
            },
            skip,
            take: Number(limit),
            orderBy: [
                { netVotes: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        const total = await prisma_1.prisma.atom.count({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                },
                netVotes: {
                    gt: 0
                }
            }
        });
        res.json({
            atoms,
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
exports.getTrendingAtoms = getTrendingAtoms;
//# sourceMappingURL=feedController.js.map