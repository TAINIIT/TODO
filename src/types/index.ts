import { Timestamp } from 'firebase/firestore';

// Base types
export type UserRole = 'admin' | 'manager' | 'employee';
export type UserStatus = 'pending' | 'active' | 'disabled';
export type TaskStatus = 'backlog' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'active' | 'completed' | 'archived';

// Organization
export interface Organization {
    id: string;
    name: string;
    domain: string;
    settings: {
        allowedEmailDomains: string[];
        defaultRole: UserRole;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// User
export interface User {
    id: string;
    orgId: string;
    email: string;
    displayName: string;
    role: UserRole;
    status: UserStatus;
    managedTeamIds: string[];
    managedProjectIds: string[];
    teamIds: string[];
    projectIds: string[];
    avatarUrl?: string;
    reminderPreferences?: ReminderPreferences;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    lastLoginAt?: Timestamp;
}

// Team
export interface Team {
    id: string;
    orgId: string;
    name: string;
    description?: string;
    managerIds: string[];
    memberIds: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}

// Project
export interface Project {
    id: string;
    orgId: string;
    name: string;
    description?: string;
    teamId?: string;
    managerIds: string[];
    memberIds: string[];
    status: ProjectStatus;
    startDate?: Timestamp;
    endDate?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}

// Task
export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    completedAt?: Timestamp;
    completedBy?: string;
}

export interface AttachmentMeta {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
    uploadedBy: string;
    uploadedAt: Timestamp;
}

export interface Task {
    id: string;
    orgId: string;
    title: string;
    description?: string;
    projectId?: string;
    teamId?: string;
    assigneeIds: string[];
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: Timestamp;
    tags: string[];
    parentTaskId?: string;
    checklistItems?: ChecklistItem[];
    attachments?: AttachmentMeta[];
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    completedAt?: Timestamp;
}

// Comment
export interface Comment {
    id: string;
    orgId: string;
    taskId: string;
    content: string;
    authorId: string;
    mentions?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Activity Log (per task)
export type TaskActivityType =
    | 'status_change'
    | 'assignee_change'
    | 'priority_change'
    | 'due_date_change'
    | 'attachment_added'
    | 'attachment_removed'
    | 'comment_added'
    | 'checklist_updated';

export interface TaskActivityLog {
    id: string;
    orgId: string;
    taskId: string;
    actorId: string;
    actionType: TaskActivityType;
    previousValue?: unknown;
    newValue?: unknown;
    createdAt: Timestamp;
}

// Audit Log (org-wide)
export type AuditActionType =
    | 'user_created'
    | 'user_disabled'
    | 'user_role_changed'
    | 'team_created'
    | 'team_updated'
    | 'team_deleted'
    | 'project_created'
    | 'project_updated'
    | 'project_deleted'
    | 'task_created'
    | 'task_updated'
    | 'task_deleted';

export type AuditEntityType = 'user' | 'team' | 'project' | 'task';

export interface AuditLog {
    id: string;
    orgId: string;
    actorId: string;
    actorEmail: string;
    actionType: AuditActionType;
    entityType: AuditEntityType;
    entityId: string;
    entityName?: string;
    changes?: Record<string, { before: unknown; after: unknown }>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Timestamp;
}

// Reminder Settings
export interface ReminderPreferences {
    dailySummary: {
        enabled: boolean;
        time: string; // "08:00"
    };
    beforeDue: {
        hours36: boolean;
        hours1: boolean;
    };
    emailEnabled: boolean;
    inAppEnabled: boolean;
}

export interface ReminderSettings {
    id: string;
    orgId: string;
    scope: 'global' | 'user';
    userId?: string;
    dailySummary: {
        enabled: boolean;
        time: string;
    };
    beforeDue: {
        hours36: boolean;
        hours1: boolean;
    };
    emailEnabled: boolean;
    inAppEnabled: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Form types (for creating/updating)
export interface CreateUserData {
    email: string;
    displayName: string;
    role: UserRole;
    teamIds?: string[];
    projectIds?: string[];
}

export interface CreateTeamData {
    name: string;
    description?: string;
    managerIds: string[];
    memberIds: string[];
}

export interface CreateProjectData {
    name: string;
    description?: string;
    teamId?: string;
    managerIds: string[];
    memberIds: string[];
    status?: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
}

export interface CreateTaskData {
    title: string;
    description?: string;
    projectId?: string;
    teamId?: string;
    assigneeIds: string[];
    priority: TaskPriority;
    dueDate?: Date;
    tags?: string[];
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    assigneeIds?: string[];
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    tags?: string[];
    checklistItems?: ChecklistItem[];
    attachments?: AttachmentMeta[];
}

// Auth context types
export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export interface AppUser extends User {
    authUser: AuthUser;
}
