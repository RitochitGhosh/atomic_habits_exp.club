'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Atom, Category, CurrentUser, UserType } from '@/constants/types';
import { getAuthHeaders } from '@/utils/getHeader';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Filter,
  Loader2,
  MoreHorizontal,
  Search,
  UserMinus,
  UserPlus,
  X
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';




export default function FeedPage() {
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [processingFollow, setProcessingFollow] = useState<Set<string>>(new Set());
  const [processingVote, setProcessingVote] = useState<Set<string>>(new Set());
  const [userVotes, setUserVotes] = useState<Map<string, 'upvote' | 'downvote' | null>>(new Map());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const router = useRouter();

  
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);

        console.log("Current User: ", data.user);
        return data.user;
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
    return null;
  }

  const fetchFollowingUsers = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/following`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json();
        console.log("Data: ", data);
        const following = data.following || [];
        const followingIds = new Set<string>(following.map((user: UserType) => user.id));
        setFollowingUsers(followingIds)
      }
    } catch (error) {
      console.error('Failed to fetch following users:', error)
    }
  }

  const fetchFeed = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feed/', {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth')
          return
        }
        toast.error('Failed to load feed')
        return
      }

      const data = await response.json()
      const feedData = data.atoms || []
      setAtoms(Array.isArray(feedData) ? feedData : [])

      const votes = new Map()
      feedData.forEach((atom: Atom) => {
        const userVote = atom.votes.find(v => true)
        votes.set(atom.id, userVote?.voteType || null)
      })
      setUserVotes(votes)
    } catch (error) {
      console.error('Feed fetch error:', error)
      setAtoms([])
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories/', {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const categoriesData = data.categories || []
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      }
    } catch (error) {
      console.error('Categories fetch error:', error)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(`/api/users/search/${encodeURIComponent(query)}`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const users = data.users || []
        // Filter out users that are already being followed and current user
        const unfollowedUsers = users.filter((user: UserType) => 
          !followingUsers.has(user.id) && user.id !== currentUser?.id
        )
        setSearchResults(unfollowedUsers)
        setShowSearchResults(true)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setShowSearchResults(false)
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      const user = await fetchCurrentUser()
      if (user) {
        await fetchFollowingUsers(user.id)
      }
      await fetchFeed()
      await fetchCategories()
    }
    
    initializeData()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, followingUsers, currentUser])

  const handleVote = async (atomId: string, voteType: 'upvote' | 'downvote') => {
    if (processingVote.has(atomId)) return

    setProcessingVote(prev => new Set(prev).add(atomId))

    try {
      const currentVote = userVotes.get(atomId)

      if (currentVote === voteType) {
        const response = await fetch(`/api/feed/${atomId}/vote`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })

        if (response.ok) {
          setUserVotes(prev => new Map(prev).set(atomId, null))
          setAtoms(prev => prev.map(a =>
            a.id === atomId
              ? {
                ...a,
                _count: {
                  ...a._count,
                  votes: Math.max(0, a._count.votes - 1)
                }
              }
              : a
          ))
          toast.success('Vote removed')
        }
      } else {
        const response = await fetch(`/api/feed/${atomId}/vote`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ voteType })
        })

        if (response.ok) {
          setUserVotes(prev => new Map(prev).set(atomId, voteType))
          setAtoms(prev => prev.map(a =>
            a.id === atomId
              ? {
                ...a,
                _count: {
                  ...a._count,
                  votes: currentVote ? a._count.votes : a._count.votes + 1
                }
              }
              : a
          ))
          toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'}!`)
        } else {
          toast.error('Failed to vote')
        }
      }
    } catch (error) {
      console.error('Vote error:', error)
      toast.error('Failed to vote')
    } finally {
      setProcessingVote(prev => {
        const newSet = new Set(prev)
        newSet.delete(atomId)
        return newSet
      })
    }
  }

  const handleFollow = async (userId: string) => {
    if (processingFollow.has(userId)) return

    setProcessingFollow(prev => new Set(prev).add(userId))

    try {
      const isFollowing = followingUsers.has(userId)
      const endpoint = `/api/users/${userId}/${isFollowing ? 'unfollow' : 'follow'}`
      const method = isFollowing ? 'DELETE' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: getAuthHeaders()
      })

      if (response.ok) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev)
          if (isFollowing) {
            newSet.delete(userId)
            toast.success('Unfollowed user')
          } else {
            newSet.add(userId)
            toast.success('Following user')
          }
          return newSet
        })
        
        // Remove from search results if we just followed them
        if (!isFollowing) {
          setSearchResults(prev => prev.filter(user => user.id !== userId))
        }
      } else {
        toast.error(isFollowing ? 'Failed to unfollow' : 'Failed to follow')
      }
    } catch (error) {
      console.error('Follow error:', error)
      toast.error('Network error')
    } finally {
      setProcessingFollow(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
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

  const filteredAtoms = selectedCategory
    ? atoms.filter(atom => atom.habit.category.name === selectedCategory)
    : atoms

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* User Search */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <h3 className="font-semibold">Find Users</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setShowSearchResults(false)
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
                {searchLoading && (
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              
              {showSearchResults && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {searchQuery ? 'No unfollowed users found' : 'Start typing to search'}
                    </p>
                  ) : (
                    searchResults.map(user => (
                      <div key={user.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImage || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.totalKarma} karma</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFollow(user.id)}
                          disabled={processingFollow.has(user.id)}
                          className="h-7 px-2"
                        >
                          {processingFollow.has(user.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserPlus className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories Filter */}
          {categories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <h3 className="font-semibold">Categories</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <Button
                  variant={!selectedCategory ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Button>
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.name ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.name ? null : category.name
                    )}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                    {category._count?.habits !== undefined && (
                      <span className="ml-auto text-xs text-gray-500">
                        {category._count.habits}
                      </span>
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Feed */}
        <div className="lg:col-span-3 space-y-6">
          {filteredAtoms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Calendar className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No atoms yet</h3>
                <p className="text-gray-600">
                  {selectedCategory
                    ? `No atoms found in ${selectedCategory} category for your feed, try to follow more users.`
                    : 'Follow some users to see their habit atoms in your feed'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Use the search bar on the left to find and follow users
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAtoms.map((atom) => (
              <Card key={atom.id} className="overflow-hidden">
                {/* Post Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={atom.user.profileImage || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                          {atom.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-sm">{atom.user.username}</h4>
                          <span className="text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(atom.completionTime)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {atom.habit.title}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {atom.habit.category.name}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {atom.habitType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Only show follow/unfollow buttons if it's not the current user */}
                      {currentUser && atom.user.id !== currentUser.id && (
                        <>
                          {!followingUsers.has(atom.user.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFollow(atom.user.id)}
                              disabled={processingFollow.has(atom.user.id)}
                            >
                              {processingFollow.has(atom.user.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <UserPlus className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          {followingUsers.has(atom.user.id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFollow(atom.user.id)}
                              disabled={processingFollow.has(atom.user.id)}
                            >
                              {processingFollow.has(atom.user.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <UserMinus className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Post Content */}
                <CardContent className="pt-0">
                  {atom.caption && (
                    <p className="text-gray-800 mb-4 leading-relaxed">
                      {atom.caption}
                    </p>
                  )}

                  {atom.image && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={atom.image}
                        width={600}
                        height={400}
                        alt="Habit progress"
                        className="w-full h-auto max-h-96 object-cover"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant={userVotes.get(atom.id) === 'upvote' ? 'default' : 'ghost'}
                          onClick={() => handleVote(atom.id, 'upvote')}
                          disabled={processingVote.has(atom.id)}
                          className="h-8 px-2"
                        >
                          <ArrowUp className="h-3 w-3 mr-1" />
                        </Button>
                        <Button
                          size="sm"
                          variant={userVotes.get(atom.id) === 'downvote' ? 'destructive' : 'ghost'}
                          onClick={() => handleVote(atom.id, 'downvote')}
                          disabled={processingVote.has(atom.id)}
                          className="h-8 px-2"
                        >
                          <ArrowDown className="h-3 w-3 mr-1" />
                        </Button>
                        <span className="text-sm text-gray-600 ml-2">
                          {atom._count.votes} votes
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}