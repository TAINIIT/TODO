// Email reminder service using Firebase Cloud Functions approach
// This is a client-side implementation that prepares reminder data
// In production, this would be handled by Firebase Cloud Functions

import { db } from './config';
import { collection, getDocs, query, where, Timestamp, addDoc } from 'firebase/firestore';
import { APP_CONFIG } from '../constants';
import type { Task, User } from '@/types';

// Types for email reminders
export interface EmailReminder {
    id?: string;
    orgId: string;
    taskId: string;
    userId: string;
    userEmail: string;
    type: 'due_soon' | 'overdue' | 'daily_summary';
    status: 'pending' | 'sent' | 'failed';
    scheduledAt: Timestamp;
    sentAt?: Timestamp;
    taskTitle: string;
    dueDate?: Timestamp;
}

// Collection path
const getRemindersPath = (orgId: string) => `orgs/${orgId}/emailReminders`;

/**
 * Queue an email reminder for sending
 */
export async function queueEmailReminder(
    orgId: string,
    reminder: Omit<EmailReminder, 'id' | 'orgId' | 'status'>
): Promise<string> {
    const reminderRef = collection(db, getRemindersPath(orgId));
    const docRef = await addDoc(reminderRef, {
        ...reminder,
        orgId,
        status: 'pending',
    });
    return docRef.id;
}

/**
 * Check for tasks due soon and queue reminders
 * This should be called periodically (e.g., every hour via cron)
 */
export async function checkAndQueueDueSoonReminders(
    orgId: string,
    hoursBeforeDue: number = 24
): Promise<number> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hoursBeforeDue * 60 * 60 * 1000);

    // Get tasks due within the cutoff
    const tasksQuery = query(
        collection(db, `orgs/${orgId}/tasks`),
        where('status', 'in', ['backlog', 'in_progress']),
        where('dueDate', '<=', Timestamp.fromDate(cutoff)),
        where('dueDate', '>', Timestamp.now())
    );

    const tasksSnapshot = await getDocs(tasksQuery);
    let count = 0;

    for (const taskDoc of tasksSnapshot.docs) {
        const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

        // Get assigned users
        for (const userId of task.assigneeIds) {
            const userDoc = await getDocs(
                query(
                    collection(db, `orgs/${orgId}/users`),
                    where('__name__', '==', userId)
                )
            );

            if (!userDoc.empty) {
                const user = userDoc.docs[0].data() as User;

                // Check if user has email reminders enabled
                if (user.reminderPreferences?.emailEnabled !== false) {
                    await queueEmailReminder(orgId, {
                        taskId: task.id,
                        userId: user.id,
                        userEmail: user.email,
                        type: 'due_soon',
                        scheduledAt: Timestamp.now(),
                        taskTitle: task.title,
                        dueDate: task.dueDate,
                    });
                    count++;
                }
            }
        }
    }

    return count;
}

/**
 * Check for overdue tasks and queue reminders
 */
export async function checkAndQueueOverdueReminders(orgId: string): Promise<number> {
    const tasksQuery = query(
        collection(db, `orgs/${orgId}/tasks`),
        where('status', 'in', ['backlog', 'in_progress', 'blocked']),
        where('dueDate', '<', Timestamp.now())
    );

    const tasksSnapshot = await getDocs(tasksQuery);
    let count = 0;

    for (const taskDoc of tasksSnapshot.docs) {
        const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

        for (const userId of task.assigneeIds) {
            const userDoc = await getDocs(
                query(
                    collection(db, `orgs/${orgId}/users`),
                    where('__name__', '==', userId)
                )
            );

            if (!userDoc.empty) {
                const user = userDoc.docs[0].data() as User;

                if (user.reminderPreferences?.emailEnabled !== false) {
                    await queueEmailReminder(orgId, {
                        taskId: task.id,
                        userId: user.id,
                        userEmail: user.email,
                        type: 'overdue',
                        scheduledAt: Timestamp.now(),
                        taskTitle: task.title,
                        dueDate: task.dueDate,
                    });
                    count++;
                }
            }
        }
    }

    return count;
}

/**
 * Generate daily summary data for a user
 */
export async function generateDailySummary(
    orgId: string,
    userId: string
): Promise<{
    dueToday: Task[];
    overdue: Task[];
    inProgress: Task[];
}> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Get all user's active tasks
    const tasksQuery = query(
        collection(db, `orgs/${orgId}/tasks`),
        where('assigneeIds', 'array-contains', userId),
        where('status', 'in', ['backlog', 'in_progress', 'blocked'])
    );

    const snapshot = await getDocs(tasksQuery);
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

    const dueToday = tasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = t.dueDate.toDate();
        return dueDate >= today && dueDate < tomorrow;
    });

    const overdue = tasks.filter(t => {
        if (!t.dueDate) return false;
        return t.dueDate.toDate() < today;
    });

    const inProgress = tasks.filter(t => t.status === 'in_progress');

    return { dueToday, overdue, inProgress };
}

/**
 * Email template for due soon reminder
 */
export function generateDueSoonEmailHtml(taskTitle: string, dueDate: Date): string {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 20px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">⏰ Task Due Soon</h1>
            </div>
            <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; color: #374151;">Your task <strong>"${taskTitle}"</strong> is due soon.</p>
                <p style="color: #6B7280;">Due: <strong>${dueDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}</strong></p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks" 
                   style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                          border-radius: 8px; text-decoration: none; margin-top: 16px;">
                    View Task
                </a>
            </div>
            <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 16px;">
                TaskFlow - Work Assignment App
            </p>
        </div>
    `;
}

/**
 * Email template for daily summary
 */
export function generateDailySummaryEmailHtml(
    userName: string,
    dueToday: number,
    overdue: number,
    inProgress: number
): string {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 20px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">📊 Daily Summary</h1>
            </div>
            <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; color: #374151;">Good morning, <strong>${userName}</strong>!</p>
                <p style="color: #6B7280;">Here's your task overview for today:</p>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0;">
                    <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <p style="font-size: 24px; font-weight: bold; color: #F59E0B; margin: 0;">${dueToday}</p>
                        <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">Due Today</p>
                    </div>
                    <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <p style="font-size: 24px; font-weight: bold; color: #EF4444; margin: 0;">${overdue}</p>
                        <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">Overdue</p>
                    </div>
                    <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <p style="font-size: 24px; font-weight: bold; color: #3B82F6; margin: 0;">${inProgress}</p>
                        <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">In Progress</p>
                    </div>
                </div>
                
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks" 
                   style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                          border-radius: 8px; text-decoration: none;">
                    View All Tasks
                </a>
            </div>
            <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 16px;">
                TaskFlow - Work Assignment App
            </p>
        </div>
    `;
}
