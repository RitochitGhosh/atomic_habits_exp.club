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
import { useState } from 'react'
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

interface ProfilePageViewProps {
  user: User
  currentUser: CurrentUser
  karmaData: KarmaData | null
  habits: Habit[]
  atoms: Atom[]
  followers: User[]
  following: User[]
  isFollowing: boolean
}

export default function ProfilePageView({
  user,
  currentUser,
  karmaData,
  habits,
  atoms,
  followers,
  following,
  isFollowing: initialIsFollowing
}: ProfilePageViewProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [processingFollow, setProcessingFollow] = useState(false)
  const [activeTab, setActiveTab] = useState('habits')
  const [userState, setUserState] = useState(user)
  
  const router = useRouter()
  const isOwnProfile = user.id === currentUser.id

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const handleFollow = async () => {
    if (isOwnProfile || processingFollow) return

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
        setUserState(prev => ({
          ...prev,
          _count: {
            ...prev._count,
            followers: isFollowing 
              ? prev._count.followers - 1 
              : prev._count.followers + 1
          }
        }))
        
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
                  <AvatarImage src={userState.profileImage || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-4xl font-bold">
                    {userState.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-2xl font-bold">{userState.username}</h1>
                  
                  <div className="flex gap-2 justify-center md:justify-start">
                    {isOwnProfile ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => toast.message('Edit profile not yet implemented!')}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toast.message('Settings not yet implemented!')}>
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
                    <div className="font-bold text-lg">{userState._count.followers}</div>
                    <div className="text-sm text-gray-600">followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{userState._count.following}</div>
                    <div className="text-sm text-gray-600">following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{atoms.length}</div>
                    <div className="text-sm text-gray-600">atoms</div>
                  </div>
                </div>

                {/* Bio */}
                {userState.bio && (
                  <p className="text-gray-800 mb-3">{userState.bio}</p>
                )}

                {/* Join date */}
                <div className="flex items-center gap-1 text-sm text-gray-500 justify-center md:justify-start">
                  <Calendar className="h-4 w-4" />
                  Joined {formatJoinDate(userState.createdAt)}
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
                <div className="font-bold text-lg">{userState.totalKarma}</div>
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
                      {isOwnProfile ? 'Start building good habits!' : `${userState.username} hasn't created any habits yet.`}
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
                      {isOwnProfile ? 'Complete some habits and share your progress!' : `${userState.username} hasn't shared any atoms yet.`}
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
                {followers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No followers yet</h3>
                    <p className="text-gray-600">
                      {isOwnProfile ? 'Share great content to gain followers!' : `${userState.username} doesn't have any followers yet.`}
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/profile/${follower.id}`)}
                        >
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
                {following.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Not following anyone</h3>
                    <p className="text-gray-600">
                      {isOwnProfile ? 'Find some users to follow!' : `${userState.username} isn't following anyone yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {following.map((followedUser) => (
                      <div key={followedUser.id} className="flex items-center space-x-3" onClick={() => router.push(`/dashboard/profile/${followedUser.id}`)}>
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/profile/${followedUser.id}`)}
                        >
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