import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from '../constants';

// Check if we have valid Firebase config
const hasValidConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== '');

// Placeholder instances for SSR/build time
const placeholderApp = {} as FirebaseApp;
const placeholderAuth = {} as Auth;
const placeholderDb = {} as Firestore;
const placeholderStorage = {} as FirebaseStorage;

// Initialize Firebase app only on client-side with valid config
let app: FirebaseApp = placeholderApp;
let auth: Auth = placeholderAuth;
let db: Firestore = placeholderDb;
let storage: FirebaseStorage = placeholderStorage;
let initialized = false;

function initializeFirebase() {
    if (initialized || typeof window === 'undefined' || !hasValidConfig) {
        return;
    }

    try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        initialized = true;

        // Connect to emulators in development
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
            connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
            connectFirestoreEmulator(db, 'localhost', 8080);
            connectStorageEmulator(storage, 'localhost', 9199);
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Initialize on first import (client-side only)
if (typeof window !== 'undefined') {
    initializeFirebase();
}

// Helper to check if Firebase is ready
export function isFirebaseReady(): boolean {
    return initialized && hasValidConfig;
}

// Export instances
export { app, auth, db, storage, initializeFirebase };
