import React from 'react';
import { cn } from '@/lib/utils/helpers';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export function Card({
    className,
    variant = 'default',
    padding = 'md',
    hover = false,
    children,
    ...props
}: CardProps) {
    const variants = {
        default: 'bg-white dark:bg-gray-900 shadow-sm',
        elevated: 'bg-white dark:bg-gray-900 shadow-lg',
        outlined: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
    };

    const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-8',
    };

    return (
        <div
            className={cn(
                'rounded-xl',
                variants[variant],
                paddings[padding],
                hover && 'transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function CardHeader({ className, title, description, action, ...props }: CardHeaderProps) {
    return (
        <div className={cn('flex items-start justify-between mb-4', className)} {...props}>
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                {description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

export function CardContent({ className, children, ...props }: CardContentProps) {
    return (
        <div className={cn(className)} {...props}>
            {children}
        </div>
    );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

export function CardFooter({ className, children, ...props }: CardFooterProps) {
    return (
        <div
            className={cn(
                'mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;
