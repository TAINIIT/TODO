import React from 'react';
import { cn } from '@/lib/utils/helpers';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
        const variants = {
            default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
            primary: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
            success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        };

        const sizes = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-2.5 py-1 text-xs',
        };

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center font-medium rounded-full',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

export default Badge;
