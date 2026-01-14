'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useIsManager } from '@/contexts/AuthContext';
import {
    getTaskById,
    updateTask,
    updateTaskStatus,
    getComments,
    createComment,
    deleteComment,
    getUsers
} from '@/lib/firebase/firestore';
import { APP_CONFIG, TASK_STATUSES, TASK_PRIORITIES, TASK_STATUS_TRANSITIONS } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { formatDateTime, formatDueDate, isOverdue, isDueSoon, formatDate } from '@/lib/utils/date';
import { generateId } from '@/lib/utils/helpers';
import type { Task, TaskStatus, TaskPriority, UpdateTaskData, Comment, User, ChecklistItem, AttachmentMeta } from '@/types';
import { Timestamp } from 'firebase/firestore';
import {
    ArrowLeft,
    Calendar,
    Clock,
    User as UserIcon,
    Tag,
    Edit2,
    Save,
    X,
    AlertTriangle,
    CheckSquare,
    Square,
    Plus,
    Send,
    Paperclip,
    ChevronDown,
    ChevronRight,
    MessageSquare,
    Trash2,
    Upload,
} from 'lucide-react';
import Link from 'next/link';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const isManager = useIsManager();
    const { success, error: showError } = useToast();

    const [task, setTask] = useState<Task | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<UpdateTaskData>({});
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        checklist: true,
        comments: true,
        attachments: true,
    });

    useEffect(() => {
        const loadTask = async () => {
            try {
                const [taskData, commentsData, usersData] = await Promise.all([
                    getTaskById(APP_CONFIG.defaultOrgId, resolvedParams.id),
                    getComments(APP_CONFIG.defaultOrgId, resolvedParams.id),
                    getUsers(APP_CONFIG.defaultOrgId)
                ]);

                if (!taskData) {
                    showError('Task not found');
                    router.push('/tasks');
                    return;
                }

                // Check if user can view this task
                if (!isManager && !taskData.assigneeIds.includes(user?.id || '')) {
                    showError('You do not have access to this task');
                    router.push('/tasks');
                    return;
                }

                setTask(taskData);
                setComments(commentsData);

                // Create users lookup map
                const usersMap: Record<string, User> = {};
                usersData.forEach(u => { usersMap[u.id] = u; });
                setUsers(usersMap);

                setEditData({
                    title: taskData.title,
                    description: taskData.description,
                    priority: taskData.priority,
                    dueDate: taskData.dueDate?.toDate(),
                    tags: taskData.tags,
                });
            } catch (err) {
                console.error('Failed to load task:', err);
                showError('Failed to load task');
            } finally {
                setLoading(false);
            }
        };

        loadTask();
    }, [resolvedParams.id, user, isManager, router, showError]);

    const handleStatusChange = async (newStatus: TaskStatus) => {
        if (!task) return;

        // Verify transition is allowed
        const allowedTransitions = TASK_STATUS_TRANSITIONS[task.status];
        if (!allowedTransitions.includes(newStatus)) {
            showError(`Cannot transition from ${task.status} to ${newStatus}`);
            return;
        }

        try {
            await updateTaskStatus(APP_CONFIG.defaultOrgId, task.id, newStatus);
            setTask({ ...task, status: newStatus });
            success('Status updated');
        } catch (err) {
            console.error('Failed to update status:', err);
            showError('Failed to update status');
        }
    };

    const handleSaveChanges = async () => {
        if (!task) return;

        setSaving(true);
        try {
            await updateTask(APP_CONFIG.defaultOrgId, task.id, editData);
            setTask({
                ...task,
                ...editData,
                dueDate: editData.dueDate ? { toDate: () => editData.dueDate } as unknown as Timestamp : task.dueDate,
            });
            setEditing(false);
            success('Task updated');
        } catch (err) {
            console.error('Failed to update task:', err);
            showError('Failed to update task');
        } finally {
            setSaving(false);
        }
    };

    // Checklist handlers
    const handleChecklistToggle = async (itemId: string) => {
        if (!task) return;
        const items = task.checklistItems || [];
        const updatedItems = items.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    completed: !item.completed,
                    completedAt: !item.completed ? Timestamp.now() : undefined,
                    completedBy: !item.completed ? user?.id : undefined
                }
                : item
        );

        try {
            await updateTask(APP_CONFIG.defaultOrgId, task.id, {
                checklistItems: updatedItems as ChecklistItem[]
            } as UpdateTaskData);
            setTask({ ...task, checklistItems: updatedItems as ChecklistItem[] });
        } catch (err) {
            console.error('Failed to update checklist:', err);
            showError('Failed to update checklist');
        }
    };

    const handleAddChecklistItem = async (text: string) => {
        if (!task || !text.trim()) return;
        const newItem: ChecklistItem = {
            id: generateId(),
            text: text.trim(),
            completed: false
        };
        const items = [...(task.checklistItems || []), newItem];

        try {
            await updateTask(APP_CONFIG.defaultOrgId, task.id, { checklistItems: items } as UpdateTaskData);
            setTask({ ...task, checklistItems: items });
            success('Checklist item added');
        } catch (err) {
            console.error('Failed to add checklist item:', err);
            showError('Failed to add checklist item');
        }
    };

    const handleRemoveChecklistItem = async (itemId: string) => {
        if (!task) return;
        const items = (task.checklistItems || []).filter(item => item.id !== itemId);

        try {
            await updateTask(APP_CONFIG.defaultOrgId, task.id, { checklistItems: items } as UpdateTaskData);
            setTask({ ...task, checklistItems: items });
        } catch (err) {
            console.error('Failed to remove checklist item:', err);
            showError('Failed to remove checklist item');
        }
    };

    // Comment handlers
    const handleAddComment = async () => {
        if (!user || !newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const comment = await createComment(
                APP_CONFIG.defaultOrgId,
                resolvedParams.id,
                newComment.trim(),
                user.id
            );
            setComments([...comments, comment]);
            setNewComment('');
            success('Comment added');
        } catch (err) {
            console.error('Failed to add comment:', err);
            showError('Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;
        try {
            await deleteComment(APP_CONFIG.defaultOrgId, resolvedParams.id, commentId);
            setComments(comments.filter(c => c.id !== commentId));
            success('Comment deleted');
        } catch (err) {
            console.error('Failed to delete comment:', err);
            showError('Failed to delete comment');
        }
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (loading) return <PageLoader />;
    if (!task) return null;

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

    const allowedTransitions = TASK_STATUS_TRANSITIONS[task.status];
    const isAssignee = task.assigneeIds.includes(user?.id || '');
    const canEdit = isManager || isAssignee;
    const canChangeStatus = canEdit && task.status !== 'done';

    const checklistProgress = task.checklistItems?.length
        ? Math.round((task.checklistItems.filter(i => i.completed).length / task.checklistItems.length) * 100)
        : 0;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/tasks">
                    <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                        Back
                    </Button>
                </Link>
            </div>

            {/* Main content */}
            <Card>
                <CardContent>
                    <div className="space-y-6">
                        {/* Title and actions */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                {editing ? (
                                    <Input
                                        value={editData.title}
                                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                        className="text-xl font-bold"
                                    />
                                ) : (
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {task.title}
                                    </h1>
                                )}
                            </div>
                            {isManager && (
                                <div className="flex items-center gap-2">
                                    {editing ? (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditing(false)}
                                                leftIcon={<X className="w-4 h-4" />}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveChanges}
                                                loading={saving}
                                                leftIcon={<Save className="w-4 h-4" />}
                                            >
                                                Save
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditing(true)}
                                            leftIcon={<Edit2 className="w-4 h-4" />}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Status badges */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant={statusVariants[task.status]} size="md">
                                {TASK_STATUSES[task.status].label}
                            </Badge>
                            <Badge variant={priorityVariants[task.priority]} size="md">
                                {TASK_PRIORITIES[task.priority].label}
                            </Badge>
                            {isOverdue(task.dueDate) && (
                                <Badge variant="danger" size="md">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Overdue
                                </Badge>
                            )}
                        </div>

                        {/* Status change buttons */}
                        {canChangeStatus && allowedTransitions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2 py-2">
                                    Change status:
                                </span>
                                {allowedTransitions.map((status) => (
                                    <Button
                                        key={status}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStatusChange(status as TaskStatus)}
                                    >
                                        {TASK_STATUSES[status as TaskStatus].label}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Description
                            </h3>
                            {editing ? (
                                <textarea
                                    value={editData.description || ''}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Add a description..."
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                    {task.description || 'No description provided.'}
                                </p>
                            )}
                        </div>

                        {/* Meta info grid */}
                        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            {/* Due date */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                                    {editing ? (
                                        <Input
                                            type="datetime-local"
                                            value={
                                                editData.dueDate
                                                    ? new Date(editData.dueDate).toISOString().slice(0, 16)
                                                    : ''
                                            }
                                            onChange={(e) =>
                                                setEditData({
                                                    ...editData,
                                                    dueDate: e.target.value ? new Date(e.target.value) : undefined,
                                                })
                                            }
                                        />
                                    ) : (
                                        <p
                                            className={`font-medium ${isOverdue(task.dueDate)
                                                ? 'text-red-600 dark:text-red-400'
                                                : isDueSoon(task.dueDate)
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-gray-900 dark:text-gray-100'
                                                }`}
                                        >
                                            {formatDueDate(task.dueDate)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
                                    {editing ? (
                                        <Select
                                            options={Object.entries(TASK_PRIORITIES).map(([value, { label }]) => ({
                                                value,
                                                label,
                                            }))}
                                            value={editData.priority || task.priority}
                                            onChange={(value) =>
                                                setEditData({ ...editData, priority: value as TaskPriority })
                                            }
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {TASK_PRIORITIES[task.priority].label}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Assignees */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Assignees</p>
                                    {task.assigneeIds.length > 0 ? (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {task.assigneeIds.map((id) => (
                                                <Badge key={id} size="sm">
                                                    {users[id]?.displayName || id}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">No assignees</p>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Tag className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Tags</p>
                                    {editing ? (
                                        <Input
                                            value={editData.tags?.join(', ')}
                                            onChange={(e) =>
                                                setEditData({
                                                    ...editData,
                                                    tags: e.target.value
                                                        .split(',')
                                                        .map((t) => t.trim())
                                                        .filter(Boolean),
                                                })
                                            }
                                            placeholder="Enter tags separated by commas"
                                        />
                                    ) : task.tags && task.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {task.tags.map((tag) => (
                                                <Badge key={tag} variant="default" size="sm">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-900 dark:text-gray-100">No tags</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Created {formatDateTime(task.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Checklist Section */}
            <Card>
                <CardContent>
                    <button
                        onClick={() => toggleSection('checklist')}
                        className="flex items-center justify-between w-full"
                    >
                        <div className="flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                                Checklist
                            </h2>
                            {task.checklistItems && task.checklistItems.length > 0 && (
                                <span className="text-sm text-gray-500">
                                    ({task.checklistItems.filter(i => i.completed).length}/{task.checklistItems.length})
                                </span>
                            )}
                        </div>
                        {expandedSections.checklist ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                    </button>

                    {expandedSections.checklist && (
                        <div className="mt-4 space-y-3">
                            {/* Progress bar */}
                            {task.checklistItems && task.checklistItems.length > 0 && (
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${checklistProgress}%` }}
                                    />
                                </div>
                            )}

                            {/* Checklist items */}
                            <div className="space-y-2">
                                {task.checklistItems?.map(item => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group"
                                    >
                                        <button
                                            onClick={() => handleChecklistToggle(item.id)}
                                            className="flex-shrink-0"
                                        >
                                            {item.completed ? (
                                                <CheckSquare className="w-5 h-5 text-indigo-600" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>
                                        <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {item.text}
                                        </span>
                                        {canEdit && (
                                            <button
                                                onClick={() => handleRemoveChecklistItem(item.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add new item */}
                            {canEdit && <AddChecklistItem onAdd={handleAddChecklistItem} />}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
                <CardContent>
                    <button
                        onClick={() => toggleSection('comments')}
                        className="flex items-center justify-between w-full"
                    >
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                                Comments
                            </h2>
                            {comments.length > 0 && (
                                <span className="text-sm text-gray-500">({comments.length})</span>
                            )}
                        </div>
                        {expandedSections.comments ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                    </button>

                    {expandedSections.comments && (
                        <div className="mt-4 space-y-4">
                            {/* Comments list */}
                            {comments.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">
                                    No comments yet. Be the first to comment!
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map(comment => (
                                        <CommentCard
                                            key={comment.id}
                                            comment={comment}
                                            author={users[comment.authorId]}
                                            canDelete={user?.id === comment.authorId || isManager}
                                            onDelete={() => handleDeleteComment(comment.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Add comment */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Avatar name={user?.displayName || 'U'} size="sm" />
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    <Button
                                        onClick={handleAddComment}
                                        loading={submittingComment}
                                        disabled={!newComment.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attachments Section */}
            <Card>
                <CardContent>
                    <button
                        onClick={() => toggleSection('attachments')}
                        className="flex items-center justify-between w-full"
                    >
                        <div className="flex items-center gap-2">
                            <Paperclip className="w-5 h-5 text-indigo-600" />
                            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                                Attachments
                            </h2>
                            {task.attachments && task.attachments.length > 0 && (
                                <span className="text-sm text-gray-500">({task.attachments.length})</span>
                            )}
                        </div>
                        {expandedSections.attachments ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                    </button>

                    {expandedSections.attachments && (
                        <div className="mt-4">
                            {task.attachments && task.attachments.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {task.attachments.map(attachment => (
                                        <AttachmentCard key={attachment.id} attachment={attachment} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No attachments yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Upload files coming soon</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function AddChecklistItem({ onAdd }: { onAdd: (text: string) => void }) {
    const [text, setText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleSubmit = () => {
        if (text.trim()) {
            onAdd(text.trim());
            setText('');
            setIsAdding(false);
        }
    };

    if (!isAdding) {
        return (
            <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 px-2 py-1"
            >
                <Plus className="w-4 h-4" />
                Add item
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                placeholder="Enter checklist item..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') handleSubmit();
                    if (e.key === 'Escape') setIsAdding(false);
                }}
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button size="sm" onClick={handleSubmit}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
        </div>
    );
}

function CommentCard({
    comment,
    author,
    canDelete,
    onDelete
}: {
    comment: Comment;
    author?: User;
    canDelete: boolean;
    onDelete: () => void;
}) {
    return (
        <div className="flex gap-3 group">
            <Avatar name={author?.displayName || 'U'} size="sm" />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {author?.displayName || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt, 'MMM d, h:mm a')}
                    </span>
                    {canDelete && (
                        <button
                            onClick={onDelete}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all ml-auto"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {comment.content}
                </p>
            </div>
        </div>
    );
}

function AttachmentCard({ attachment }: { attachment: AttachmentMeta }) {
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎬';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
        if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
        return '📎';
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <span className="text-2xl">{getFileIcon(attachment.mimeType)}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.fileName}
                </p>
                <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.fileSize)}
                </p>
            </div>
        </div>
    );
}
