'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Edit,
  Flame,
  Heart,
  Loader2,
  MapPin,
  MoreHorizontal,
  Settings,
  Star,
  Trophy,
  User,
  UserMinus,
  UserPlus,
  Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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

interface ProfilePageProps {
  userId?: string // If not provided, shows current user's profile
}

export default function ProfilePage({ userId }: ProfilePageProps) {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [karmaData, setKarmaData] = useState<KarmaData | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [atoms, setAtoms] = useState<Atom[]>([])
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  
  const [loading, setLoading] = useState(true)
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [processingFollow, setProcessingFollow] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('habits')
  
  const router = useRouter()
  const isOwnProfile = !userId || userId === currentUser?.id

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
        return data.user
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
    return null
  }

  const fetchUserProfile = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return data.user
      } else if (response.status === 404) {
        toast.error('User not found')
        router.push('/feed')
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      toast.error('Failed to load profile')
    }
    return null
  }

  const fetchKarmaData = async () => {
    try {
      const response = await fetch('/api/tracker/karma', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setKarmaData(data)
      }
    } catch (error) {
      console.error('Failed to fetch karma data:', error)
    }
  }

  const fetchUserHabits = async (id: string) => {
    try {
      const response = await fetch(`/api/habits/?page=1&limit=50`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json();
        setHabits(data.habits || []);
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    }
  }

  const fetchUserAtoms = async () => {
    try {
      const response = await fetch('/api/feed/', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json();
        console.log("Atoms: ", data);
        const feedAtoms = data.atoms || []
        // Filter atoms by user if viewing someone else's profile
        const userAtoms = isOwnProfile 
          ? feedAtoms.filter((atom: Atom) => atom.user.id === currentUser?.id)
          : feedAtoms.filter((atom: Atom) => atom.user.id === userId)
        setAtoms(userAtoms)
      }
    } catch (error) {
      console.error('Failed to fetch atoms:', error)
    }
  }

  const fetchFollowers = async (id: string) => {
    if (followersLoading) return
    setFollowersLoading(true)
    
    try {
      const response = await fetch(`/api/users/${id}/followers?page=1&limit=100`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setFollowers(data.followers || [])
      }
    } catch (error) {
      console.error('Failed to fetch followers:', error)
    } finally {
      setFollowersLoading(false)
    }
  }

  const fetchFollowing = async (id: string) => {
    if (followingLoading) return
    setFollowingLoading(true)
    
    try {
      const response = await fetch(`/api/users/${id}/following?page=1&limit=100`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setFollowing(data.following || [])
        
        // Check if current user is following this profile user
        if (!isOwnProfile && currentUser) {
          const isCurrentUserFollowing = (data.following || []).some(
            (followedUser: User) => followedUser.id === currentUser.id
          )
          setIsFollowing(isCurrentUserFollowing)
        }
      }
    } catch (error) {
      console.error('Failed to fetch following:', error)
    } finally {
      setFollowingLoading(false)
    }
  }

  const checkFollowStatus = async (targetUserId: string) => {
    if (!currentUser || isOwnProfile) return
    
    try {
      const response = await fetch(`/api/users/${currentUser.id}/following`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        const following = data.following || []
        const isFollowingUser = following.some((user: User) => user.id === targetUserId)
        setIsFollowing(isFollowingUser)
      }
    } catch (error) {
      console.error('Failed to check follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!user || isOwnProfile || processingFollow) return

    setProcessingFollow(true)

    try {
      const endpoint = `/api/users/${user.id}/${isFollowing ? 'unfollow' : 'follow'}`
      const method = isFollowing ? 'DELETE' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: getAuthHeaders()
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        // Update follower count
        setUser(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            followers: isFollowing 
              ? prev._count.followers - 1 
              : prev._count.followers + 1
          }
        } : null)
        
        toast.success(isFollowing ? 'Unfollowed user' : 'Following user')
      } else {
        toast.error(isFollowing ? 'Failed to unfollow' : 'Failed to follow')
      }
    } catch (error) {
      console.error('Follow error:', error)
      toast.error('Network error')
    } finally {
      setProcessingFollow(false)
    }
  }

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  useEffect(() => {
    const initializeProfile = async () => {
      setLoading(true)
      
      try {
        const currentUserData = await fetchCurrentUser()
        
        if (!currentUserData) {
          router.push('/auth')
          return
        }

        const profileUserId = userId || currentUserData.id
        
        if (profileUserId === currentUserData.id) {
          // Own profile - use current user data and fetch additional info
          setUser({
            ...currentUserData,
            _count: {
              followers: 0,
              following: 0,
              habits: 0,
              atoms: 0
            }
          })
          await fetchKarmaData()
        } else {
          // Other user's profile
          await fetchUserProfile(profileUserId)
          await checkFollowStatus(profileUserId)
        }
        
        // Fetch additional data
        await Promise.all([
          fetchUserHabits(profileUserId),
          fetchUserAtoms(),
          fetchFollowers(profileUserId),
          fetchFollowing(profileUserId)
        ])
        
      } catch (error) {
        console.error('Profile initialization error:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    initializeProfile()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
            <p className="text-gray-600">The user you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar */}
              <div className="flex justify-center md:justify-start">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={user.profileImage || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-4xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-2xl font-bold">{user.username}</h1>
                  
                  <div className="flex gap-2 justify-center md:justify-start">
                    {isOwnProfile ? (
                      <>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant={isFollowing ? "outline" : "default"}
                          size="sm"
                          onClick={handleFollow}
                          disabled={processingFollow}
                        >
                          {processingFollow ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : isFollowing ? (
                            <UserMinus className="h-4 w-4 mr-2" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                          )}
                          {isFollowing ? 'Unfollow' : 'Follow'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mb-4 justify-center md:justify-start">
                  <div className="text-center">
                    <div className="font-bold text-lg">{habits.length}</div>
                    <div className="text-sm text-gray-600">habits</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{user._count.followers}</div>
                    <div className="text-sm text-gray-600">followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{user._count.following}</div>
                    <div className="text-sm text-gray-600">following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{atoms.length}</div>
                    <div className="text-sm text-gray-600">atoms</div>
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-gray-800 mb-3">{user.bio}</p>
                )}

                {/* Join date */}
                <div className="flex items-center gap-1 text-sm text-gray-500 justify-center md:justify-start">
                  <Calendar className="h-4 w-4" />
                  Joined {formatJoinDate(user.createdAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards - Only for own profile */}
        {isOwnProfile && karmaData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                <div className="font-bold text-lg">{user.totalKarma}</div>
                <div className="text-xs text-gray-600">Total Karma</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <div className="font-bold text-lg">{karmaData.karma.daily}</div>
                <div className="text-xs text-gray-600">Daily Karma</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Flame className="h-6 w-6 mx-auto text-red-500 mb-2" />
                <div className="font-bold text-lg">{karmaData.karma.streak}</div>
                <div className="text-xs text-gray-600">Streak</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="h-6 w-6 mx-auto text-pink-500 mb-2" />
                <div className="font-bold text-lg">{karmaData.karma.socialEngagement}</div>
                <div className="text-xs text-gray-600">Social</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="atoms">Atoms</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          {/* Habits Tab */}
          <TabsContent value="habits" className="mt-6">
            <div className="grid gap-4">
              {habits.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No habits yet</h3>
                    <p className="text-gray-600">
                      {isOwnProfile ? 'Start building good habits!' : `${user.username} hasn't created any habits yet.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                habits.map((habit) => (
                  <Card key={habit.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{habit.category.icon}</div>
                          <div>
                            <h3 className="font-semibold">{habit.title}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {habit.category.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {habit.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {habit.occurrence}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {habit.slot}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{habit._count.completions}</div>
                          <div className="text-sm text-gray-600">completions</div>
                        </div>
                      </div>
                      {habit.description && (
                        <p className="text-gray-600 mt-2 text-sm">{habit.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Atoms Tab */}
          <TabsContent value="atoms" className="mt-6">
            <div className="grid gap-4">
              {atoms.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No atoms yet</h3>
                    <p className="text-gray-600">
                      {isOwnProfile ? 'Complete some habits and share your progress!' : `${user.username} hasn't shared any atoms yet.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                atoms.map((atom) => (
                  <Card key={atom.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {atom.habit.title}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {atom.habit.category.name}
                        </Badge>
                        <span className="text-xs text-gray-500 ml-auto">
                          {formatTimeAgo(atom.completionTime)}
                        </span>
                      </div>
                      
                      {atom.caption && (
                        <p className="text-gray-800 mb-3">{atom.caption}</p>
                      )}
                      
                      {atom.image && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          <img
                            src={atom.image}
                            alt="Habit progress"
                            className="w-full h-auto max-h-64 object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600">
                        {atom._count.votes} votes
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Followers Tab */}
          <TabsContent value="followers" className="mt-6">
            <Card>
              <CardContent className="p-4">
                {followersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : followers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No followers yet</h3>
                    <p className="text-gray-600">
                      {isOwnProfile ? 'Share great content to gain followers!' : `${user.username} doesn't have any followers yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followers.map((follower) => (
                      <div key={follower.id} className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={follower.profileImage || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {follower.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold">{follower.username}</div>
                          <div className="text-sm text-gray-600">{follower.totalKarma} karma</div>
                        </div>
                        <Button size="sm" variant="outline">
                          <User className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="mt-6">
            <Card>
              <CardContent className="p-4">
                {followingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : following.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Not following anyone</h3>
                    <p className="text-gray-600">
                      {isOwnProfile ? 'Find some users to follow!' : `${user.username} isn't following anyone yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {following.map((followedUser) => (
                      <div key={followedUser.id} className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={followedUser.profileImage || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {followedUser.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold">{followedUser.username}</div>
                          <div className="text-sm text-gray-600">{followedUser.totalKarma} karma</div>
                        </div>
                        <Button size="sm" variant="outline">
                          <User className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}