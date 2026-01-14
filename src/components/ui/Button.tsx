import React from 'react';
import { cn } from '@/lib/utils/helpers';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            loading = false,
            leftIcon,
            rightIcon,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary:
                'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg focus:ring-indigo-500',
            secondary:
                'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-gray-500',
            outline:
                'border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:ring-indigo-500',
            ghost:
                'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
            danger:
                'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-500',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm gap-1.5',
            md: 'px-4 py-2 text-sm gap-2',
            lg: 'px-6 py-3 text-base gap-2',
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : leftIcon ? (
                    leftIcon
                ) : null}
                {children}
                {rightIcon && !loading && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
