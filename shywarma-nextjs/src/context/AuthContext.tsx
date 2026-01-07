"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getUser, onAuthStateChange, signOut as authSignOut } from '@/lib/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial user
        getUser().then((u) => {
            setUser(u);
            setLoading(false);
        });

        // Subscribe to auth changes (may be null if not configured)
        const subscription = onAuthStateChange((u) => {
            setUser(u);
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await authSignOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
