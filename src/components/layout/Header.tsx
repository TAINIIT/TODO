'use client';

import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';

interface HeaderProps {
    onMenuClick?: () => void;
    title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between h-full px-4">
                {/* Left section */}
                <div className="flex items-center gap-4">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}
                    {title && (
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
                    )}
                </div>

                {/* Search (desktop only) */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks, projects..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <button
                        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* User avatar (desktop only) */}
                    <div className="hidden md:block">
                        <Avatar name={user?.displayName || 'User'} size="sm" />
                    </div>
                </div>
            </div>
        </header>
    );
}
