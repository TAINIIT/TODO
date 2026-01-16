'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, signOut as firebaseSignOut } from '@/lib/firebase/auth';
import { getUserById, updateUser, createUser } from '@/lib/firebase/firestore';
import { getDocumentViaRest, setDocumentViaRest } from '@/lib/firebase/firestore-rest';
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
        console.log('Loading user data for:', fbUser.email);

        try {
            // Wait a bit for auth token to propagate
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get fresh ID token
            const idToken = await fbUser.getIdToken(true);
            console.log('Got fresh ID token');

            let userData: User | null = null;
            let usedRestApi = false;

            // First try SDK
            try {
                console.log('Trying Firestore SDK...');
                userData = await getUserById(APP_CONFIG.defaultOrgId, fbUser.uid);
                console.log('Firestore SDK success:', userData);
            } catch (sdkErr) {
                const errorMessage = (sdkErr as Error).message || '';
                console.warn('Firestore SDK failed:', errorMessage);

                // If offline error, try REST API fallback
                if (errorMessage.includes('offline') || errorMessage.includes('unavailable')) {
                    console.log('Falling back to Firestore REST API...');
                    try {
                        const restData = await getDocumentViaRest(
                            `orgs/${APP_CONFIG.defaultOrgId}/users`,
                            fbUser.uid,
                            idToken
                        );
                        if (restData) {
                            userData = restData as unknown as User;
                            usedRestApi = true;
                            console.log('REST API success:', userData);
                        }
                    } catch (restErr) {
                        console.error('REST API also failed:', restErr);
                        throw restErr;
                    }
                } else {
                    throw sdkErr;
                }
            }

            // Auto-create user document if it doesn't exist
            if (!userData && fbUser.email) {
                console.log('Creating new user document for:', fbUser.email);
                const newUserData = {
                    orgId: APP_CONFIG.defaultOrgId,
                    email: fbUser.email.toLowerCase(),
                    displayName: fbUser.displayName || fbUser.email.split('@')[0],
                    role: 'employee',
                    status: 'active',
                    managedTeamIds: [],
                    managedProjectIds: [],
                    teamIds: [],
                    projectIds: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: fbUser.uid,
                };

                try {
                    // Try SDK first for create
                    userData = await createUser(
                        APP_CONFIG.defaultOrgId,
                        fbUser.uid,
                        {
                            email: fbUser.email!,
                            displayName: newUserData.displayName,
                            role: 'employee',
                            teamIds: [],
                            projectIds: [],
                        },
                        fbUser.uid
                    );
                    await updateUser(APP_CONFIG.defaultOrgId, fbUser.uid, {
                        status: 'active',
                        lastLoginAt: Timestamp.now(),
                    });
                    userData.status = 'active';
                    console.log('User created via SDK:', userData);
                } catch {
                    // Fallback to REST API for create
                    console.log('SDK create failed, trying REST API...');
                    const restResult = await setDocumentViaRest(
                        `orgs/${APP_CONFIG.defaultOrgId}/users`,
                        fbUser.uid,
                        newUserData,
                        idToken
                    );
                    userData = restResult as unknown as User;
                    usedRestApi = true;
                    console.log('User created via REST API:', userData);
                }
            }

            if (userData) {
                // Check if user is disabled
                if (userData.status === 'disabled') {
                    setError('Your account has been disabled. Please contact an administrator.');
                    await firebaseSignOut();
                    setUser(null);
                    return;
                }

                // Update last login (fire and forget, use REST if SDK failed before)
                if (!usedRestApi) {
                    updateUser(APP_CONFIG.defaultOrgId, fbUser.uid, {
                        lastLoginAt: Timestamp.now(),
                    }).catch(err => console.warn('Failed to update last login:', err));
                }

                const appUser: AppUser = {
                    ...userData,
                    authUser: {
                        uid: fbUser.uid,
                        email: fbUser.email,
                        displayName: fbUser.displayName,
                        photoURL: fbUser.photoURL,
                    },
                };

                console.log('Setting user:', appUser);
                setUser(appUser);
                setError(null);
            } else {
                console.log('No user data found, setting user to null');
                setUser(null);
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            const errorMessage = (err as Error).message || '';

            if (errorMessage.includes('offline') || errorMessage.includes('unavailable')) {
                setError('Unable to connect to server. Please check your internet connection and try again.');
            } else if (errorMessage.includes('permission')) {
                setError('Permission denied. Please contact administrator.');
            } else {
                setError('Failed to load user data. Please try again.');
            }
            setUser(null);
        }
    }, []);

    useEffect(() => {
        console.log('Setting up auth listener...');

        const unsubscribe = onAuthChange(async (fbUser) => {
            console.log('Auth state changed:', fbUser?.email || 'No user');
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
