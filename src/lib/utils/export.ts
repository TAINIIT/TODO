import * as XLSX from 'xlsx';
import type { Task, User, Team, Project } from '@/types';
import { formatDate } from './date';
import { TASK_STATUSES, TASK_PRIORITIES, PROJECT_STATUSES } from '../constants';

export interface ExportOptions {
    filename?: string;
    sheetName?: string;
}

/**
 * Export tasks to Excel file
 */
export function exportTasksToExcel(
    tasks: Task[],
    users: Record<string, User>,
    options: ExportOptions = {}
): void {
    const { filename = 'tasks-export', sheetName = 'Tasks' } = options;

    const data = tasks.map(task => ({
        'Title': task.title,
        'Description': task.description || '',
        'Status': TASK_STATUSES[task.status]?.label || task.status,
        'Priority': TASK_PRIORITIES[task.priority]?.label || task.priority,
        'Assignees': task.assigneeIds.map(id => users[id]?.displayName || id).join(', '),
        'Due Date': task.dueDate ? formatDate(task.dueDate, 'yyyy-MM-dd HH:mm') : '',
        'Tags': task.tags?.join(', ') || '',
        'Created': formatDate(task.createdAt, 'yyyy-MM-dd HH:mm'),
        'Completed': task.completedAt ? formatDate(task.completedAt, 'yyyy-MM-dd HH:mm') : '',
    }));

    exportToExcel(data, { ...options, filename, sheetName });
}

/**
 * Export users to Excel file
 */
export function exportUsersToExcel(
    users: User[],
    options: ExportOptions = {}
): void {
    const { filename = 'users-export', sheetName = 'Users' } = options;

    const data = users.map(user => ({
        'Name': user.displayName,
        'Email': user.email,
        'Role': user.role,
        'Status': user.status,
        'Teams': user.teamIds?.length || 0,
        'Projects': user.projectIds?.length || 0,
        'Created': formatDate(user.createdAt, 'yyyy-MM-dd HH:mm'),
        'Last Login': user.lastLoginAt ? formatDate(user.lastLoginAt, 'yyyy-MM-dd HH:mm') : 'Never',
    }));

    exportToExcel(data, { ...options, filename, sheetName });
}

/**
 * Export projects to Excel file
 */
export function exportProjectsToExcel(
    projects: Project[],
    users: Record<string, User>,
    options: ExportOptions = {}
): void {
    const { filename = 'projects-export', sheetName = 'Projects' } = options;

    const data = projects.map(project => ({
        'Name': project.name,
        'Description': project.description || '',
        'Status': PROJECT_STATUSES[project.status]?.label || project.status,
        'Managers': project.managerIds.map(id => users[id]?.displayName || id).join(', '),
        'Members': project.memberIds.length,
        'Start Date': project.startDate ? formatDate(project.startDate, 'yyyy-MM-dd') : '',
        'End Date': project.endDate ? formatDate(project.endDate, 'yyyy-MM-dd') : '',
        'Created': formatDate(project.createdAt, 'yyyy-MM-dd HH:mm'),
    }));

    exportToExcel(data, { ...options, filename, sheetName });
}

/**
 * Export teams to Excel file
 */
export function exportTeamsToExcel(
    teams: Team[],
    users: Record<string, User>,
    options: ExportOptions = {}
): void {
    const { filename = 'teams-export', sheetName = 'Teams' } = options;

    const data = teams.map(team => ({
        'Name': team.name,
        'Description': team.description || '',
        'Managers': team.managerIds.map(id => users[id]?.displayName || id).join(', '),
        'Members': team.memberIds.length,
        'Created': formatDate(team.createdAt, 'yyyy-MM-dd HH:mm'),
    }));

    exportToExcel(data, { ...options, filename, sheetName });
}

/**
 * Generic export function
 */
export function exportToExcel(
    data: Record<string, unknown>[],
    options: ExportOptions = {}
): void {
    const { filename = 'export', sheetName = 'Sheet1' } = options;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(
            key.length,
            ...data.map(row => String(row[key] || '').length)
        ) + 2
    }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate and download file
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export multiple sheets to a single Excel file
 */
export function exportMultipleSheets(
    sheets: { name: string; data: Record<string, unknown>[] }[],
    filename: string = 'export'
): void {
    const wb = XLSX.utils.book_new();

    sheets.forEach(sheet => {
        const ws = XLSX.utils.json_to_sheet(sheet.data);

        // Auto-size columns
        if (sheet.data.length > 0) {
            const colWidths = Object.keys(sheet.data[0]).map(key => ({
                wch: Math.max(
                    key.length,
                    ...sheet.data.map(row => String(row[key] || '').length)
                ) + 2
            }));
            ws['!cols'] = colWidths;
        }

        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
}
