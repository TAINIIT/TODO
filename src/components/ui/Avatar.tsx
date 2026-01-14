import React from 'react';
import { cn } from '@/lib/utils/helpers';
import { getInitials } from '@/lib/utils/helpers';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'offline' | 'away' | 'busy';
}

export default function Avatar({
    className,
    src,
    alt,
    name,
    size = 'md',
    status,
    ...props
}: AvatarProps) {
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
    };

    const statusSizes = {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
        xl: 'w-4 h-4',
    };

    const statusColors = {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
    };

    const initials = name ? getInitials(name) : '?';

    return (
        <div className={cn('relative inline-flex', className)} {...props}>
            {src ? (
                <img
                    src={src}
                    alt={alt || name || 'Avatar'}
                    className={cn(
                        'rounded-full object-cover ring-2 ring-white dark:ring-gray-900',
                        sizes[size]
                    )}
                />
            ) : (
                <div
                    className={cn(
                        'rounded-full flex items-center justify-center font-medium',
                        'bg-gradient-to-br from-indigo-500 to-purple-600 text-white',
                        'ring-2 ring-white dark:ring-gray-900',
                        sizes[size]
                    )}
                >
                    {initials}
                </div>
            )}
            {status && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900',
                        statusSizes[size],
                        statusColors[status]
                    )}
                />
            )}
        </div>
    );
}

interface AvatarGroupProps {
    children: React.ReactNode;
    max?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ children, max = 4, size = 'md' }: AvatarGroupProps) {
    const childArray = React.Children.toArray(children);
    const visibleChildren = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    const overlap = {
        xs: '-space-x-2',
        sm: '-space-x-2.5',
        md: '-space-x-3',
        lg: '-space-x-4',
    };

    return (
        <div className={cn('flex items-center', overlap[size])}>
            {visibleChildren.map((child, index) => (
                <div key={index} className="relative">
                    {child}
                </div>
            ))}
            {remainingCount > 0 && (
                <div
                    className={cn(
                        'relative rounded-full flex items-center justify-center font-medium',
                        'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
                        'ring-2 ring-white dark:ring-gray-900',
                        size === 'xs' && 'w-6 h-6 text-xs',
                        size === 'sm' && 'w-8 h-8 text-xs',
                        size === 'md' && 'w-10 h-10 text-sm',
                        size === 'lg' && 'w-12 h-12 text-base'
                    )}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    );
}
