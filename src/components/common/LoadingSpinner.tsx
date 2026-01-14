import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

export default function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <Loader2 className={cn('animate-spin text-indigo-600', sizes[size])} />
            {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" text="Loading..." />
        </div>
    );
}

export function SectionLoader() {
    return (
        <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
        </div>
    );
}
