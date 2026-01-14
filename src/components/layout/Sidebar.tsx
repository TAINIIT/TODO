'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/helpers';
import { useAuth, useIsAdmin, useIsManager } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    CheckSquare,
    Users,
    FolderKanban,
    UsersRound,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Calendar,
    BarChart3,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    adminOnly?: boolean;
    managerOnly?: boolean;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    { label: 'Reports', href: '/reports', icon: BarChart3, managerOnly: true },
    { label: 'Analytics', href: '/analytics', icon: BarChart3, adminOnly: true },
    { label: 'Teams', href: '/teams', icon: UsersRound, managerOnly: true },
    { label: 'Projects', href: '/projects', icon: FolderKanban, managerOnly: true },
    { label: 'Users', href: '/users', icon: Users, adminOnly: true },
    { label: 'Audit Logs', href: '/audit-logs', icon: FileText, adminOnly: true },
    { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const isAdmin = useIsAdmin();
    const isManager = useIsManager();

    const filteredNavItems = navItems.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.managerOnly && !isManager) return false;
        return true;
    });

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100">TaskFlow</span>
                    </Link>
                )}
                <button
                    onClick={onToggle}
                    className={cn(
                        'p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                        collapsed && 'mx-auto'
                    )}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <ChevronLeft className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                        isActive
                                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-600 dark:text-indigo-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                                        collapsed && 'justify-center'
                                    )}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <Icon className={cn('w-5 h-5', isActive && 'text-indigo-600 dark:text-indigo-400')} />
                                    {!collapsed && (
                                        <span className={cn('font-medium', isActive && 'text-indigo-600 dark:text-indigo-400')}>
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User section */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-3">
                <div
                    className={cn(
                        'flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800',
                        collapsed && 'justify-center'
                    )}
                >
                    <Avatar name={user?.displayName || 'User'} size="sm" />
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {user?.displayName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={signOut}
                    className={cn(
                        'mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors',
                        collapsed && 'justify-center'
                    )}
                    title={collapsed ? 'Sign out' : undefined}
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span className="font-medium">Sign out</span>}
                </button>
            </div>
        </aside>
    );
}
