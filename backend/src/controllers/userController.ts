import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  bio: z.string().max(160).optional(),
});

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    if (!users) {
      res.status(404).json({
        error: "Users not found!"
      });
      return;
    }

    res.status(200).json({ users });
  } catch (error) {
    throw error;
  }
}

export const getUserProfile = async (req: Request, res: Response): Promise<void> => { // Tested
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
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
      res.status(404).json({
        error: 'User not found'
      });
      return;
    }

    res.json({ user });
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => { // Tested
  try {
    const { username, bio } = updateProfileSchema.parse(req.body);
    const userId = (req as any).user.id;

    // Check if username is taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId }
        }
      });

      if (existingUser) {
        res.status(400).json({
          error: 'Username already taken'
        });
        return;
      }
    }

    const user = await prisma.user.update({
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

export const searchUsers = async (req: Request, res: Response) => { // Tested
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = (req as any).user.id;

    const skip = (Number(page) - 1) * Number(limit);

    const users = await prisma.user.findMany({
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
  } catch (error) {
    throw error;
  }
};

export const followUser = async (req: Request, res: Response): Promise<void> => { // Tested
  try {
    const { id: followingId } = req.params;
    const userId = (req as any).user.id;

    if (followingId === userId) {
      res.status(400).json({
        error: 'Cannot follow yourself'
      });
      return;
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!userToFollow) {
      res.status(404).json({
        error: 'User not found'
      });
      return;
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId
        }
      }
    });

    if (existingFollow) {
      res.status(400).json({
        error: 'Already following this user'
      });
      return;
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: userId,
        followingId
      }
    });

    res.json({
      message: 'User followed successfully'
    });
  } catch (error) {
    throw error;
  }
};

export const unfollowUser = async (req: Request, res: Response): Promise<void> => { // Tested
  try {
    const { id: followingId } = req.params;
    const userId = (req as any).user.id;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId
        }
      }
    });

    if (!follow) {
      res.status(404).json({
        error: 'Not following this user'
      });
      return;
    }

    await prisma.follow.delete({
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
  } catch (error) {
    throw error;
  }
};

export const getFollowers = async (req: Request, res: Response) => { // Tested
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const followers = await prisma.follow.findMany({
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
  } catch (error) {
    throw error;
  }
};

export const getFollowing = async (req: Request, res: Response) => { // Tested
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const following = await prisma.follow.findMany({
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
  } catch (error) {
    throw error;
  }
};

export const completeOnboarding = async (req: Request, res: Response): Promise<void> => { // Tested
  try {
    const { followingIds } = req.body;
    const userId = (req as any).user.id;

    if (!Array.isArray(followingIds) || followingIds.length < 3) {
      res.status(400).json({
        error: 'Must follow at least 3 users to complete onboarding'
      });
      return;
    }

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: {
        id: { in: followingIds }
      }
    });

    if (users.length !== followingIds.length) {
      res.status(400).json({
        error: 'One or more users not found'
      });
      return;
    }

    // Create follow relationships
    const followData = followingIds.map(followingId => ({
      followerId: userId,
      followingId
    }));

    await prisma.follow.createMany({
      data: followData,
      skipDuplicates: true
    });

    // Mark onboarding as complete
    await prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true }
    });

    res.json({
      message: 'Onboarding completed successfully'
    });
  } catch (error) {
    throw error;
  }
};
