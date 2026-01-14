import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Validate email against allowed domains
 */
export function isValidEmailDomain(email: string, allowedDomains: string[]): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return allowedDomains.some(d => domain === d.toLowerCase());
}

/**
 * Generate a random ID (for client-side ID generation)
 */
export function generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get initials from display name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Check if user has minimum required role
 */
export function hasMinimumRole(
    userRole: 'admin' | 'manager' | 'employee',
    requiredRole: 'admin' | 'manager' | 'employee'
): boolean {
    const roleHierarchy = { employee: 1, manager: 2, admin: 3 };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json);
    } catch {
        return fallback;
    }
}
