'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, signOut as firebaseSignOut } from '@/lib/firebase/auth';
import { getUserById, updateUser } from '@/lib/firebase/firestore';
import { APP_CONFIG } from '@/lib/constants';
import type { User, AppUser } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType {
    user: AppUser | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    error: string | null;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUserData = useCallback(async (fbUser: FirebaseUser) => {
        try {
            const userData = await getUserById(APP_CONFIG.defaultOrgId, fbUser.uid);

            if (userData) {
                // Check if user is disabled
                if (userData.status === 'disabled') {
                    setError('Your account has been disabled. Please contact an administrator.');
                    await firebaseSignOut();
                    setUser(null);
                    return;
                }

                // Update last login
                await updateUser(APP_CONFIG.defaultOrgId, fbUser.uid, {
                    lastLoginAt: Timestamp.now(),
                });

                setUser({
                    ...userData,
                    authUser: {
                        uid: fbUser.uid,
                        email: fbUser.email,
                        displayName: fbUser.displayName,
                        photoURL: fbUser.photoURL,
                    },
                });
                setError(null);
            } else {
                // User exists in Firebase Auth but not in Firestore
                // This could happen during registration flow
                setUser(null);
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            setError('Failed to load user data');
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                await loadUserData(fbUser);
            } else {
                setUser(null);
                setError(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [loadUserData]);

    const signOut = async () => {
        try {
            await firebaseSignOut();
            setUser(null);
            setFirebaseUser(null);
        } catch (err) {
            console.error('Sign out error:', err);
            throw err;
        }
    };

    const refreshUser = async () => {
        if (firebaseUser) {
            await loadUserData(firebaseUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, firebaseUser, loading, error, signOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper hooks
export function useUser() {
    const { user } = useAuth();
    return user;
}

export function useIsAdmin() {
    const user = useUser();
    return user?.role === 'admin';
}

export function useIsManager() {
    const user = useUser();
    return user?.role === 'manager' || user?.role === 'admin';
}

export function useCanManageTeam(teamId: string) {
    const user = useUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'manager') {
        return user.managedTeamIds.includes(teamId);
    }
    return false;
}

export function useCanManageProject(projectId: string) {
    const user = useUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'manager') {
        return user.managedProjectIds.includes(projectId);
    }
    return false;
}
