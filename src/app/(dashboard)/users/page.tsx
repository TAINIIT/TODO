'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { getUsers, createUser, updateUser, disableUser, activateUser } from '@/lib/firebase/firestore';
import { sendInviteEmail } from '@/lib/firebase/auth';
import { APP_CONFIG, USER_ROLES } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { SectionLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/utils/date';
import type { User, UserRole, UserStatus, CreateUserData } from '@/types';
import { Plus, Search, MoreVertical, UserCheck, UserX, Mail, Shield } from 'lucide-react';
import { generateId } from '@/lib/utils/helpers';

export default function UsersPage() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const { success, error: showError } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const usersData = await getUsers(APP_CONFIG.defaultOrgId, {
                role: roleFilter || undefined,
                status: statusFilter || undefined,
            });
            setUsers(usersData);
        } catch (err) {
            console.error('Failed to load users:', err);
            showError('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [roleFilter, statusFilter, showError]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Filter users by search query
    const filteredUsers = users.filter((u) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            u.displayName.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
    });

    const handleInviteUser = async (data: CreateUserData) => {
        if (!user) return;

        try {
            // Generate a temporary user ID (will be replaced when user signs up via invite link)
            const tempUserId = generateId();

            // Create user document in Firestore with pending status
            await createUser(APP_CONFIG.defaultOrgId, tempUserId, data, user.id);

            // Send password reset email (acts as invite)
            await sendInviteEmail(data.email);

            success('Invitation sent successfully');
            setShowInviteModal(false);
            loadUsers();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to send invitation';
            showError(message);
        }
    };

    const handleToggleUserStatus = async (targetUser: User) => {
        try {
            if (targetUser.status === 'disabled') {
                await activateUser(APP_CONFIG.defaultOrgId, targetUser.id);
                success('User activated');
            } else {
                await disableUser(APP_CONFIG.defaultOrgId, targetUser.id);
                success('User disabled');
            }
            loadUsers();
        } catch (err) {
            console.error('Failed to update user status:', err);
            showError('Failed to update user status');
        }
    };

    const handleChangeRole = async (targetUser: User, newRole: UserRole) => {
        try {
            await updateUser(APP_CONFIG.defaultOrgId, targetUser.id, { role: newRole });
            success('User role updated');
            loadUsers();
        } catch (err) {
            console.error('Failed to update user role:', err);
            showError('Failed to update user role');
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-500 dark:text-gray-400">You do not have permission to view this page.</p>
            </div>
        );
    }

    const roleOptions = [
        { value: '', label: 'All Roles' },
        ...Object.entries(USER_ROLES).map(([value, { label }]) => ({ value, label })),
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'active', label: 'Active' },
        { value: 'disabled', label: 'Disabled' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage your organization's users
                    </p>
                </div>
                <Button onClick={() => setShowInviteModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Invite User
                </Button>
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Select
                            options={roleOptions}
                            value={roleFilter}
                            onChange={setRoleFilter}
                            placeholder="Role"
                        />
                        <Select
                            options={statusOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Status"
                        />
                    </div>
                </div>
            </Card>

            {/* Users list */}
            {loading ? (
                <SectionLoader />
            ) : filteredUsers.length === 0 ? (
                <EmptyState
                    type="users"
                    title={searchQuery || roleFilter || statusFilter ? 'No matching users' : 'No users yet'}
                    description={
                        searchQuery || roleFilter || statusFilter
                            ? 'Try adjusting your filters'
                            : 'Invite your first team member'
                    }
                    action={
                        !searchQuery && !roleFilter && !statusFilter
                            ? {
                                label: 'Invite User',
                                onClick: () => setShowInviteModal(true),
                            }
                            : undefined
                    }
                />
            ) : (
                <div className="grid gap-4">
                    {filteredUsers.map((u) => (
                        <UserCard
                            key={u.id}
                            user={u}
                            currentUserId={user?.id || ''}
                            onToggleStatus={() => handleToggleUserStatus(u)}
                            onChangeRole={(role) => handleChangeRole(u, role)}
                        />
                    ))}
                </div>
            )}

            {/* Invite user modal */}
            {showInviteModal && (
                <InviteUserModal
                    onClose={() => setShowInviteModal(false)}
                    onSubmit={handleInviteUser}
                />
            )}
        </div>
    );
}

function UserCard({
    user,
    currentUserId,
    onToggleStatus,
    onChangeRole,
}: {
    user: User;
    currentUserId: string;
    onToggleStatus: () => void;
    onChangeRole: (role: UserRole) => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showRoleMenu, setShowRoleMenu] = useState(false);

    const statusVariants: Record<UserStatus, 'warning' | 'success' | 'danger'> = {
        pending: 'warning',
        active: 'success',
        disabled: 'danger',
    };

    const roleVariants: Record<UserRole, 'danger' | 'warning' | 'default'> = {
        admin: 'danger',
        manager: 'warning',
        employee: 'default',
    };

    const isSelf = user.id === currentUserId;

    return (
        <Card>
            <div className="flex items-center gap-4">
                <Avatar name={user.displayName} src={user.avatarUrl} size="lg" />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {user.displayName}
                        </h3>
                        {isSelf && (
                            <Badge variant="info" size="sm">You</Badge>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant={roleVariants[user.role]} size="sm">
                            {USER_ROLES[user.role].label}
                        </Badge>
                        <Badge variant={statusVariants[user.status]} size="sm">
                            {user.status}
                        </Badge>
                    </div>
                </div>

                <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last login</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                        {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                    </p>
                </div>

                {!isSelf && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-20 py-1">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowRoleMenu(!showRoleMenu)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Change role
                                        </button>
                                        {showRoleMenu && (
                                            <div className="absolute left-full top-0 ml-1 w-32 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-1">
                                                {Object.entries(USER_ROLES).map(([value, { label }]) => (
                                                    <button
                                                        key={value}
                                                        onClick={() => {
                                                            onChangeRole(value as UserRole);
                                                            setShowMenu(false);
                                                            setShowRoleMenu(false);
                                                        }}
                                                        className={`px-3 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${user.role === value
                                                                ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            onToggleStatus();
                                            setShowMenu(false);
                                        }}
                                        className={`flex items-center gap-2 px-3 py-2 text-sm w-full ${user.status === 'disabled'
                                                ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                            }`}
                                    >
                                        {user.status === 'disabled' ? (
                                            <>
                                                <UserCheck className="w-4 h-4" />
                                                Activate user
                                            </>
                                        ) : (
                                            <>
                                                <UserX className="w-4 h-4" />
                                                Disable user
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            sendInviteEmail(user.email);
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Resend invite
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}

function InviteUserModal({
    onClose,
    onSubmit,
}: {
    onClose: () => void;
    onSubmit: (data: CreateUserData) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateUserData>({
        email: '',
        displayName: '',
        role: 'employee',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        } else if (!formData.email.toLowerCase().endsWith('@tsb.com.vn')) {
            newErrors.email = 'Only @tsb.com.vn emails are allowed';
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

    const roleOptions = Object.entries(USER_ROLES).map(([value, { label }]) => ({
        value,
        label,
    }));

    return (
        <Modal isOpen onClose={onClose} title="Invite User" size="md">
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    error={errors.displayName}
                    required
                />

                <Input
                    label="Email"
                    type="email"
                    placeholder="john@tsb.com.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    helperText="An invitation email will be sent to this address"
                    required
                />

                <Select
                    label="Role"
                    options={roleOptions}
                    value={formData.role}
                    onChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                />

                <ModalFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading} leftIcon={<Mail className="w-4 h-4" />}>
                        Send Invitation
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
