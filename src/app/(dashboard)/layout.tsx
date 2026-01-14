'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils/helpers';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading, error } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setSidebarCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Show loader while checking auth
    if (loading) {
        return <PageLoader />;
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                        Return to login
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return <PageLoader />;
    }

    // Get page title from pathname
    const getPageTitle = () => {
        const segments = pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        if (lastSegment === 'dashboard') return 'Dashboard';
        return lastSegment?.charAt(0).toUpperCase() + lastSegment?.slice(1).replace(/-/g, ' ') || 'Dashboard';
    };

    const isEmployee = user.role === 'employee';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Sidebar - hidden on mobile for employees */}
            {(!isMobile || !isEmployee) && (
                <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            )}

            {/* Main content */}
            <main
                className={cn(
                    'min-h-screen transition-all duration-300',
                    !isMobile && !isEmployee && (sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'),
                    isEmployee && 'pb-20 md:pb-0'
                )}
            >
                <Header
                    title={getPageTitle()}
                    onMenuClick={isMobile && !isEmployee ? () => setSidebarCollapsed(!sidebarCollapsed) : undefined}
                />
                <div className="p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Bottom nav for employees on mobile */}
            {isEmployee && <BottomNav />}
        </div>
    );
}
