import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    onAuthStateChanged,
    User as FirebaseUser,
    ActionCodeSettings,
    Auth,
} from 'firebase/auth';
import { auth } from './config';
import { APP_CONFIG } from '../constants';
import { isValidEmailDomain } from '../utils/helpers';

// Helper to get auth instance with null check
function getAuth(): Auth {
    if (!auth) {
        throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
    }
    return auth;
}

/**
 * Validate email domain before registration
 */
export function validateEmailDomain(email: string): boolean {
    return isValidEmailDomain(email, APP_CONFIG.allowedEmailDomains);
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, displayName: string) {
    if (!validateEmailDomain(email)) {
        throw new Error(`Email must be from one of the allowed domains: ${APP_CONFIG.allowedEmailDomains.join(', ')}`);
    }

    const userCredential = await createUserWithEmailAndPassword(getAuth(), email, password);

    // Update display name
    await updateProfile(userCredential.user, { displayName });

    // Send verification email
    await sendEmailVerification(userCredential.user);

    return userCredential.user;
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
    return userCredential.user;
}

/**
 * Sign out current user
 */
export async function signOut() {
    await firebaseSignOut(getAuth());
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
    const actionCodeSettings: ActionCodeSettings = {
        url: typeof window !== 'undefined' ? `${window.location.origin}/login` : '',
        handleCodeInApp: false,
    };
    await sendPasswordResetEmail(getAuth(), email, actionCodeSettings);
}

/**
 * Send invite email with password set link
 * Admin creates user in Firestore first, then calls this to invite
 */
export async function sendInviteEmail(email: string) {
    const actionCodeSettings: ActionCodeSettings = {
        url: typeof window !== 'undefined' ? `${window.location.origin}/set-password` : '',
        handleCodeInApp: false,
    };
    await sendPasswordResetEmail(getAuth(), email, actionCodeSettings);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
    const authInstance = auth;
    if (!authInstance) {
        // Return a no-op unsubscribe if auth is not ready
        console.warn('Firebase Auth not initialized');
        return () => { };
    }
    return onAuthStateChanged(authInstance, callback);
}

/**
 * Get current user
 */
export function getCurrentUser(): FirebaseUser | null {
    return auth?.currentUser ?? null;
}

/**
 * Get current user's ID token
 */
export async function getIdToken(): Promise<string | null> {
    const user = auth?.currentUser;
    if (!user) return null;
    return user.getIdToken();
}

/**
 * Check if user email is verified
 */
export function isEmailVerified(): boolean {
    return auth?.currentUser?.emailVerified ?? false;
}

export { auth };
