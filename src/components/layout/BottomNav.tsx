'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/helpers';
import { LayoutDashboard, CheckSquare, Calendar, Settings } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden safe-area-bottom">
            <ul className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors',
                                    isActive
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                )}
                            >
                                <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
