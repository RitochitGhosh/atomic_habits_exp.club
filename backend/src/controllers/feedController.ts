import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = (req as any).user.id;
    const skip = (Number(page) - 1) * Number(limit);

    // Get followed user IDs
    const following = await prisma.follow.findMany({
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

    const atoms = await prisma.atom.findMany({
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

    const total = await prisma.atom.count({
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
  } catch (error) {
    throw error;
  }
}; // Tested

export const getAtomById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const atom = await prisma.atom.findUnique({
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
  } catch (error) {
    throw error;
  }
}; // Tested

export const voteOnAtom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = (req as any).user.id;

    if (!['upvote', 'downvote'].includes(voteType)) {
      res.status(400).json({
        error: 'Invalid vote type'
      });
      return;
    }

    // Check if atom exists
    const atom = await prisma.atom.findUnique({
      where: { id }
    });

    if (!atom) {
      res.status(404).json({
        error: 'Atom not found'
      });
      return;
    }

    // Check if user already voted
    const existingVote = await prisma.atomVote.findUnique({
      where: {
        atomId_userId: {
          atomId: id,
          userId
        }
      }
    });

    if (existingVote) {
      // Update existing vote
      if (existingVote.voteType === voteType) {
        // Same vote type - remove vote
        await prisma.atomVote.delete({
          where: {
            atomId_userId: {
              atomId: id,
              userId
            }
          }
        });

        // Update atom vote counts
        const voteChange = voteType === 'upvote' ? -1 : 1;
        await prisma.atom.update({
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
      } else {
        // Different vote type - update vote
        await prisma.atomVote.update({
          where: {
            atomId_userId: {
              atomId: id,
              userId
            }
          },
          data: { voteType }
        });

        // Update atom vote counts
        const upvoteChange = voteType === 'upvote' ? 1 : -1;
        const downvoteChange = voteType === 'downvote' ? 1 : -1;
        const netChange = voteType === 'upvote' ? 2 : -2;

        await prisma.atom.update({
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
    } else {
      // Create new vote
      await prisma.atomVote.create({
        data: {
          atomId: id,
          userId,
          voteType
        }
      });

      // Update atom vote counts
      const upvoteChange = voteType === 'upvote' ? 1 : 0;
      const downvoteChange = voteType === 'downvote' ? 1 : 0;
      const netChange = voteType === 'upvote' ? 1 : -1;

      await prisma.atom.update({
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

    // Check if atom should be marked as completed (netVotes > 0)
    const updatedAtom = await prisma.atom.findUnique({
      where: { id },
      select: { netVotes: true, isCompleted: true }
    });

    if (updatedAtom && updatedAtom.netVotes > 0 && !updatedAtom.isCompleted) {
      await prisma.atom.update({
        where: { id },
        data: { isCompleted: true }
      });
    } else if (updatedAtom && updatedAtom.netVotes <= 0 && updatedAtom.isCompleted) {
      await prisma.atom.update({
        where: { id },
        data: { isCompleted: false }
      });
    }
  } catch (error) {
    throw error;
  }
}; // Tested

export const removeVote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const existingVote = await prisma.atomVote.findUnique({
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

    // Remove vote
    await prisma.atomVote.delete({
      where: {
        atomId_userId: {
          atomId: id,
          userId
        }
      }
    });

    // Update atom vote counts
    const voteChange = existingVote.voteType === 'upvote' ? -1 : 1;
    await prisma.atom.update({
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
  } catch (error) {
    throw error;
  }
}; // Tested

export const getTrendingAtoms = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = (req as any).user.id;
    const skip = (Number(page) - 1) * Number(limit);

    // Get atoms from last 7 days with highest net votes
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const atoms = await prisma.atom.findMany({
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

    const total = await prisma.atom.count({
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
  } catch (error) {
    throw error;
  }
}; // Tested
