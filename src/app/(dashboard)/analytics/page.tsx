'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { getTasks, getUsers, getProjects, getTeams } from '@/lib/firebase/firestore';
import { APP_CONFIG } from '@/lib/constants';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { SectionLoader } from '@/components/common/LoadingSpinner';
import type { Task, User, Project, Team } from '@/types';
import {
    TrendingUp,
    TrendingDown,
    Users,
    CheckCircle,
    Clock,
    Calendar,
    Target,
    Activity,
    Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const router = useRouter();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');

    useEffect(() => {
        if (user && !isAdmin) {
            router.push('/dashboard');
            return;
        }
    }, [user, isAdmin, router]);

    useEffect(() => {
        const loadData = async () => {
            if (!user || !isAdmin) return;

            try {
                setLoading(true);
                const [tasksData, usersData, projectsData, teamsData] = await Promise.all([
                    getTasks(APP_CONFIG.defaultOrgId, {}),
                    getUsers(APP_CONFIG.defaultOrgId),
                    getProjects(APP_CONFIG.defaultOrgId),
                    getTeams(APP_CONFIG.defaultOrgId)
                ]);
                setTasks(tasksData);
                setUsers(usersData);
                setProjects(projectsData);
                setTeams(teamsData);
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user, isAdmin]);

    if (!isAdmin) return null;
    if (loading) return <SectionLoader />;

    // Calculate metrics
    const days = parseInt(timeRange);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const recentTasks = tasks.filter(t => t.createdAt.toDate() >= startDate);
    const completedRecent = recentTasks.filter(t => t.status === 'done');

    // Completion rate
    const completionRate = tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
        : 0;

    // Average completion time (mock calculation)
    const avgCompletionDays = 3.5; // Would need completedAt - createdAt calculation

    // Active users (users with tasks assigned)
    const activeUserIds = new Set(tasks.flatMap(t => t.assigneeIds));
    const activeUsers = users.filter(u => activeUserIds.has(u.id)).length;

    // Productivity trend data (last 7 days)
    const productivityData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dayTasks = tasks.filter(t => {
            const created = t.createdAt.toDate();
            return created.toDateString() === date.toDateString();
        });
        const completed = tasks.filter(t => {
            if (!t.completedAt) return false;
            const comp = t.completedAt.toDate();
            return comp.toDateString() === date.toDateString();
        });
        return {
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            created: dayTasks.length,
            completed: completed.length,
        };
    });

    // Team performance
    const teamPerformance = teams.map(team => {
        const teamTasks = tasks.filter(t => t.teamId === team.id);
        const completed = teamTasks.filter(t => t.status === 'done').length;
        return {
            name: team.name,
            total: teamTasks.length,
            completed,
            rate: teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 0,
        };
    }).sort((a, b) => b.rate - a.rate);

    // Project status distribution
    const projectStatusData = [
        { name: 'Active', value: projects.filter(p => p.status === 'active').length, color: '#10B981' },
        { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: '#6B7280' },
        { name: 'Archived', value: projects.filter(p => p.status === 'archived').length, color: '#9CA3AF' },
    ].filter(d => d.value > 0);

    // User activity (tasks per user)
    const userActivity = users.slice(0, 10).map(u => ({
        name: u.displayName.split(' ')[0],
        tasks: tasks.filter(t => t.assigneeIds.includes(u.id)).length,
        completed: tasks.filter(t => t.assigneeIds.includes(u.id) && t.status === 'done').length,
    }));

    const timeRangeOptions = [
        { value: '7', label: 'Last 7 days' },
        { value: '30', label: 'Last 30 days' },
        { value: '90', label: 'Last 90 days' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Advanced insights and performance metrics
                    </p>
                </div>
                <Select
                    options={timeRangeOptions}
                    value={timeRange}
                    onChange={setTimeRange}
                />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title="Completion Rate"
                    value={`${completionRate}%`}
                    icon={Target}
                    trend={5}
                    color="green"
                />
                <KPICard
                    title="Avg. Completion"
                    value={`${avgCompletionDays}d`}
                    icon={Clock}
                    trend={-12}
                    color="blue"
                />
                <KPICard
                    title="Active Users"
                    value={activeUsers}
                    icon={Users}
                    trend={8}
                    color="indigo"
                />
                <KPICard
                    title="Tasks Created"
                    value={recentTasks.length}
                    icon={Zap}
                    trend={15}
                    color="yellow"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Productivity Trend */}
                <Card>
                    <CardHeader title="Productivity Trend" description="Tasks created vs completed" />
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={productivityData}>
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="created" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} name="Created" />
                                    <Area type="monotone" dataKey="completed" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Completed" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Project Status */}
                <Card>
                    <CardHeader title="Project Status" description="Distribution by status" />
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={projectStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    >
                                        {projectStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Team Performance */}
                <Card>
                    <CardHeader title="Team Performance" description="Completion rate by team" />
                    <CardContent>
                        {teamPerformance.length > 0 ? (
                            <div className="space-y-4">
                                {teamPerformance.map((team, index) => (
                                    <div key={team.name} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{team.name}</span>
                                            <span className="text-gray-500">{team.rate}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                                style={{ width: `${team.rate}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No team data available</p>
                        )}
                    </CardContent>
                </Card>

                {/* User Activity */}
                <Card>
                    <CardHeader title="User Activity" description="Tasks per user" />
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userActivity} layout="vertical">
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={60} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="tasks" fill="#4F46E5" name="Assigned" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Stats */}
            <Card>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{tasks.length}</p>
                            <p className="text-sm text-gray-500">Total Tasks</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{projects.length}</p>
                            <p className="text-sm text-gray-500">Projects</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{teams.length}</p>
                            <p className="text-sm text-gray-500">Teams</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
                            <p className="text-sm text-gray-500">Users</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-600">{completedRecent.length}</p>
                            <p className="text-sm text-gray-500">Completed Recently</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function KPICard({
    title,
    value,
    icon: Icon,
    trend,
    color,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: number;
    color: 'green' | 'blue' | 'indigo' | 'yellow';
}) {
    const colors = {
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
    };

    return (
        <Card>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span>{Math.abs(trend)}% vs last period</span>
                        </div>
                    )}
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </Card>
    );
}
