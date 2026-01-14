'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, useIsManager } from '@/contexts/AuthContext';
import { getTasks, createTask, deleteTask } from '@/lib/firebase/firestore';
import { APP_CONFIG, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Avatar, { AvatarGroup } from '@/components/ui/Avatar';
import { SectionLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { formatDueDate, isOverdue, isDueSoon } from '@/lib/utils/date';
import { exportTasksToExcel } from '@/lib/utils/export';
import type { Task, CreateTaskData, TaskStatus, TaskPriority } from '@/types';
import { Plus, Search, MoreVertical, Trash2, Eye, Download } from 'lucide-react';

export default function TasksPage() {
    const { user } = useAuth();
    const isManager = useIsManager();
    const { success, error: showError } = useToast();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        search: '',
    });

    const loadTasks = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            let userTasks: Task[];

            if (isManager) {
                // Managers and admins see all tasks (or scoped by their teams/projects)
                userTasks = await getTasks(APP_CONFIG.defaultOrgId, {
                    status: filters.status as TaskStatus || undefined,
                    priority: filters.priority || undefined,
                });
            } else {
                // Employees see only their assigned tasks
                userTasks = await getTasks(APP_CONFIG.defaultOrgId, {
                    assigneeId: user.id,
                    status: filters.status as TaskStatus || undefined,
                    priority: filters.priority || undefined,
                });
            }

            // Client-side search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                userTasks = userTasks.filter(
                    (t) =>
                        t.title.toLowerCase().includes(searchLower) ||
                        t.description?.toLowerCase().includes(searchLower)
                );
            }

            setTasks(userTasks);
        } catch (err) {
            console.error('Failed to load tasks:', err);
            showError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [user, isManager, filters, showError]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleCreateTask = async (data: CreateTaskData) => {
        if (!user) return;

        try {
            await createTask(APP_CONFIG.defaultOrgId, data, user.id);
            success('Task created successfully');
            setShowCreateModal(false);
            loadTasks();
        } catch (err) {
            console.error('Failed to create task:', err);
            showError('Failed to create task');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await deleteTask(APP_CONFIG.defaultOrgId, taskId);
            success('Task deleted');
            loadTasks();
        } catch (err) {
            console.error('Failed to delete task:', err);
            showError('Failed to delete task');
        }
    };

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(TASK_STATUSES).map(([value, { label }]) => ({ value, label })),
    ];

    const priorityOptions = [
        { value: '', label: 'All Priorities' },
        ...Object.entries(TASK_PRIORITIES).map(([value, { label }]) => ({ value, label })),
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {isManager ? 'Manage all tasks' : 'Your assigned tasks'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => exportTasksToExcel(tasks, {})}
                        leftIcon={<Download className="w-4 h-4" />}
                        disabled={tasks.length === 0}
                    >
                        Export
                    </Button>
                    {isManager && (
                        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                            Create Task
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search tasks..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Select
                            options={statusOptions}
                            value={filters.status}
                            onChange={(value) => setFilters({ ...filters, status: value })}
                            placeholder="Status"
                        />
                        <Select
                            options={priorityOptions}
                            value={filters.priority}
                            onChange={(value) => setFilters({ ...filters, priority: value })}
                            placeholder="Priority"
                        />
                    </div>
                </div>
            </Card>

            {/* Task list */}
            {loading ? (
                <SectionLoader />
            ) : tasks.length === 0 ? (
                <EmptyState
                    type="tasks"
                    title={filters.search || filters.status || filters.priority ? 'No matching tasks' : 'No tasks yet'}
                    description={
                        filters.search || filters.status || filters.priority
                            ? 'Try adjusting your filters'
                            : isManager
                                ? 'Create your first task to get started'
                                : 'No tasks have been assigned to you yet'
                    }
                    action={
                        isManager && !filters.search && !filters.status && !filters.priority
                            ? {
                                label: 'Create Task',
                                onClick: () => setShowCreateModal(true),
                            }
                            : undefined
                    }
                />
            ) : (
                <div className="grid gap-4">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onDelete={isManager ? () => handleDeleteTask(task.id) : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Create task modal */}
            {showCreateModal && (
                <CreateTaskModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateTask}
                />
            )}
        </div>
    );
}

function TaskCard({ task, onDelete }: { task: Task; onDelete?: () => void }) {
    const [showMenu, setShowMenu] = useState(false);

    const statusVariants: Record<TaskStatus, 'default' | 'info' | 'danger' | 'success'> = {
        backlog: 'default',
        in_progress: 'info',
        blocked: 'danger',
        done: 'success',
    };

    const priorityVariants: Record<TaskPriority, 'default' | 'warning' | 'danger'> = {
        low: 'default',
        medium: 'warning',
        high: 'danger',
        urgent: 'danger',
    };

    return (
        <Card hover className="relative">
            <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/tasks/${task.id}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            {task.title}
                        </h3>
                    </Link>
                    {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant={statusVariants[task.status]} size="sm">
                            {TASK_STATUSES[task.status].label}
                        </Badge>
                        <Badge variant={priorityVariants[task.priority]} size="sm">
                            {TASK_PRIORITIES[task.priority].label}
                        </Badge>
                        {task.tags?.map((tag) => (
                            <Badge key={tag} variant="default" size="sm">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                        {task.assigneeIds.length > 0 && (
                            <AvatarGroup max={3} size="sm">
                                {task.assigneeIds.map((id) => (
                                    <Avatar key={id} name={id} size="sm" />
                                ))}
                            </AvatarGroup>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-20 py-1">
                                        <Link
                                            href={`/dashboard/tasks/${task.id}`}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View details
                                        </Link>
                                        {onDelete && (
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    onDelete();
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <span
                        className={`text-sm font-medium ${isOverdue(task.dueDate)
                            ? 'text-red-600 dark:text-red-400'
                            : isDueSoon(task.dueDate)
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {formatDueDate(task.dueDate)}
                    </span>
                </div>
            </div>
        </Card>
    );
}

function CreateTaskModal({
    onClose,
    onSubmit,
}: {
    onClose: () => void;
    onSubmit: (data: CreateTaskData) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateTaskData>({
        title: '',
        description: '',
        assigneeIds: [],
        priority: 'medium',
        dueDate: undefined,
        tags: [],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    const priorityOptions = Object.entries(TASK_PRIORITIES).map(([value, { label }]) => ({
        value,
        label,
    }));

    return (
        <Modal isOpen onClose={onClose} title="Create Task" size="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Title"
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    error={errors.title}
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Description
                    </label>
                    <textarea
                        placeholder="Enter task description (optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Priority"
                        options={priorityOptions}
                        value={formData.priority}
                        onChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                    />

                    <Input
                        label="Due Date"
                        type="datetime-local"
                        value={
                            formData.dueDate
                                ? new Date(formData.dueDate).toISOString().slice(0, 16)
                                : ''
                        }
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                dueDate: e.target.value ? new Date(e.target.value) : undefined,
                            })
                        }
                    />
                </div>

                <Input
                    label="Tags"
                    placeholder="Enter tags separated by commas"
                    value={formData.tags?.join(', ')}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            tags: e.target.value
                                .split(',')
                                .map((t) => t.trim())
                                .filter(Boolean),
                        })
                    }
                    helperText="Tags help categorize and find tasks"
                />

                <ModalFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading}>
                        Create Task
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
