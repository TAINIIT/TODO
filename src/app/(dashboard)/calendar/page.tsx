'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth, useIsManager } from '@/contexts/AuthContext';
import { getTasks } from '@/lib/firebase/firestore';
import { APP_CONFIG, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SectionLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
} from 'lucide-react';
import Link from 'next/link';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPage() {
    const { user } = useAuth();
    const isManager = useIsManager();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        const loadTasks = async () => {
            if (!user) return;
            try {
                setLoading(true);
                let userTasks: Task[];

                if (isManager) {
                    userTasks = await getTasks(APP_CONFIG.defaultOrgId, {});
                } else {
                    userTasks = await getTasks(APP_CONFIG.defaultOrgId, {
                        assigneeId: user.id,
                    });
                }

                setTasks(userTasks.filter(t => t.dueDate));
            } catch (err) {
                console.error('Failed to load tasks:', err);
            } finally {
                setLoading(false);
            }
        };
        loadTasks();
    }, [user, isManager]);

    // Define getTasksForDate BEFORE it's used in useMemo
    const getTasksForDate = useCallback((date: Date): Task[] => {
        return tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = task.dueDate.toDate();
            return (
                taskDate.getDate() === date.getDate() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getFullYear() === date.getFullYear()
            );
        });
    }, [tasks]);

    // Get calendar data - now getTasksForDate is defined before this
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // First day of month
        const firstDay = new Date(year, month, 1);
        const startDayOfWeek = firstDay.getDay();

        // Days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Previous month days to show
        const prevMonthDays = new Date(year, month, 0).getDate();

        const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; tasks: Task[] }[] = [];

        // Previous month
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthDays - i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                tasks: getTasksForDate(date),
            });
        }

        // Current month
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push({
                date,
                isCurrentMonth: true,
                isToday:
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear(),
                tasks: getTasksForDate(date),
            });
        }

        // Next month to fill remaining cells (complete the grid to 42 cells = 6 weeks)
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                tasks: getTasksForDate(date),
            });
        }

        return days;
    }, [currentDate, getTasksForDate]);

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

    if (loading) return <SectionLoader />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {isManager ? 'All tasks by due date' : 'Your tasks by due date'}
                    </p>
                </div>
                {isManager && (
                    <Link href="/tasks">
                        <Button leftIcon={<Plus className="w-4 h-4" />}>
                            Create Task
                        </Button>
                    </Link>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card className="lg:col-span-2">
                    <CardHeader
                        title={`${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                        action={
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={goToToday}>
                                    Today
                                </Button>
                                <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        }
                    />
                    <CardContent>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS_OF_WEEK.map(day => (
                                <div
                                    key={day}
                                    className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarData.map((day, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(day.date)}
                                    className={`
                                        relative min-h-[80px] p-1 rounded-lg border transition-all
                                        ${day.isCurrentMonth
                                            ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                                            : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-900 text-gray-400'
                                        }
                                        ${day.isToday
                                            ? 'ring-2 ring-indigo-500 border-indigo-500'
                                            : ''
                                        }
                                        ${selectedDate?.toDateString() === day.date.toDateString()
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                                            : ''
                                        }
                                        hover:bg-gray-50 dark:hover:bg-gray-800
                                    `}
                                >
                                    <span
                                        className={`
                                            absolute top-1 left-1.5 text-sm font-medium
                                            ${day.isToday
                                                ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center -top-0 left-0.5'
                                                : day.isCurrentMonth
                                                    ? 'text-gray-900 dark:text-gray-100'
                                                    : 'text-gray-400 dark:text-gray-600'
                                            }
                                        `}
                                    >
                                        {day.date.getDate()}
                                    </span>

                                    {/* Task dots */}
                                    {day.tasks.length > 0 && (
                                        <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 justify-center">
                                            {day.tasks.slice(0, 3).map((task, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1.5 h-1.5 rounded-full ${task.status === 'done'
                                                        ? 'bg-green-500'
                                                        : task.status === 'blocked'
                                                            ? 'bg-red-500'
                                                            : task.priority === 'urgent'
                                                                ? 'bg-red-400'
                                                                : task.priority === 'high'
                                                                    ? 'bg-orange-400'
                                                                    : 'bg-indigo-500'
                                                        }`}
                                                />
                                            ))}
                                            {day.tasks.length > 3 && (
                                                <span className="text-[10px] text-gray-400">
                                                    +{day.tasks.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Selected date tasks */}
                <Card>
                    <CardHeader
                        title={selectedDate
                            ? selectedDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                            })
                            : 'Select a date'
                        }
                        description={selectedDate ? `${selectedDateTasks.length} task(s)` : undefined}
                    />
                    <CardContent>
                        {!selectedDate ? (
                            <EmptyState
                                type="tasks"
                                title="No date selected"
                                description="Click on a date to see tasks"
                            />
                        ) : selectedDateTasks.length === 0 ? (
                            <EmptyState
                                type="tasks"
                                title="No tasks"
                                description="No tasks due on this date"
                            />
                        ) : (
                            <div className="space-y-3">
                                {selectedDateTasks.map(task => (
                                    <TaskItem key={task.id} task={task} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Legend */}
            <Card padding="sm">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-gray-500">Legend:</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-gray-600 dark:text-gray-400">Normal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-gray-600 dark:text-gray-400">High Priority</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-gray-600 dark:text-gray-400">Urgent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-gray-600 dark:text-gray-400">Blocked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">Done</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function TaskItem({ task }: { task: Task }) {
    const priorityColors: Record<TaskPriority, 'default' | 'warning' | 'danger'> = {
        low: 'default',
        medium: 'warning',
        high: 'danger',
        urgent: 'danger',
    };

    const statusColors: Record<TaskStatus, 'default' | 'info' | 'danger' | 'success'> = {
        backlog: 'default',
        in_progress: 'info',
        blocked: 'danger',
        done: 'success',
    };

    return (
        <Link href={`/tasks/${task.id}`}>
            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                    {task.title}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant={statusColors[task.status]} size="sm">
                        {TASK_STATUSES[task.status].label}
                    </Badge>
                    <Badge variant={priorityColors[task.priority]} size="sm">
                        {TASK_PRIORITIES[task.priority].label}
                    </Badge>
                </div>
            </div>
        </Link>
    );
}
