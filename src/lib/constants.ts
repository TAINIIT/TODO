// Firebase configuration
// Replace these with your actual Firebase config values
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  // Use Firebase's default auth domain to avoid authorization issues
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// App constants
export const APP_CONFIG = {
  allowedEmailDomains: ['tsb.com.vn', 'company.com', 'gmail.com'],
  defaultOrgId: 'default-org', // Will be replaced with generated ID on first setup
  appName: 'Work Assignment',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxAttachments: 10,
  paginationLimit: 20,
};

// Task status configuration
export const TASK_STATUSES = {
  backlog: { label: 'Backlog', color: 'gray', order: 0 },
  in_progress: { label: 'In Progress', color: 'blue', order: 1 },
  blocked: { label: 'Blocked', color: 'red', order: 2 },
  done: { label: 'Done', color: 'green', order: 3 },
} as const;

export const TASK_STATUS_TRANSITIONS: Record<string, string[]> = {
  backlog: ['in_progress', 'done'],
  in_progress: ['blocked', 'done'],
  blocked: ['in_progress'],
  done: [],
};

// Priority configuration
export const TASK_PRIORITIES = {
  low: { label: 'Low', color: 'slate', order: 0 },
  medium: { label: 'Medium', color: 'yellow', order: 1 },
  high: { label: 'High', color: 'orange', order: 2 },
  urgent: { label: 'Urgent', color: 'red', order: 3 },
} as const;

// User roles
export const USER_ROLES = {
  admin: { label: 'Admin', level: 3 },
  manager: { label: 'Manager', level: 2 },
  employee: { label: 'Employee', level: 1 },
} as const;

// Project statuses
export const PROJECT_STATUSES = {
  active: { label: 'Active', color: 'green' },
  completed: { label: 'Completed', color: 'blue' },
  archived: { label: 'Archived', color: 'gray' },
} as const;
