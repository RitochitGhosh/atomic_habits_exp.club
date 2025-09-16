'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
  bio?: string;
  totalKarma: number;
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  socket: Socket | null;
  isLoading: boolean;
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a Provider');
  }
  return context;
}

// Provider component
export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch(`/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch user');

        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Auth fetch error:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // On user change: handle socket connection
  useEffect(() => {
    let newSocket: Socket | null = null;

    if (user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
          auth: { token },
        });

        newSocket.on('connect', () => console.log('Connected to server'));
        newSocket.on('disconnect', () => console.log('Disconnected from server'));

        setSocket(newSocket);
      }
    }

    return () => {
      if (newSocket) {
        newSocket.close();
        setSocket(null);
      }
    };
  }, [user]);

  const value: AuthContextType = { user, setUser, socket, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
