'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, useIsManager } from '@/contexts/AuthContext';
import { getTasks, getUsers } from '@/lib/firebase/firestore';
import { APP_CONFIG, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { SectionLoader } from '@/components/common/LoadingSpinner';
import type { Task, User, TaskStatus, TaskPriority } from '@/types';
import {
    Download,
    TrendingUp,
    TrendingDown,
    Calendar,
    CheckCircle,
    Clock,
    AlertTriangle,
    Users,
    BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { exportMultipleSheets } from '@/lib/utils/export';

type ReportPeriod = 'week' | 'month' | 'quarter';

export default function ReportsPage() {
    const { user } = useAuth();
    const isManager = useIsManager();
    const router = useRouter();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<ReportPeriod>('week');

    useEffect(() => {
        if (user && !isManager) {
            router.push('/dashboard');
            return;
        }
    }, [user, isManager, router]);

    useEffect(() => {
        const loadData = async () => {
            if (!user || !isManager) return;

            try {
                setLoading(true);
                const [tasksData, usersData] = await Promise.all([
                    getTasks(APP_CONFIG.defaultOrgId, {}),
                    getUsers(APP_CONFIG.defaultOrgId)
                ]);
                setTasks(tasksData);
                setUsers(usersData);
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user, isManager]);

    // Calculate date range
    const getDateRange = (): { start: Date; end: Date; label: string } => {
        const now = new Date();
        const end = new Date(now);
        let start: Date;
        let label: string;

        switch (period) {
            case 'week':
                start = new Date(now);
                start.setDate(now.getDate() - 7);
                label = 'Last 7 Days';
                break;
            case 'month':
                start = new Date(now);
                start.setMonth(now.getMonth() - 1);
                label = 'Last 30 Days';
                break;
            case 'quarter':
                start = new Date(now);
                start.setMonth(now.getMonth() - 3);
                label = 'Last 3 Months';
                break;
        }

        return { start, end, label };
    };

    const { start, end, label: periodLabel } = getDateRange();

    // Filter tasks by period
    const periodTasks = tasks.filter(t => {
        const createdAt = t.createdAt.toDate();
        return createdAt >= start && createdAt <= end;
    });

    const completedInPeriod = periodTasks.filter(t => t.status === 'done');
    const overdueInPeriod = tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        return t.dueDate.toDate() < new Date();
    });

    // Calculate previous period for comparison
    const prevStart = new Date(start);
    const prevEnd = new Date(start);
    switch (period) {
        case 'week':
            prevStart.setDate(prevStart.getDate() - 7);
            break;
        case 'month':
            prevStart.setMonth(prevStart.getMonth() - 1);
            break;
        case 'quarter':
            prevStart.setMonth(prevStart.getMonth() - 3);
            break;
    }

    const prevPeriodCreated = tasks.filter(t => {
        const createdAt = t.createdAt.toDate();
        return createdAt >= prevStart && createdAt < start;
    });

    const prevPeriodCompleted = prevPeriodCreated.filter(t => t.status === 'done');

    // Calculate trends
    const createdTrend = prevPeriodCreated.length > 0
        ? Math.round(((periodTasks.length - prevPeriodCreated.length) / prevPeriodCreated.length) * 100)
        : 0;

    const completedTrend = prevPeriodCompleted.length > 0
        ? Math.round(((completedInPeriod.length - prevPeriodCompleted.length) / prevPeriodCompleted.length) * 100)
        : 0;

    // Status breakdown for pie chart
    const statusData = [
        { name: 'Backlog', value: tasks.filter(t => t.status === 'backlog').length, color: '#9CA3AF' },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3B82F6' },
        { name: 'Blocked', value: tasks.filter(t => t.status === 'blocked').length, color: '#EF4444' },
        { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#10B981' },
    ].filter(d => d.value > 0);

    // Priority breakdown
    const priorityData = [
        { name: 'Low', value: tasks.filter(t => t.priority === 'low' && t.status !== 'done').length, color: '#9CA3AF' },
        { name: 'Medium', value: tasks.filter(t => t.priority === 'medium' && t.status !== 'done').length, color: '#F59E0B' },
        { name: 'High', value: tasks.filter(t => t.priority === 'high' && t.status !== 'done').length, color: '#F97316' },
        { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length, color: '#EF4444' },
    ];

    // Top performers (users with most completed tasks)
    const userCompletions = users.map(u => ({
        name: u.displayName,
        completed: tasks.filter(t => t.status === 'done' && t.assigneeIds.includes(u.id)).length,
    })).sort((a, b) => b.completed - a.completed).slice(0, 5);

    // Export report
    const handleExportReport = () => {
        const summaryData = [{
            'Period': periodLabel,
            'Total Tasks': tasks.length,
            'Created This Period': periodTasks.length,
            'Completed This Period': completedInPeriod.length,
            'Overdue': overdueInPeriod.length,
            'Active Users': users.filter(u => u.status === 'active').length,
            'Completion Rate': tasks.length > 0 ? `${Math.round((completedInPeriod.length / tasks.length) * 100)}%` : '0%',
        }];

        const statusBreakdown = statusData.map(s => ({
            'Status': s.name,
            'Count': s.value,
            'Percentage': `${Math.round((s.value / tasks.length) * 100)}%`,
        }));

        const topPerformers = userCompletions.map((u, i) => ({
            'Rank': i + 1,
            'Name': u.name,
            'Completed Tasks': u.completed,
        }));

        exportMultipleSheets([
            { name: 'Summary', data: summaryData },
            { name: 'Status Breakdown', data: statusBreakdown },
            { name: 'Top Performers', data: topPerformers },
        ], `report-${period}`);
    };

    const periodOptions = [
        { value: 'week', label: 'Last 7 Days' },
        { value: 'month', label: 'Last 30 Days' },
        { value: 'quarter', label: 'Last 3 Months' },
    ];

    if (!isManager) return null;
    if (loading) return <SectionLoader />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Task analytics and team performance
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select
                        options={periodOptions}
                        value={period}
                        onChange={(value) => setPeriod(value as ReportPeriod)}
                    />
                    <Button
                        variant="outline"
                        onClick={handleExportReport}
                        leftIcon={<Download className="w-4 h-4" />}
                    >
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Tasks Created"
                    value={periodTasks.length}
                    trend={createdTrend}
                    icon={BarChart3}
                    color="indigo"
                />
                <StatCard
                    title="Completed"
                    value={completedInPeriod.length}
                    trend={completedTrend}
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    title="Overdue"
                    value={overdueInPeriod.length}
                    icon={AlertTriangle}
                    color="red"
                />
                <StatCard
                    title="Active Team"
                    value={users.filter(u => u.status === 'active').length}
                    icon={Users}
                    color="blue"
                />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <Card>
                    <CardHeader title="Task Status Distribution" />
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Priority Distribution */}
                <Card>
                    <CardHeader title="Active Tasks by Priority" />
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={priorityData}>
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {priorityData.map((entry, index) => (
                                            <Cell key={`bar-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performers */}
            <Card>
                <CardHeader
                    title="Top Performers"
                    description="Team members with most completed tasks"
                />
                <CardContent>
                    <div className="space-y-3">
                        {userCompletions.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No data available</p>
                        ) : (
                            userCompletions.map((user, index) => (
                                <div
                                    key={user.name}
                                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                            index === 1 ? 'bg-gray-400' :
                                                index === 2 ? 'bg-amber-600' :
                                                    'bg-gray-300'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {user.name}
                                        </p>
                                    </div>
                                    <Badge variant="success" size="md">
                                        {user.completed} completed
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card padding="md">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {tasks.length > 0
                                ? `${Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)}%`
                                : '0%'
                            }
                        </p>
                        <p className="text-sm text-gray-500">Overall Completion Rate</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {tasks.filter(t => t.status === 'in_progress').length}
                        </p>
                        <p className="text-sm text-gray-500">In Progress</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {tasks.filter(t => t.status === 'blocked').length}
                        </p>
                        <p className="text-sm text-gray-500">Blocked</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {tasks.filter(t => t.status === 'backlog').length}
                        </p>
                        <p className="text-sm text-gray-500">Backlog</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    trend,
    icon: Icon,
    color,
}: {
    title: string;
    value: number;
    trend?: number;
    icon: React.ElementType;
    color: 'indigo' | 'green' | 'red' | 'blue';
}) {
    const colors = {
        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    };

    return (
        <Card>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                </div>
                {trend !== undefined && trend !== 0 && (
                    <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
        </Card>
    );
}
