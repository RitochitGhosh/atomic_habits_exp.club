import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join leaderboard room for real-time updates
    socket.join('leaderboard');

    // Handle habit completion
    socket.on('habit:completed', async (data) => {
      try {
        const { habitId, completionId } = data;

        // Verify the completion belongs to the user
        const completion = await prisma.habitCompletion.findFirst({
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

        // Emit to user's room
        socket.emit('habit:completion:success', {
          habitId,
          completionId,
          habitTitle: completion.habit.title
        });

        // If it's a shareable habit and published as atom, notify followers
        if (completion.habit.type === 'Shareable' && completion.isPublished) {
          const followers = await prisma.follow.findMany({
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

        // Update leaderboard
        io.to('leaderboard').emit('leaderboard:update', {
          userId: socket.userId,
          type: 'habit_completed'
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to process habit completion' });
      }
    });

    // Handle atom voting
    socket.on('atom:vote', async (data) => {
      try {
        const { atomId, voteType } = data;

        // Verify atom exists
        const atom = await prisma.atom.findUnique({
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

        // Check if user already voted
        const existingVote = await prisma.atomVote.findUnique({
          where: {
            atomId_userId: {
              atomId,
              userId: socket.userId!
            }
          }
        });

        let voteResult;
        if (existingVote) {
          if (existingVote.voteType === voteType) {
            // Remove vote
            await prisma.atomVote.delete({
              where: {
                atomId_userId: {
                  atomId,
                  userId: socket.userId!
                }
              }
            });

            const voteChange = voteType === 'upvote' ? -1 : 1;
            await prisma.atom.update({
              where: { id: atomId },
              data: {
                upvotes: { increment: voteType === 'upvote' ? -1 : 0 },
                downvotes: { increment: voteType === 'downvote' ? -1 : 0 },
                netVotes: { increment: voteType === 'upvote' ? -1 : 1 }
              }
            });

            voteResult = { voteType: null, action: 'removed' };
          } else {
            // Update vote
            await prisma.atomVote.update({
              where: {
                atomId_userId: {
                  atomId,
                  userId: socket.userId!
                }
              },
              data: { voteType }
            });

            const upvoteChange = voteType === 'upvote' ? 1 : -1;
            const downvoteChange = voteType === 'downvote' ? 1 : -1;
            const netChange = voteType === 'upvote' ? 2 : -2;

            await prisma.atom.update({
              where: { id: atomId },
              data: {
                upvotes: { increment: upvoteChange },
                downvotes: { increment: downvoteChange },
                netVotes: { increment: netChange }
              }
            });

            voteResult = { voteType, action: 'updated' };
          }
        } else {
          // Create new vote
          await prisma.atomVote.create({
            data: {
              atomId,
              userId: socket.userId!,
              voteType
            }
          });

          const upvoteChange = voteType === 'upvote' ? 1 : 0;
          const downvoteChange = voteType === 'downvote' ? 1 : 0;
          const netChange = voteType === 'upvote' ? 1 : -1;

          await prisma.atom.update({
            where: { id: atomId },
            data: {
              upvotes: { increment: upvoteChange },
              downvotes: { increment: downvoteChange },
              netVotes: { increment: netChange }
            }
          });

          voteResult = { voteType, action: 'added' };
        }

        // Get updated atom data
        const updatedAtom = await prisma.atom.findUnique({
          where: { id: atomId },
          select: {
            upvotes: true,
            downvotes: true,
            netVotes: true,
            isCompleted: true
          }
        });

        // Emit to all users viewing this atom
        io.emit('atom:vote:updated', {
          atomId,
          upvotes: updatedAtom?.upvotes,
          downvotes: updatedAtom?.downvotes,
          netVotes: updatedAtom?.netVotes,
          isCompleted: updatedAtom?.isCompleted,
          userVote: voteResult
        });

        // Notify atom owner if it's not the voter
        if (atom.userId !== socket.userId) {
          io.to(`user:${atom.userId}`).emit('atom:vote:notification', {
            atomId,
            voterId: socket.userId,
            voteType: voteResult.voteType,
            action: voteResult.action
          });
        }

      } catch (error) {
        socket.emit('error', { message: 'Failed to process vote' });
      }
    });

    // Handle following/unfollowing
    socket.on('user:follow', async (data) => {
      try {
        const { userId } = data;

        if (userId === socket.userId) {
          socket.emit('error', { message: 'Cannot follow yourself' });
          return;
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: socket.userId!,
              followingId: userId
            }
          }
        });

        if (existingFollow) {
          socket.emit('error', { message: 'Already following this user' });
          return;
        }

        // Create follow relationship
        await prisma.follow.create({
          data: {
            followerId: socket.userId!,
            followingId: userId
          }
        });

        // Notify the followed user
        io.to(`user:${userId}`).emit('user:followed', {
          followerId: socket.userId,
          message: 'Someone started following you!'
        });

        socket.emit('user:follow:success', { userId });

      } catch (error) {
        socket.emit('error', { message: 'Failed to follow user' });
      }
    });

    socket.on('user:unfollow', async (data) => {
      try {
        const { userId } = data;

        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: socket.userId!,
              followingId: userId
            }
          }
        });

        if (!follow) {
          socket.emit('error', { message: 'Not following this user' });
          return;
        }

        await prisma.follow.delete({
          where: {
            followerId_followingId: {
              followerId: socket.userId!,
              followingId: userId
            }
          }
        });

        socket.emit('user:unfollow:success', { userId });

      } catch (error) {
        socket.emit('error', { message: 'Failed to unfollow user' });
      }
    });

    // Handle leaderboard updates
    socket.on('leaderboard:subscribe', () => {
      socket.join('leaderboard');
    });

    socket.on('leaderboard:unsubscribe', () => {
      socket.leave('leaderboard');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  // Broadcast leaderboard updates periodically
  setInterval(async () => {
    try {
      const topUsers = await prisma.user.findMany({
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
    } catch (error) {
      console.error('Error broadcasting leaderboard update:', error);
    }
  }, 30000); // Update every 30 seconds
};
