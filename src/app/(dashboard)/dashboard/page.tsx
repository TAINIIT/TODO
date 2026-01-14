'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, useIsAdmin, useIsManager } from '@/contexts/AuthContext';
import { getTasks, getOverdueTasks, getUsers, getProjects } from '@/lib/firebase/firestore';
import { APP_CONFIG, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SectionLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { formatDueDate, isOverdue, isDueSoon } from '@/lib/utils/date';
import type { Task, User, Project } from '@/types';
import {
    CheckCircle,
    Clock,
    AlertTriangle,
    TrendingUp,
    Calendar,
    ChevronRight,
    Zap,
    Users,
    FolderOpen,
    BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from 'recharts';

export default function DashboardPage() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const isManager = useIsManager();

    if (!user) return null;

    // Employees see their personal dashboard
    if (user.role === 'employee') {
        return <EmployeeDashboard userId={user.id} />;
    }

    // Managers and admins see the management dashboard
    return <ManagementDashboard isAdmin={isAdmin} />;
}

function EmployeeDashboard({ userId }: { userId: string }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const userTasks = await getTasks(APP_CONFIG.defaultOrgId, {
                    assigneeId: userId,
                    status: ['backlog', 'in_progress', 'blocked'],
                });
                setTasks(userTasks);
            } catch (err) {
                console.error('Failed to load tasks:', err);
            } finally {
                setLoading(false);
            }
        };
        loadTasks();
    }, [userId]);

    if (loading) return <SectionLoader />;

    const todayTasks = tasks.filter((t) => {
        if (!t.dueDate) return false;
        const dueDate = t.dueDate.toDate();
        const today = new Date();
        return (
            dueDate.getDate() === today.getDate() &&
            dueDate.getMonth() === today.getMonth() &&
            dueDate.getFullYear() === today.getFullYear()
        );
    });

    const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate));
    const upcomingTasks = tasks.filter((t) => isDueSoon(t.dueDate) && !isOverdue(t.dueDate));
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');

    return (
        <div className="space-y-6">
            {/* Welcome section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold mb-1">Welcome back! 👋</h1>
                <p className="text-indigo-100">
                    You have {tasks.length} active task{tasks.length !== 1 ? 's' : ''} to work on.
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Due Today"
                    value={todayTasks.length}
                    icon={Calendar}
                    color="indigo"
                />
                <StatCard
                    title="Overdue"
                    value={overdueTasks.length}
                    icon={AlertTriangle}
                    color="red"
                />
                <StatCard
                    title="In Progress"
                    value={inProgressTasks.length}
                    icon={Clock}
                    color="blue"
                />
                <StatCard
                    title="Upcoming"
                    value={upcomingTasks.length}
                    icon={Zap}
                    color="yellow"
                />
            </div>

            {/* Today's tasks */}
            <Card>
                <CardHeader
                    title="Today's Tasks"
                    description={`${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} due today`}
                    action={
                        <Link href="/tasks">
                            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                                View all
                            </Button>
                        </Link>
                    }
                />
                <CardContent>
                    {todayTasks.length === 0 ? (
                        <EmptyState
                            type="tasks"
                            title="No tasks due today"
                            description="Enjoy your day or pick up some tasks from your backlog."
                        />
                    ) : (
                        <div className="space-y-3">
                            {todayTasks.slice(0, 5).map((task) => (
                                <TaskQuickView key={task.id} task={task} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Overdue tasks (if any) */}
            {overdueTasks.length > 0 && (
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader
                        title="Overdue Tasks"
                        description="These tasks need your immediate attention"
                    />
                    <CardContent>
                        <div className="space-y-3">
                            {overdueTasks.slice(0, 3).map((task) => (
                                <TaskQuickView key={task.id} task={task} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function ManagementDashboard({ isAdmin }: { isAdmin: boolean }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [allTasks, allUsers, allProjects] = await Promise.all([
                    getTasks(APP_CONFIG.defaultOrgId, {}),
                    getUsers(APP_CONFIG.defaultOrgId),
                    getProjects(APP_CONFIG.defaultOrgId)
                ]);
                setTasks(allTasks);
                setUsers(allUsers);
                setProjects(allProjects);
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <SectionLoader />;

    // Calculate stats
    const activeTasks = tasks.filter(t => t.status !== 'done');
    const overdueTasks = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done');
    const completedTasks = tasks.filter(t => t.status === 'done');
    const today = new Date();
    const completedToday = completedTasks.filter(t => {
        if (!t.completedAt) return false;
        const completedDate = t.completedAt.toDate();
        return (
            completedDate.getDate() === today.getDate() &&
            completedDate.getMonth() === today.getMonth() &&
            completedDate.getFullYear() === today.getFullYear()
        );
    });

    // Status breakdown for pie chart
    const statusData = [
        { name: 'Backlog', value: tasks.filter(t => t.status === 'backlog').length, color: '#9CA3AF' },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3B82F6' },
        { name: 'Blocked', value: tasks.filter(t => t.status === 'blocked').length, color: '#EF4444' },
        { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#10B981' },
    ].filter(d => d.value > 0);

    // Priority breakdown for bar chart
    const priorityData = [
        { name: 'Low', count: activeTasks.filter(t => t.priority === 'low').length, fill: '#9CA3AF' },
        { name: 'Medium', count: activeTasks.filter(t => t.priority === 'medium').length, fill: '#F59E0B' },
        { name: 'High', count: activeTasks.filter(t => t.priority === 'high').length, fill: '#F97316' },
        { name: 'Urgent', count: activeTasks.filter(t => t.priority === 'urgent').length, fill: '#EF4444' },
    ];

    const activeUsers = users.filter(u => u.status === 'active');
    const activeProjects = projects.filter(p => p.status === 'active');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {isAdmin ? 'Admin Dashboard' : 'Manager Dashboard'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Overview of all tasks and team performance
                </p>
            </div>

            {/* Top stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Active Tasks"
                    value={activeTasks.length}
                    icon={CheckCircle}
                    color="indigo"
                />
                <StatCard
                    title="Completed Today"
                    value={completedToday.length}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Overdue"
                    value={overdueTasks.length}
                    icon={AlertTriangle}
                    color="red"
                />
                <StatCard
                    title="Team Members"
                    value={activeUsers.length}
                    icon={Users}
                    color="blue"
                />
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Task Status Pie Chart */}
                <Card>
                    <CardHeader
                        title="Task Status Distribution"
                        description="Breakdown of all tasks by status"
                    />
                    <CardContent>
                        {statusData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState
                                type="tasks"
                                title="No tasks yet"
                                description="Create tasks to see the distribution"
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Priority Bar Chart */}
                <Card>
                    <CardHeader
                        title="Active Tasks by Priority"
                        description="Distribution of active tasks"
                    />
                    <CardContent>
                        {activeTasks.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={priorityData}>
                                        <XAxis dataKey="name" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {priorityData.map((entry, index) => (
                                                <Cell key={`bar-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState
                                type="tasks"
                                title="No active tasks"
                                description="All tasks are completed!"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                    title="Active Projects"
                    value={activeProjects.length}
                    icon={FolderOpen}
                    color="indigo"
                />
                <StatCard
                    title="In Progress"
                    value={tasks.filter(t => t.status === 'in_progress').length}
                    icon={Clock}
                    color="blue"
                />
                <StatCard
                    title="Total Completed"
                    value={completedTasks.length}
                    icon={BarChart3}
                    color="green"
                />
            </div>

            {/* Quick actions */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card hover>
                    <Link href="/tasks" className="block p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Manage Tasks</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all tasks</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                    </Link>
                </Card>

                <Card hover>
                    <Link href="/teams" className="block p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Team Overview</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View team performance</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                    </Link>
                </Card>

                <Card hover>
                    <Link href="/projects" className="block p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <FolderOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Projects</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View all projects</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                    </Link>
                </Card>
            </div>

            {/* Overdue tasks alert */}
            {overdueTasks.length > 0 && (
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader
                        title={`${overdueTasks.length} Overdue Task${overdueTasks.length !== 1 ? 's' : ''}`}
                        description="These tasks need immediate attention"
                        action={
                            <Link href="/tasks?status=overdue">
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        }
                    />
                    <CardContent>
                        <div className="space-y-3">
                            {overdueTasks.slice(0, 5).map((task) => (
                                <TaskQuickView key={task.id} task={task} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: 'indigo' | 'green' | 'red' | 'blue' | 'yellow';
}) {
    const colors = {
        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    };

    return (
        <Card>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                </div>
            </div>
        </Card>
    );
}

function TaskQuickView({ task }: { task: Task }) {
    const priorityColors = {
        low: 'default',
        medium: 'warning',
        high: 'danger',
        urgent: 'danger',
    } as const;

    const statusColors = {
        backlog: 'default',
        in_progress: 'info',
        blocked: 'danger',
        done: 'success',
    } as const;

    return (
        <Link href={`/tasks/${task.id}`}>
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={statusColors[task.status]} size="sm">
                            {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={priorityColors[task.priority]} size="sm">
                            {task.priority}
                        </Badge>
                    </div>
                </div>
                <div className="text-right">
                    <p
                        className={`text-sm font-medium ${isOverdue(task.dueDate)
                            ? 'text-red-600 dark:text-red-400'
                            : isDueSoon(task.dueDate)
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {formatDueDate(task.dueDate)}
                    </p>
                </div>
            </div>
        </Link>
    );
}
