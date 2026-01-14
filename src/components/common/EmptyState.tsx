import React from 'react';
import { cn } from '@/lib/utils/helpers';
import { Inbox, Search, FileQuestion, Users, FolderOpen } from 'lucide-react';
import Button from '@/components/ui/Button';

type EmptyStateType = 'default' | 'search' | 'tasks' | 'users' | 'projects';

interface EmptyStateProps {
    type?: EmptyStateType;
    title?: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const icons = {
    default: Inbox,
    search: Search,
    tasks: FileQuestion,
    users: Users,
    projects: FolderOpen,
};

const defaultContent: Record<EmptyStateType, { title: string; description: string }> = {
    default: {
        title: 'No data found',
        description: 'There is nothing to display here yet.',
    },
    search: {
        title: 'No results found',
        description: 'Try adjusting your search or filter to find what you\'re looking for.',
    },
    tasks: {
        title: 'No tasks yet',
        description: 'Create your first task to get started.',
    },
    users: {
        title: 'No users found',
        description: 'Invite team members to get started.',
    },
    projects: {
        title: 'No projects yet',
        description: 'Create a project to organize your tasks.',
    },
};

export default function EmptyState({
    type = 'default',
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    const Icon = icons[type];
    const content = defaultContent[type];

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-12 px-4 text-center',
                className
            )}
        >
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                {title || content.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                {description || content.description}
            </p>
            {action && (
                <Button onClick={action.onClick} size="sm">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
