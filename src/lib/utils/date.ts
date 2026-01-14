import {
    format,
    formatDistanceToNow,
    isToday,
    isTomorrow,
    isYesterday,
    isPast,
    isFuture,
    differenceInHours,
    differenceInDays,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addDays,
    addWeeks,
    addMonths,
    parseISO,
} from 'date-fns';
import { Timestamp } from 'firebase/firestore';

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
    if (!timestamp) return null;
    return timestamp.toDate();
}

/**
 * Convert Date to Firestore Timestamp
 */
export function dateToTimestamp(date: Date | null | undefined): Timestamp | null {
    if (!date) return null;
    return Timestamp.fromDate(date);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | Timestamp | null | undefined, pattern = 'MMM d, yyyy'): string {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : date;
    return format(d, pattern);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | Timestamp | null | undefined): string {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : date;
    return format(d, 'MMM d, yyyy h:mm a');
}

/**
 * Format date relative to now
 */
export function formatRelative(date: Date | Timestamp | null | undefined): string {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : date;
    return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format due date with smart text
 */
export function formatDueDate(date: Date | Timestamp | null | undefined): string {
    if (!date) return 'No due date';
    const d = date instanceof Timestamp ? date.toDate() : date;

    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isYesterday(d)) return 'Yesterday';

    const days = differenceInDays(d, new Date());
    if (days > 0 && days <= 7) return `In ${days} days`;
    if (days < 0 && days >= -7) return `${Math.abs(days)} days ago`;

    return format(d, 'MMM d, yyyy');
}

/**
 * Check if date is overdue
 */
export function isOverdue(date: Date | Timestamp | null | undefined): boolean {
    if (!date) return false;
    const d = date instanceof Timestamp ? date.toDate() : date;
    return isPast(endOfDay(d));
}

/**
 * Check if date is due soon (within 24 hours)
 */
export function isDueSoon(date: Date | Timestamp | null | undefined): boolean {
    if (!date) return false;
    const d = date instanceof Timestamp ? date.toDate() : date;
    const now = new Date();
    const hoursUntilDue = differenceInHours(d, now);
    return hoursUntilDue > 0 && hoursUntilDue <= 24;
}

/**
 * Check if date is due within N hours
 */
export function isDueWithinHours(date: Date | Timestamp | null | undefined, hours: number): boolean {
    if (!date) return false;
    const d = date instanceof Timestamp ? date.toDate() : date;
    const now = new Date();
    const hoursUntilDue = differenceInHours(d, now);
    return hoursUntilDue > 0 && hoursUntilDue <= hours;
}

/**
 * Get date range helpers
 */
export const dateRanges = {
    today: () => ({
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
    }),
    thisWeek: () => ({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
    thisMonth: () => ({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
    }),
    next7Days: () => ({
        start: startOfDay(new Date()),
        end: endOfDay(addDays(new Date(), 7)),
    }),
    next30Days: () => ({
        start: startOfDay(new Date()),
        end: endOfDay(addDays(new Date(), 30)),
    }),
    lastWeek: () => ({
        start: startOfWeek(addWeeks(new Date(), -1), { weekStartsOn: 1 }),
        end: endOfWeek(addWeeks(new Date(), -1), { weekStartsOn: 1 }),
    }),
    lastMonth: () => ({
        start: startOfMonth(addMonths(new Date(), -1)),
        end: endOfMonth(addMonths(new Date(), -1)),
    }),
};

/**
 * Parse ISO date string safely
 */
export function parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    try {
        return parseISO(dateString);
    } catch {
        return null;
    }
}

/**
 * Format time only
 */
export function formatTime(date: Date | Timestamp | null | undefined): string {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : date;
    return format(d, 'h:mm a');
}
