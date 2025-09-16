export interface UserType {
  id: string;
  username: string;
  profileImage?: string | null;
  totalKarma: number;
  bio?: string | null;
};

export interface CurrentUser {
  id: string;
  username: string;
  profileImage?: string | null;
  totalKarma: number;
  email: string;
  hasCompletedOnboarding: boolean;
};

export interface Habit {
  id: string;
  title: string;
  category: {
    name: string;
    icon: string;
  };
};

export interface Vote {
  voteType: 'upvote' | 'downvote';
};


export interface Atom {
  id: string;
  image: string;
  caption: string;
  habitTitle: string;
  habitType: string;
  completionTime: string;
  user: UserType;
  habit: Habit;
  votes: Vote[];
  _count: {
    votes: number;
  };
};

export interface Category {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
  userId?: string | null;
  _count?: {
    habits: number;
  };
};