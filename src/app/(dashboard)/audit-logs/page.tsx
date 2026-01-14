'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { getAuditLogs, getUsers } from '@/lib/firebase/firestore';
import { APP_CONFIG } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { SectionLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/utils/date';
import type { AuditLog, User, AuditActionType, AuditEntityType } from '@/types';
import {
    Search,
    Download,
    User as UserIcon,
    Users,
    FolderKanban,
    CheckSquare,
    Clock,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const ACTION_LABELS: Record<AuditActionType, string> = {
    user_created: 'User Created',
    user_disabled: 'User Disabled',
    user_role_changed: 'User Role Changed',
    team_created: 'Team Created',
    team_updated: 'Team Updated',
    team_deleted: 'Team Deleted',
    project_created: 'Project Created',
    project_updated: 'Project Updated',
    project_deleted: 'Project Deleted',
    task_created: 'Task Created',
    task_updated: 'Task Updated',
    task_deleted: 'Task Deleted',
};

const ENTITY_ICONS: Record<AuditEntityType, React.ElementType> = {
    user: UserIcon,
    team: Users,
    project: FolderKanban,
    task: CheckSquare,
};

const ACTION_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    created: 'success',
    updated: 'info',
    deleted: 'danger',
    disabled: 'warning',
    changed: 'warning',
};

export default function AuditLogsPage() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const router = useRouter();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entityType: '',
        actorId: '',
        search: '',
    });
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    useEffect(() => {
        // Redirect non-admins
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
                const [logsData, usersData] = await Promise.all([
                    getAuditLogs(APP_CONFIG.defaultOrgId, {
                        entityType: filters.entityType || undefined,
                        actorId: filters.actorId || undefined,
                    }),
                    getUsers(APP_CONFIG.defaultOrgId)
                ]);

                // Create users map
                const usersMap: Record<string, User> = {};
                usersData.forEach(u => { usersMap[u.id] = u; });
                setUsers(usersMap);

                // Apply search filter
                let filteredLogs = logsData;
                if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    filteredLogs = logsData.filter(log =>
                        log.entityName?.toLowerCase().includes(searchLower) ||
                        log.actorEmail.toLowerCase().includes(searchLower) ||
                        log.actionType.toLowerCase().includes(searchLower)
                    );
                }

                setLogs(filteredLogs);
            } catch (err) {
                console.error('Failed to load audit logs:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, isAdmin, filters]);

    const handleExport = () => {
        // Export to CSV/Excel
        const csvContent = [
            ['Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity Name', 'Changes'].join(','),
            ...logs.map(log => [
                formatDateTime(log.createdAt),
                log.actorEmail,
                ACTION_LABELS[log.actionType],
                log.entityType,
                log.entityName || '',
                log.changes ? JSON.stringify(log.changes) : ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const getActionVariant = (actionType: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
        for (const [key, variant] of Object.entries(ACTION_VARIANTS)) {
            if (actionType.includes(key)) return variant;
        }
        return 'default';
    };

    const toggleExpanded = (logId: string) => {
        setExpandedLog(expandedLog === logId ? null : logId);
    };

    const entityTypeOptions = [
        { value: '', label: 'All Types' },
        { value: 'user', label: 'Users' },
        { value: 'team', label: 'Teams' },
        { value: 'project', label: 'Projects' },
        { value: 'task', label: 'Tasks' },
    ];

    const actorOptions = [
        { value: '', label: 'All Users' },
        ...Object.values(users).map(u => ({ value: u.id, label: u.displayName }))
    ];

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Track all changes and activities in your organization
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleExport}
                    leftIcon={<Download className="w-4 h-4" />}
                    disabled={logs.length === 0}
                >
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by entity name, email, or action..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <Select
                        options={entityTypeOptions}
                        value={filters.entityType}
                        onChange={(value) => setFilters({ ...filters, entityType: value })}
                        placeholder="Entity Type"
                    />
                    <Select
                        options={actorOptions}
                        value={filters.actorId}
                        onChange={(value) => setFilters({ ...filters, actorId: value })}
                        placeholder="User"
                    />
                </div>
            </Card>

            {/* Logs list */}
            {loading ? (
                <SectionLoader />
            ) : logs.length === 0 ? (
                <EmptyState
                    type="tasks"
                    title="No audit logs found"
                    description={filters.search || filters.entityType || filters.actorId
                        ? "Try adjusting your filters"
                        : "Activity will appear here as users make changes"
                    }
                />
            ) : (
                <Card>
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {logs.map((log) => {
                            const Icon = ENTITY_ICONS[log.entityType] || Clock;
                            const isExpanded = expandedLog === log.id;

                            return (
                                <div key={log.id} className="p-4">
                                    <div
                                        className="flex items-start gap-4 cursor-pointer"
                                        onClick={() => log.changes && toggleExpanded(log.id)}
                                    >
                                        {/* Icon */}
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-5 h-5 text-gray-500" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant={getActionVariant(log.actionType)} size="sm">
                                                    {ACTION_LABELS[log.actionType]}
                                                </Badge>
                                                {log.entityName && (
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                        {log.entityName}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                by <span className="font-medium">{users[log.actorId]?.displayName || log.actorEmail}</span>
                                            </p>
                                        </div>

                                        {/* Timestamp & Expand */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-sm text-gray-400">
                                                {formatDateTime(log.createdAt)}
                                            </span>
                                            {log.changes && (
                                                isExpanded
                                                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded changes */}
                                    {isExpanded && log.changes && (
                                        <div className="mt-4 ml-14 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Changes:</p>
                                            <div className="space-y-2">
                                                {Object.entries(log.changes).map(([field, { before, after }]) => (
                                                    <div key={field} className="text-sm">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">{field}:</span>
                                                        <div className="ml-2 flex items-center gap-2 text-xs">
                                                            <span className="text-red-500 line-through">
                                                                {String(before || 'null')}
                                                            </span>
                                                            <span className="text-gray-400">→</span>
                                                            <span className="text-green-500">
                                                                {String(after || 'null')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Summary */}
            <Card padding="sm">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Showing {logs.length} log entries</span>
                    <span>Last 50 entries • <button className="text-indigo-600 hover:underline">Load more</button></span>
                </div>
            </Card>
        </div>
    );
}
