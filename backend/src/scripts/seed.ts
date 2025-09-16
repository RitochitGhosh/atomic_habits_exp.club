import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Fitness', icon: '💪' },
  { name: 'Health', icon: '🏥' },
  { name: 'Productivity', icon: '⚡' },
  { name: 'Learning', icon: '📚' },
  { name: 'Social', icon: '👥' },
  { name: 'Mindfulness', icon: '🧘' },
  { name: 'Creativity', icon: '🎨' },
  { name: 'Finance', icon: '💰' }
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default categories
  console.log('Creating default categories...');
  for (const category of defaultCategories) {
    // Check if category already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: category.name,
        isDefault: true,
        userId: null
      }
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: {
          name: category.name,
          icon: category.icon,
          isDefault: true
        }
      });
    }
  }

  console.log('✅ Default categories created successfully');

  // Create a demo user for testing
  console.log('Creating demo user...');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demo_user',
      passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKqKq', // password: "password"
      bio: 'Demo user for testing the habit tracker',
      hasCompletedOnboarding: true
    }
  });

  console.log('✅ Demo user created successfully');

  // Create some sample habits for the demo user
  console.log('Creating sample habits...');
  const fitnessCategory = await prisma.category.findFirst({
    where: { name: 'Fitness', isDefault: true }
  });

  const healthCategory = await prisma.category.findFirst({
    where: { name: 'Health', isDefault: true }
  });

  const productivityCategory = await prisma.category.findFirst({
    where: { name: 'Productivity', isDefault: true }
  });

  if (fitnessCategory) {
    await prisma.habit.create({
      data: {
        title: 'Morning Workout',
        description: '30 minutes of exercise to start the day',
        categoryId: fitnessCategory.id,
        type: 'Shareable',
        occurrence: 'daily',
        slot: 'Morning',
        startDate: new Date(),
        userId: demoUser.id
      }
    });

    await prisma.habit.create({
      data: {
        title: 'Evening Walk',
        description: 'Take a 20-minute walk after dinner',
        categoryId: fitnessCategory.id,
        type: 'Personal',
        occurrence: 'daily',
        slot: 'Evening',
        startDate: new Date(),
        userId: demoUser.id
      }
    });
  }

  if (healthCategory) {
    await prisma.habit.create({
      data: {
        title: 'Drink 8 Glasses of Water',
        description: 'Stay hydrated throughout the day',
        categoryId: healthCategory.id,
        type: 'Shareable',
        occurrence: 'daily',
        slot: 'Morning',
        startDate: new Date(),
        userId: demoUser.id
      }
    });

    await prisma.habit.create({
      data: {
        title: 'Take Vitamins',
        description: 'Take daily multivitamin with breakfast',
        categoryId: healthCategory.id,
        type: 'Personal',
        occurrence: 'daily',
        slot: 'Morning',
        startDate: new Date(),
        userId: demoUser.id
      }
    });
  }

  if (productivityCategory) {
    await prisma.habit.create({
      data: {
        title: 'Read for 30 Minutes',
        description: 'Read books or articles to expand knowledge',
        categoryId: productivityCategory.id,
        type: 'Shareable',
        occurrence: 'daily',
        slot: 'Evening',
        startDate: new Date(),
        userId: demoUser.id
      }
    });

    await prisma.habit.create({
      data: {
        title: 'Plan Next Day',
        description: 'Write down tasks and goals for tomorrow',
        categoryId: productivityCategory.id,
        type: 'Personal',
        occurrence: 'daily',
        slot: 'Night',
        startDate: new Date(),
        userId: demoUser.id
      }
    });
  }

  console.log('✅ Sample habits created successfully');

  // Create some sample completions
  console.log('Creating sample completions...');
  const habits = await prisma.habit.findMany({
    where: { userId: demoUser.id }
  });

  for (let i = 0; i < 5; i++) {
    const habit = habits[Math.floor(Math.random() * habits.length)];
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() - i);

    await prisma.habitCompletion.create({
      data: {
        habitId: habit.id,
        userId: demoUser.id,
        notes: `Completed on ${completionDate.toDateString()}`,
        completedAt: completionDate
      }
    });
  }

  console.log('✅ Sample completions created successfully');

  // Update demo user's karma
  const completions = await prisma.habitCompletion.count({
    where: { userId: demoUser.id }
  });

  await prisma.user.update({
    where: { id: demoUser.id },
    data: { totalKarma: completions * 10 }
  });

  console.log('✅ Demo user karma updated');

  console.log('🎉 Database seed completed successfully!');
  console.log('\nDemo user credentials:');
  console.log('Email: demo@example.com');
  console.log('Password: password');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
