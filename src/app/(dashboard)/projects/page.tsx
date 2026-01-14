'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, useIsAdmin, useIsManager } from '@/contexts/AuthContext';
import { getProjects, createProject, updateProject, deleteProject, getUsers, getTeams } from '@/lib/firebase/firestore';
import { APP_CONFIG, PROJECT_STATUSES } from '@/lib/constants';
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
import { formatDate } from '@/lib/utils/date';
import type { Project, User, Team, CreateProjectData, ProjectStatus } from '@/types';
import { Plus, FolderKanban, Edit2, Trash2, MoreVertical, Calendar } from 'lucide-react';

export default function ProjectsPage() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const isManager = useIsManager();
    const { success, error: showError } = useToast();

    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const loadData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const [projectsData, usersData, teamsData] = await Promise.all([
                isAdmin
                    ? getProjects(APP_CONFIG.defaultOrgId, { status: statusFilter || undefined })
                    : getProjects(APP_CONFIG.defaultOrgId, { managerId: user.id, status: statusFilter || undefined }),
                getUsers(APP_CONFIG.defaultOrgId, { status: 'active' }),
                getTeams(APP_CONFIG.defaultOrgId),
            ]);
            setProjects(projectsData);
            setUsers(usersData);
            setTeams(teamsData);
        } catch (err) {
            console.error('Failed to load projects:', err);
            showError('Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, [user, isAdmin, statusFilter, showError]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateProject = async (data: CreateProjectData) => {
        if (!user) return;

        try {
            await createProject(APP_CONFIG.defaultOrgId, data, user.id);
            success('Project created successfully');
            setShowCreateModal(false);
            loadData();
        } catch (err) {
            console.error('Failed to create project:', err);
            showError('Failed to create project');
        }
    };

    const handleUpdateProject = async (projectId: string, data: Partial<CreateProjectData>) => {
        try {
            await updateProject(APP_CONFIG.defaultOrgId, projectId, data);
            success('Project updated successfully');
            setEditingProject(null);
            loadData();
        } catch (err) {
            console.error('Failed to update project:', err);
            showError('Failed to update project');
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await deleteProject(APP_CONFIG.defaultOrgId, projectId);
            success('Project deleted');
            loadData();
        } catch (err) {
            console.error('Failed to delete project:', err);
            showError('Failed to delete project');
        }
    };

    const getUserName = (userId: string) => {
        const foundUser = users.find((u) => u.id === userId);
        return foundUser?.displayName || userId;
    };

    const getTeamName = (teamId: string) => {
        const team = teams.find((t) => t.id === teamId);
        return team?.name || teamId;
    };

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        ...Object.entries(PROJECT_STATUSES).map(([value, { label }]) => ({ value, label })),
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage your organization's projects
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="Filter by status"
                    />
                    {isManager && (
                        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                            Create Project
                        </Button>
                    )}
                </div>
            </div>

            {/* Projects list */}
            {loading ? (
                <SectionLoader />
            ) : projects.length === 0 ? (
                <EmptyState
                    type="projects"
                    title={statusFilter ? 'No matching projects' : 'No projects yet'}
                    description={
                        statusFilter
                            ? 'Try changing your filter'
                            : isManager
                                ? 'Create your first project to get started'
                                : 'No projects are assigned to you'
                    }
                    action={
                        isManager && !statusFilter
                            ? {
                                label: 'Create Project',
                                onClick: () => setShowCreateModal(true),
                            }
                            : undefined
                    }
                />
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            getUserName={getUserName}
                            getTeamName={getTeamName}
                            onEdit={isManager ? () => setEditingProject(project) : undefined}
                            onDelete={isAdmin ? () => handleDeleteProject(project.id) : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Create project modal */}
            {showCreateModal && (
                <ProjectFormModal
                    users={users}
                    teams={teams}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateProject}
                />
            )}

            {/* Edit project modal */}
            {editingProject && (
                <ProjectFormModal
                    project={editingProject}
                    users={users}
                    teams={teams}
                    onClose={() => setEditingProject(null)}
                    onSubmit={(data) => handleUpdateProject(editingProject.id, data)}
                />
            )}
        </div>
    );
}

function ProjectCard({
    project,
    getUserName,
    getTeamName,
    onEdit,
    onDelete,
}: {
    project: Project;
    getUserName: (id: string) => string;
    getTeamName: (id: string) => string;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    const statusVariants: Record<ProjectStatus, 'success' | 'info' | 'default'> = {
        active: 'success',
        completed: 'info',
        archived: 'default',
    };

    return (
        <Card hover className="relative">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <FolderKanban className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                        {project.teamId && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {getTeamName(project.teamId)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant={statusVariants[project.status]} size="sm">
                        {PROJECT_STATUSES[project.status].label}
                    </Badge>

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
            </div>

            {project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                    {project.description}
                </p>
            )}

            {(project.startDate || project.endDate) && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                        {project.startDate && formatDate(project.startDate)}
                        {project.startDate && project.endDate && ' → '}
                        {project.endDate && formatDate(project.endDate)}
                    </span>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Managers</p>
                        {project.managerIds.length > 0 ? (
                            <AvatarGroup max={3} size="xs">
                                {project.managerIds.map((id) => (
                                    <Avatar key={id} name={getUserName(id)} size="xs" />
                                ))}
                            </AvatarGroup>
                        ) : (
                            <span className="text-xs text-gray-400">None</span>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {project.memberIds.length} member{project.memberIds.length !== 1 ? 's' : ''}
                        </p>
                        {project.memberIds.length > 0 && (
                            <AvatarGroup max={4} size="xs">
                                {project.memberIds.map((id) => (
                                    <Avatar key={id} name={getUserName(id)} size="xs" />
                                ))}
                            </AvatarGroup>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

function ProjectFormModal({
    project,
    users,
    teams,
    onClose,
    onSubmit,
}: {
    project?: Project;
    users: User[];
    teams: Team[];
    onClose: () => void;
    onSubmit: (data: CreateProjectData) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateProjectData>({
        name: project?.name || '',
        description: project?.description || '',
        teamId: project?.teamId || '',
        managerIds: project?.managerIds || [],
        memberIds: project?.memberIds || [],
        status: project?.status || 'active',
        startDate: project?.startDate?.toDate(),
        endDate: project?.endDate?.toDate(),
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

    const teamOptions = [
        { value: '', label: 'No team' },
        ...teams.map((t) => ({ value: t.id, label: t.name })),
    ];

    const statusOptions = Object.entries(PROJECT_STATUSES).map(([value, { label }]) => ({
        value,
        label,
    }));

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={project ? 'Edit Project' : 'Create Project'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Project Name"
                    placeholder="Enter project name"
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
                        placeholder="Enter project description (optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Team"
                        options={teamOptions}
                        value={formData.teamId || ''}
                        onChange={(value) => setFormData({ ...formData, teamId: value })}
                    />
                    <Select
                        label="Status"
                        options={statusOptions}
                        value={formData.status || 'active'}
                        onChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Start Date"
                        type="date"
                        value={formData.startDate ? formData.startDate.toISOString().slice(0, 10) : ''}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                startDate: e.target.value ? new Date(e.target.value) : undefined,
                            })
                        }
                    />
                    <Input
                        label="End Date"
                        type="date"
                        value={formData.endDate ? formData.endDate.toISOString().slice(0, 10) : ''}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                endDate: e.target.value ? new Date(e.target.value) : undefined,
                            })
                        }
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
                        {project ? 'Save Changes' : 'Create Project'}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
