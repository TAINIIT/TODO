import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    DocumentSnapshot,
    QueryConstraint,
    writeBatch,
    arrayUnion,
    onSnapshot,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type {
    User,
    Team,
    Project,
    Task,
    Comment,
    AuditLog,
    CreateUserData,
    CreateTeamData,
    CreateProjectData,
    CreateTaskData,
    UpdateTaskData,
    ReminderSettings,
} from '@/types';

// Collection paths
const getUsersPath = (orgId: string) => `orgs/${orgId}/users`;
const getTeamsPath = (orgId: string) => `orgs/${orgId}/teams`;
const getProjectsPath = (orgId: string) => `orgs/${orgId}/projects`;
const getTasksPath = (orgId: string) => `orgs/${orgId}/tasks`;
const getCommentsPath = (orgId: string, taskId: string) => `orgs/${orgId}/tasks/${taskId}/comments`;
const getAuditLogsPath = (orgId: string) => `orgs/${orgId}/auditLogs`;
const getReminderSettingsPath = (orgId: string) => `orgs/${orgId}/reminderSettings`;

// ============== USER OPERATIONS ==============

export async function getUserById(orgId: string, userId: string): Promise<User | null> {
    const docRef = doc(db, getUsersPath(orgId), userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as User;
}

export async function getUserByEmail(orgId: string, email: string): Promise<User | null> {
    const q = query(
        collection(db, getUsersPath(orgId)),
        where('email', '==', email.toLowerCase()),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
}

export async function getUsers(
    orgId: string,
    filters?: {
        role?: string;
        status?: string;
        teamId?: string;
    }
): Promise<User[]> {
    const constraints: QueryConstraint[] = [];

    if (filters?.role) {
        constraints.push(where('role', '==', filters.role));
    }
    if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
    }
    if (filters?.teamId) {
        constraints.push(where('teamIds', 'array-contains', filters.teamId));
    }

    constraints.push(orderBy('displayName', 'asc'));

    const q = query(collection(db, getUsersPath(orgId)), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function createUser(
    orgId: string,
    userId: string,
    data: CreateUserData,
    createdBy: string
): Promise<User> {
    const now = Timestamp.now();
    const user: Omit<User, 'id'> = {
        orgId,
        email: data.email.toLowerCase(),
        displayName: data.displayName,
        role: data.role,
        status: 'pending',
        managedTeamIds: [],
        managedProjectIds: [],
        teamIds: data.teamIds || [],
        projectIds: data.projectIds || [],
        createdAt: now,
        updatedAt: now,
        createdBy,
    };

    await setDoc(doc(db, getUsersPath(orgId), userId), user);
    return { id: userId, ...user };
}

export async function updateUser(
    orgId: string,
    userId: string,
    data: Partial<User>
): Promise<void> {
    const docRef = doc(db, getUsersPath(orgId), userId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function disableUser(orgId: string, userId: string): Promise<void> {
    await updateUser(orgId, userId, { status: 'disabled' });
}

export async function activateUser(orgId: string, userId: string): Promise<void> {
    await updateUser(orgId, userId, { status: 'active' });
}

// ============== TEAM OPERATIONS ==============

export async function getTeamById(orgId: string, teamId: string): Promise<Team | null> {
    const docRef = doc(db, getTeamsPath(orgId), teamId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Team;
}

export async function getTeams(orgId: string, managerId?: string): Promise<Team[]> {
    let q;
    if (managerId) {
        q = query(
            collection(db, getTeamsPath(orgId)),
            where('managerIds', 'array-contains', managerId)
        );
    } else {
        q = query(collection(db, getTeamsPath(orgId)));
    }

    const snapshot = await getDocs(q);
    const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
    // Sort client-side to avoid composite index requirement
    return teams.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTeam(
    orgId: string,
    data: CreateTeamData,
    createdBy: string
): Promise<Team> {
    const now = Timestamp.now();
    const teamRef = doc(collection(db, getTeamsPath(orgId)));

    const team: Omit<Team, 'id'> = {
        orgId,
        name: data.name,
        description: data.description,
        managerIds: data.managerIds,
        memberIds: data.memberIds,
        createdAt: now,
        updatedAt: now,
        createdBy,
    };

    await setDoc(teamRef, team);

    // Update users' teamIds
    const batch = writeBatch(db);
    for (const memberId of data.memberIds) {
        const userRef = doc(db, getUsersPath(orgId), memberId);
        batch.update(userRef, {
            teamIds: arrayUnion(teamRef.id),
            updatedAt: now,
        });
    }
    for (const managerId of data.managerIds) {
        const userRef = doc(db, getUsersPath(orgId), managerId);
        batch.update(userRef, {
            managedTeamIds: arrayUnion(teamRef.id),
            updatedAt: now,
        });
    }
    await batch.commit();

    return { id: teamRef.id, ...team };
}

export async function updateTeam(
    orgId: string,
    teamId: string,
    data: Partial<CreateTeamData>
): Promise<void> {
    const docRef = doc(db, getTeamsPath(orgId), teamId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteTeam(orgId: string, teamId: string): Promise<void> {
    await deleteDoc(doc(db, getTeamsPath(orgId), teamId));
}

// ============== PROJECT OPERATIONS ==============

export async function getProjectById(orgId: string, projectId: string): Promise<Project | null> {
    const docRef = doc(db, getProjectsPath(orgId), projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Project;
}

export async function getProjects(
    orgId: string,
    filters?: {
        managerId?: string;
        teamId?: string;
        status?: string;
        memberId?: string;
    }
): Promise<Project[]> {
    const constraints: QueryConstraint[] = [];

    if (filters?.managerId) {
        constraints.push(where('managerIds', 'array-contains', filters.managerId));
    }
    if (filters?.teamId) {
        constraints.push(where('teamId', '==', filters.teamId));
    }
    if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
    }
    if (filters?.memberId) {
        constraints.push(where('memberIds', 'array-contains', filters.memberId));
    }

    // Remove orderBy to avoid composite index requirement
    const q = query(collection(db, getProjectsPath(orgId)), ...constraints);
    const snapshot = await getDocs(q);
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    // Sort client-side
    return projects.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createProject(
    orgId: string,
    data: CreateProjectData,
    createdBy: string
): Promise<Project> {
    const now = Timestamp.now();
    const projectRef = doc(collection(db, getProjectsPath(orgId)));

    const project: Omit<Project, 'id'> = {
        orgId,
        name: data.name,
        description: data.description,
        teamId: data.teamId,
        managerIds: data.managerIds,
        memberIds: data.memberIds,
        status: data.status || 'active',
        startDate: data.startDate ? Timestamp.fromDate(data.startDate) : undefined,
        endDate: data.endDate ? Timestamp.fromDate(data.endDate) : undefined,
        createdAt: now,
        updatedAt: now,
        createdBy,
    };

    await setDoc(projectRef, project);

    // Update users' projectIds
    const batch = writeBatch(db);
    for (const memberId of data.memberIds) {
        const userRef = doc(db, getUsersPath(orgId), memberId);
        batch.update(userRef, {
            projectIds: arrayUnion(projectRef.id),
            updatedAt: now,
        });
    }
    for (const managerId of data.managerIds) {
        const userRef = doc(db, getUsersPath(orgId), managerId);
        batch.update(userRef, {
            managedProjectIds: arrayUnion(projectRef.id),
            updatedAt: now,
        });
    }
    await batch.commit();

    return { id: projectRef.id, ...project };
}

export async function updateProject(
    orgId: string,
    projectId: string,
    data: Partial<CreateProjectData>
): Promise<void> {
    const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate);
    }
    if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate);
    }

    const docRef = doc(db, getProjectsPath(orgId), projectId);
    await updateDoc(docRef, updateData);
}

export async function deleteProject(orgId: string, projectId: string): Promise<void> {
    await deleteDoc(doc(db, getProjectsPath(orgId), projectId));
}

// ============== TASK OPERATIONS ==============

export async function getTaskById(orgId: string, taskId: string): Promise<Task | null> {
    const docRef = doc(db, getTasksPath(orgId), taskId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Task;
}

export async function getTasks(
    orgId: string,
    filters?: {
        assigneeId?: string;
        projectId?: string;
        teamId?: string;
        status?: string | string[];
        priority?: string;
        dueBefore?: Date;
        dueAfter?: Date;
    },
    pagination?: {
        limit?: number;
        startAfter?: DocumentSnapshot;
    }
): Promise<Task[]> {
    const constraints: QueryConstraint[] = [];

    if (filters?.assigneeId) {
        constraints.push(where('assigneeIds', 'array-contains', filters.assigneeId));
    }
    if (filters?.projectId) {
        constraints.push(where('projectId', '==', filters.projectId));
    }
    if (filters?.teamId) {
        constraints.push(where('teamId', '==', filters.teamId));
    }
    if (filters?.status) {
        if (Array.isArray(filters.status)) {
            constraints.push(where('status', 'in', filters.status));
        } else {
            constraints.push(where('status', '==', filters.status));
        }
    }
    if (filters?.priority) {
        constraints.push(where('priority', '==', filters.priority));
    }
    if (filters?.dueBefore) {
        constraints.push(where('dueDate', '<=', Timestamp.fromDate(filters.dueBefore)));
    }
    if (filters?.dueAfter) {
        constraints.push(where('dueDate', '>=', Timestamp.fromDate(filters.dueAfter)));
    }

    constraints.push(orderBy('dueDate', 'asc'));

    if (pagination?.limit) {
        constraints.push(limit(pagination.limit));
    }
    if (pagination?.startAfter) {
        constraints.push(startAfter(pagination.startAfter));
    }

    const q = query(collection(db, getTasksPath(orgId)), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

export async function getOverdueTasks(orgId: string, assigneeId?: string): Promise<Task[]> {
    const constraints: QueryConstraint[] = [
        where('status', 'in', ['backlog', 'in_progress', 'blocked']),
        where('dueDate', '<', Timestamp.now()),
        orderBy('dueDate', 'asc'),
    ];

    if (assigneeId) {
        constraints.unshift(where('assigneeIds', 'array-contains', assigneeId));
    }

    const q = query(collection(db, getTasksPath(orgId)), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

export async function createTask(
    orgId: string,
    data: CreateTaskData,
    createdBy: string
): Promise<Task> {
    const now = Timestamp.now();
    const taskRef = doc(collection(db, getTasksPath(orgId)));

    const task: Omit<Task, 'id'> = {
        orgId,
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        teamId: data.teamId,
        assigneeIds: data.assigneeIds,
        status: 'backlog',
        priority: data.priority,
        dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : undefined,
        tags: data.tags || [],
        createdBy,
        createdAt: now,
        updatedAt: now,
    };

    await setDoc(taskRef, task);
    return { id: taskRef.id, ...task };
}

export async function updateTask(
    orgId: string,
    taskId: string,
    data: UpdateTaskData
): Promise<void> {
    const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    if (data.dueDate === null) {
        updateData.dueDate = null;
    } else if (data.dueDate) {
        updateData.dueDate = Timestamp.fromDate(data.dueDate);
    }

    if (data.status === 'done') {
        updateData.completedAt = Timestamp.now();
    }

    const docRef = doc(db, getTasksPath(orgId), taskId);
    await updateDoc(docRef, updateData);
}

export async function updateTaskStatus(
    orgId: string,
    taskId: string,
    status: string
): Promise<void> {
    const updateData: Record<string, unknown> = {
        status,
        updatedAt: Timestamp.now(),
    };

    if (status === 'done') {
        updateData.completedAt = Timestamp.now();
    }

    const docRef = doc(db, getTasksPath(orgId), taskId);
    await updateDoc(docRef, updateData);
}

export async function deleteTask(orgId: string, taskId: string): Promise<void> {
    await deleteDoc(doc(db, getTasksPath(orgId), taskId));
}

// ============== COMMENT OPERATIONS ==============

export async function getComments(orgId: string, taskId: string): Promise<Comment[]> {
    const q = query(
        collection(db, getCommentsPath(orgId, taskId)),
        orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
}

export async function createComment(
    orgId: string,
    taskId: string,
    content: string,
    authorId: string,
    mentions?: string[]
): Promise<Comment> {
    const now = Timestamp.now();
    const commentRef = doc(collection(db, getCommentsPath(orgId, taskId)));

    const comment: Omit<Comment, 'id'> = {
        orgId,
        taskId,
        content,
        authorId,
        mentions,
        createdAt: now,
        updatedAt: now,
    };

    await setDoc(commentRef, comment);
    return { id: commentRef.id, ...comment };
}

export async function deleteComment(
    orgId: string,
    taskId: string,
    commentId: string
): Promise<void> {
    await deleteDoc(doc(db, getCommentsPath(orgId, taskId), commentId));
}

// ============== AUDIT LOG OPERATIONS ==============

export async function createAuditLog(
    orgId: string,
    data: Omit<AuditLog, 'id' | 'orgId' | 'createdAt'>
): Promise<void> {
    const logRef = doc(collection(db, getAuditLogsPath(orgId)));
    await setDoc(logRef, {
        ...data,
        orgId,
        createdAt: Timestamp.now(),
    });
}

export async function getAuditLogs(
    orgId: string,
    filters?: {
        entityType?: string;
        entityId?: string;
        actorId?: string;
        startDate?: Date;
        endDate?: Date;
    },
    pageLimit = 50
): Promise<AuditLog[]> {
    const constraints: QueryConstraint[] = [];

    if (filters?.entityType) {
        constraints.push(where('entityType', '==', filters.entityType));
    }
    if (filters?.entityId) {
        constraints.push(where('entityId', '==', filters.entityId));
    }
    if (filters?.actorId) {
        constraints.push(where('actorId', '==', filters.actorId));
    }
    if (filters?.startDate) {
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
        constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageLimit));

    const q = query(collection(db, getAuditLogsPath(orgId)), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
}

// ============== REMINDER SETTINGS ==============

export async function getReminderSettings(
    orgId: string,
    scope: 'global' | string
): Promise<ReminderSettings | null> {
    const docRef = doc(db, getReminderSettingsPath(orgId), scope);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as ReminderSettings;
}

export async function updateReminderSettings(
    orgId: string,
    scopeId: string,
    data: Partial<ReminderSettings>
): Promise<void> {
    const docRef = doc(db, getReminderSettingsPath(orgId), scopeId);
    await setDoc(docRef, {
        ...data,
        orgId,
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

// ============== REAL-TIME SUBSCRIPTIONS ==============

export function subscribeToTasks(
    orgId: string,
    assigneeId: string,
    callback: (tasks: Task[]) => void
): Unsubscribe {
    const q = query(
        collection(db, getTasksPath(orgId)),
        where('assigneeIds', 'array-contains', assigneeId),
        orderBy('dueDate', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        callback(tasks);
    });
}

export function subscribeToComments(
    orgId: string,
    taskId: string,
    callback: (comments: Comment[]) => void
): Unsubscribe {
    const q = query(
        collection(db, getCommentsPath(orgId, taskId)),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
        callback(comments);
    });
}

export { db };
