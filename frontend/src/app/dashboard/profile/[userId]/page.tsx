import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfilePageView from './ProfilePageView'

interface User {
  id: string
  username: string
  profileImage?: string | null
  totalKarma: number
  bio?: string | null
  createdAt: string
  _count: {
    followers: number
    following: number
    habits: number
    atoms: number
  }
}

interface CurrentUser {
  id: string
  username: string
  profileImage?: string | null
  totalKarma: number
  email: string
  hasCompletedOnboarding: boolean
  bio?: string | null
  createdAt: string
}

interface KarmaData {
  karma: {
    daily: number
    streak: number
    starsEarned: number
    streakBonus: number
    socialEngagement: number
  }
}

interface Habit {
  id: string
  title: string
  description?: string | null
  category: {
    id: string
    name: string
    icon: string
  }
  type: string
  occurrence: string
  slot: string
  startDate: string
  endDate?: string | null
  isActive: boolean
  _count: {
    completions: number
    atoms: number
  }
}

interface Atom {
  id: string
  image: string
  caption: string
  habitTitle: string
  habitType: string
  completionTime: string
  user: {
    id: string
    username: string
    profileImage?: string | null
    totalKarma: number
  }
  habit: {
    id: string
    title: string
    category: {
      name: string
      icon: string
    }
  }
  votes: Array<{
    voteType: 'upvote' | 'downvote'
  }>
  _count: {
    votes: number
  }
}

interface ProfilePageData {
  user: User
  currentUser: CurrentUser
  karmaData: KarmaData | null
  habits: Habit[]
  atoms: Atom[]
  followers: User[]
  following: User[]
  isFollowing: boolean
}

async function getAuthHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value
  
  return {
    'Authorization': `Bearer ${token || ''}`,
    'Content-Type': 'application/json'
  }
}

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: await getAuthHeaders(),
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.user
    }
  } catch (error) {
    console.error('Failed to fetch current user:', error)
  }
  return null
}

async function fetchUserProfile(id: string): Promise<User | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${id}`, {
      headers: await getAuthHeaders(),
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.user
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
  }
  return null
}

async function fetchKarmaData(): Promise<KarmaData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/tracker/karma`, {
      headers: await getAuthHeaders(),
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data
    }
  } catch (error) {
    console.error('Failed to fetch karma data:', error)
  }
  return null
}

async function fetchUserHabits(userId: string): Promise<Habit[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/habits/?page=1&limit=50&userId=${userId}`, {
      headers: await getAuthHeaders(),
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.habits || []
    }
  } catch (error) {
    console.error('Failed to fetch habits:', error)
  }
  return []
}

async function fetchUserAtoms(userId: string, currentUserId?: string): Promise<Atom[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/feed/`, {
      headers: await getAuthHeaders(),
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      const feedAtoms = data.atoms || []
      // Filter atoms by user
      const userAtoms = feedAtoms.filter((atom: Atom) => atom.user.id === userId)
      return userAtoms
    }
  } catch (error) {
    console.error('Failed to fetch atoms:', error)
  }
  return []
}

async function fetchFollowers(id: string): Promise<User[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${id}/followers?page=1&limit=100`, {
      headers: await getAuthHeaders(),
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.followers || []
    }
  } catch (error) {
    console.error('Failed to fetch followers:', error)
  }
  return []
}

async function fetchFollowing(id: string): Promise<User[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${id}/following?page=1&limit=100`, {
      headers: await getAuthHeaders(),
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.following || []
    }
  } catch (error) {
    console.error('Failed to fetch following:', error)
  }
  return []
}

async function checkFollowStatus(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${currentUserId}/following`, {
      headers: await getAuthHeaders(),
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      const following = data.following || []
      return following.some((user: User) => user.id === targetUserId)
    }
  } catch (error) {
    console.error('Failed to check follow status:', error)
  }
  return false
}

export default async function ProfilePage({ params }: { params: Promise<{ userId?: string }> }) {
  const { userId } = await params

  // Fetch current user first
  const currentUser = await fetchCurrentUser()
  
  if (!currentUser) {
    redirect('/auth')
  }

  const profileUserId = userId || currentUser.id
  const isOwnProfile = profileUserId === currentUser.id

  try {
    // Fetch all data in parallel
    const [
      profileUser,
      karmaData,
      habits,
      atoms,
      followers,
      following
    ] = await Promise.all([
      isOwnProfile ? null : fetchUserProfile(profileUserId),
      isOwnProfile ? fetchKarmaData() : null,
      fetchUserHabits(profileUserId),
      fetchUserAtoms(profileUserId, currentUser.id),
      fetchFollowers(profileUserId),
      fetchFollowing(profileUserId)
    ])

    // Use currentUser data for own profile, profileUser for others
    const user: User = isOwnProfile ? {
      id: currentUser.id,
      username: currentUser.username,
      profileImage: currentUser.profileImage,
      totalKarma: currentUser.totalKarma,
      bio: currentUser.bio || null,
      createdAt: currentUser.createdAt,
      _count: {
        followers: followers.length,
        following: following.length,
        habits: habits.length,
        atoms: atoms.length
      }
    } : {
      ...profileUser!,
      _count: {
        followers: followers.length,
        following: following.length,
        habits: habits.length,
        atoms: atoms.length
      }
    }

    // Check follow status if viewing someone else's profile
    const isFollowing = !isOwnProfile && currentUser 
      ? await checkFollowStatus(currentUser.id, profileUserId)
      : false

    return <ProfilePageView 
      user={user}
      currentUser={currentUser}
      karmaData={karmaData}
      habits={habits}
      atoms={atoms}
      followers={followers}
      following={following}
      isFollowing={isFollowing}
    />
    
  } catch (error) {
    console.error('Profile page error:', error)
    redirect('/feed')
  }
}