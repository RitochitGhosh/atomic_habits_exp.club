'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    UserPlus,
    Check,
    Loader2,
    X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/providers/providers';


interface User {
    id: string
    username: string
    profileImage?: string
    bio?: string
    totalKarma: number
    // The _count object is now optional to prevent errors
    _count?: {
        followers: number
        following: number
    }
}

export default function OnboardingPage() {
    const { user, isLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/auth');
                return;
            }

            if (user.hasCompletedOnboarding) {
                router.push('/dashboard');
                return;
            }
        }
    }, [user, isLoading, router]);

    const searchUsers = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            
            const data = await res.json();
            setSearchResults(data.users || []); 

        } catch (err) {
            console.error(err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value
        setSearchQuery(query)
        searchUsers(query)
    }

    const toggleUserSelection = (user: User) => {
        setSelectedUsers((prev) => {
            const isSelected = prev.some((u) => u.id === user.id)
            return isSelected ? prev.filter((u) => u.id !== user.id) : [...prev, user]
        })
    }

    const completeOnboarding = async () => {
        if (selectedUsers.length < 3) return

        setIsCompleting(true)
        try {
            await fetch('/api/users/complete-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify({ followingIds: selectedUsers.map((u) => u.id) }),
            })

            router.push('/dashboard')
        } catch (err) {
            console.error(err)
        } finally {
            setIsCompleting(false)
        }
    }

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-xl font-bold">
                        Atomic <span className="text-blue-600">Habits</span>
                    </div>
                    <div className="text-sm text-gray-500">Step {step} of 2</div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Setup Progress</span>
                        <span className="text-sm text-gray-500">
                            {step === 1 ? '25%' : '50%'} Complete
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: step === 1 ? '25%' : '50%' }}
                        />
                    </div>
                </div>

                {/* Step 1 */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <UserPlus className="h-8 w-8 text-blue-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Welcome to Atomic Habits!
                            </h1>
                            <p className="text-lg text-gray-600 mb-8">
                                To get the most out of your habit tracking experience, we recommend following at least 3 users
                                to see their achievements and build a supportive community.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Why follow others?</h3>
                            <ul className="text-left space-y-3">
                                <li className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600">See inspiring habit completions in your feed</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600">Get motivated by others' progress</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600">Build accountability through community</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600">Discover new habits and ideas</span>
                                </li>
                            </ul>
                        </div>

                        <Button
                            onClick={() => setStep(2)}
                            size="lg"
                            className="px-8"
                        >
                            Let's Find People to Follow
                        </Button>
                    </motion.div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Find People to Follow
                            </h1>
                            <p className="text-lg text-gray-600">
                                Search for users and follow at least 3 people to complete your setup.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search for users..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="pl-10"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <Card className="p-4 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
                                <div className="space-y-3">
                                    {searchResults.map((userResult) => (
                                        <div
                                            key={userResult.id}
                                            className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedUsers.some(u => u.id === userResult.id)
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                : 'hover:bg-gray-100'
                                                }`}
                                            onClick={() => toggleUserSelection(userResult)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                   <Avatar>
                                                        <AvatarImage src={userResult.profileImage || ''} alt={userResult.username} />
                                                        <AvatarFallback>{userResult.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{userResult.username}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {/* --- FIX IS HERE --- */}
                                                            {userResult._count?.followers || 0} followers • {userResult.totalKarma} karma
                                                            {/* --- END FIX --- */}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedUsers.some(u => u.id === userResult.id) && (
                                                    <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Selected Users */}
                        {selectedUsers.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Selected Users <Badge variant="secondary">{selectedUsers.length}/3 minimum</Badge>
                                </h3>
                                <div className="space-y-2">
                                    {selectedUsers.map((selected) => (
                                        <Card
                                            key={selected.id}
                                            className="flex items-center justify-between bg-gray-50 p-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                 <Avatar className="w-8 h-8">
                                                    <AvatarImage src={selected.profileImage || ''} alt={selected.username} />
                                                    <AvatarFallback className="text-xs">{selected.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-sm text-gray-900">{selected.username}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-6 h-6"
                                                onClick={() => toggleUserSelection(selected)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between items-center">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={completeOnboarding}
                                disabled={selectedUsers.length < 3 || isCompleting}
                            >
                                {isCompleting ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                        Completing...
                                    </>
                                ) : (
                                    `Complete Setup (${selectedUsers.length}/3)`
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}