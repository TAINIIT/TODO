'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { getTeams, createTeam, updateTeam, deleteTeam, getUsers } from '@/lib/firebase/firestore';
import { APP_CONFIG } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Avatar, { AvatarGroup } from '@/components/ui/Avatar';
import { SectionLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import type { Team, User, CreateTeamData } from '@/types';
import { Plus, Users, Edit2, Trash2, MoreVertical } from 'lucide-react';

export default function TeamsPage() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const { success, error: showError } = useToast();

    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    const loadData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const [teamsData, usersData] = await Promise.all([
                isAdmin ? getTeams(APP_CONFIG.defaultOrgId) : getTeams(APP_CONFIG.defaultOrgId, user.id),
                getUsers(APP_CONFIG.defaultOrgId, { status: 'active' }),
            ]);
            setTeams(teamsData);
            setUsers(usersData);
        } catch (err) {
            console.error('Failed to load teams:', err);
            showError('Failed to load teams');
        } finally {
            setLoading(false);
        }
    }, [user, isAdmin, showError]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateTeam = async (data: CreateTeamData) => {
        if (!user) return;

        try {
            await createTeam(APP_CONFIG.defaultOrgId, data, user.id);
            success('Team created successfully');
            setShowCreateModal(false);
            loadData();
        } catch (err) {
            console.error('Failed to create team:', err);
            showError('Failed to create team');
        }
    };

    const handleUpdateTeam = async (teamId: string, data: Partial<CreateTeamData>) => {
        try {
            await updateTeam(APP_CONFIG.defaultOrgId, teamId, data);
            success('Team updated successfully');
            setEditingTeam(null);
            loadData();
        } catch (err) {
            console.error('Failed to update team:', err);
            showError('Failed to update team');
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Are you sure you want to delete this team?')) return;

        try {
            await deleteTeam(APP_CONFIG.defaultOrgId, teamId);
            success('Team deleted');
            loadData();
        } catch (err) {
            console.error('Failed to delete team:', err);
            showError('Failed to delete team');
        }
    };

    const getUserName = (userId: string) => {
        const foundUser = users.find((u) => u.id === userId);
        return foundUser?.displayName || userId;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Teams</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage your organization's teams
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                        Create Team
                    </Button>
                )}
            </div>

            {/* Teams list */}
            {loading ? (
                <SectionLoader />
            ) : teams.length === 0 ? (
                <EmptyState
                    type="users"
                    title="No teams yet"
                    description={isAdmin ? 'Create your first team to organize your workforce' : 'No teams are assigned to you'}
                    action={
                        isAdmin
                            ? {
                                label: 'Create Team',
                                onClick: () => setShowCreateModal(true),
                            }
                            : undefined
                    }
                />
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            getUserName={getUserName}
                            onEdit={isAdmin ? () => setEditingTeam(team) : undefined}
                            onDelete={isAdmin ? () => handleDeleteTeam(team.id) : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Create team modal */}
            {showCreateModal && (
                <TeamFormModal
                    users={users}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateTeam}
                />
            )}

            {/* Edit team modal */}
            {editingTeam && (
                <TeamFormModal
                    team={editingTeam}
                    users={users}
                    onClose={() => setEditingTeam(null)}
                    onSubmit={(data) => handleUpdateTeam(editingTeam.id, data)}
                />
            )}
        </div>
    );
}

function TeamCard({
    team,
    getUserName,
    onEdit,
    onDelete,
}: {
    team: Team;
    getUserName: (id: string) => string;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <Card hover className="relative">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{team.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {team.memberIds.length} member{team.memberIds.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {(onEdit || onDelete) && (
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
                                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-20 py-1">
                                    {onEdit && (
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                onEdit();
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </button>
                                    )}
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
                )}
            </div>

            {team.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                    {team.description}
                </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Managers</p>
                        {team.managerIds.length > 0 ? (
                            <AvatarGroup max={3} size="xs">
                                {team.managerIds.map((id) => (
                                    <Avatar key={id} name={getUserName(id)} size="xs" />
                                ))}
                            </AvatarGroup>
                        ) : (
                            <span className="text-xs text-gray-400">None</span>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Members</p>
                        {team.memberIds.length > 0 ? (
                            <AvatarGroup max={4} size="xs">
                                {team.memberIds.map((id) => (
                                    <Avatar key={id} name={getUserName(id)} size="xs" />
                                ))}
                            </AvatarGroup>
                        ) : (
                            <span className="text-xs text-gray-400">None</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

function TeamFormModal({
    team,
    users,
    onClose,
    onSubmit,
}: {
    team?: Team;
    users: User[];
    onClose: () => void;
    onSubmit: (data: CreateTeamData) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateTeamData>({
        name: team?.name || '',
        description: team?.description || '',
        managerIds: team?.managerIds || [],
        memberIds: team?.memberIds || [],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
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

    const toggleUser = (userId: string, list: 'managerIds' | 'memberIds') => {
        const currentList = formData[list];
        if (currentList.includes(userId)) {
            setFormData({ ...formData, [list]: currentList.filter((id) => id !== userId) });
        } else {
            setFormData({ ...formData, [list]: [...currentList, userId] });
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={team ? 'Edit Team' : 'Create Team'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Team Name"
                    placeholder="Enter team name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Description
                    </label>
                    <textarea
                        placeholder="Enter team description (optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Managers
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                        {users.filter((u) => u.role !== 'employee').map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => toggleUser(u.id, 'managerIds')}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${formData.managerIds.includes(u.id)
                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Avatar name={u.displayName} size="xs" />
                                {u.displayName}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Members
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                        {users.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => toggleUser(u.id, 'memberIds')}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${formData.memberIds.includes(u.id)
                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Avatar name={u.displayName} size="xs" />
                                {u.displayName}
                            </button>
                        ))}
                    </div>
                </div>

                <ModalFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading}>
                        {team ? 'Save Changes' : 'Create Team'}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
