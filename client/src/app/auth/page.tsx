'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { useAuth } from '@/providers/providers';
import { toast } from 'sonner';

export default function Sign() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const { setUser } = useAuth()

    const handleLogin = async () => {
        try {
            const res = await fetch(`/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const data = await res.json()
            if (res.ok) {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                console.log("Response Data:", data);
                setUser(data.user);

                toast.success('Login successful!');
                if (!data.user.hasCompletedOnboarding) {
                    router.push('/onboarding')
                } else {
                    router.push('/dashboard')
                }
            } else {
                toast.error(data.message || 'Login failed');
            }
        } catch {
            toast.error('Something went wrong');
        }
    }

    const handleRegister = async () => {
        try {
            const res = await fetch(`/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                console.log("Response Data:", data);
                setUser(data.user);

                toast.success('User registered successfully!');
                if (!data.user.hasCompletedOnboarding) {
                    router.push('/onboarding')
                } else {
                    router.push('/dashboard')
                }
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch {
            alert('Something went wrong');
        }
    }

    return (
        <div className="flex min-h-screen w-full bg-gray-900 text-white">
            {/* Left side (Tabs) */}
            <div className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <Tabs defaultValue="login">
                        <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>

                        {/* Login */}
                        <TabsContent value="login">
                            <Card className="bg-gray-800 border-gray-700">
                                <CardHeader>
                                    <CardTitle>Log in</CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Welcome back! Please enter your details.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="login-email">Email</Label>
                                        <Input
                                            id="login-email"
                                            placeholder="exp.club@gmail.com"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="bg-gray-700 border-gray-600 text-white"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="login-password">Password</Label>
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder='********'
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="bg-gray-700 border-gray-600 text-white"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={handleLogin}>
                                        Login
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* Register */}
                        <TabsContent value="register">
                            <Card className="bg-gray-800 border-gray-700">
                                <CardHeader>
                                    <CardTitle>Register</CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Create your account.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="register-email">Email</Label>
                                        <Input
                                            id="register-email"
                                            type="email"
                                            placeholder="exp.club@gmail.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="bg-gray-700 border-gray-600 text-white"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="register-username">Username</Label>
                                        <Input
                                            id="register-username"
                                            type="text"
                                            placeholder="Random User"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            className="bg-gray-700 border-gray-600 text-white"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="register-password">Password</Label>
                                        <Input
                                            id="register-password"
                                            type="password"
                                            placeholder="********"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="bg-gray-700 border-gray-600 text-white"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={handleRegister}>
                                        Register
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Right side (Image) - hidden on mobile */}
            <div className="hidden md:flex flex-1 relative">
                <Image
                    src="/auth-bg.png"
                    alt="Auth background"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
        </div>
    )
}
