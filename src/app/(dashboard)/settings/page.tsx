'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser } from '@/lib/firebase/firestore';
import { resetPassword } from '@/lib/firebase/auth';
import { APP_CONFIG } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { User, Lock, Bell, Palette, Save } from 'lucide-react';

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const { success, error: showError } = useToast();

    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        displayName: user?.displayName || '',
    });

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await updateUser(APP_CONFIG.defaultOrgId, user.id, {
                displayName: profileData.displayName,
            });
            await refreshUser();
            success('Profile updated successfully');
        } catch (err) {
            console.error('Failed to update profile:', err);
            showError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;

        try {
            await resetPassword(user.email);
            success('Password reset email sent! Check your inbox.');
        } catch (err) {
            console.error('Failed to send reset email:', err);
            showError('Failed to send password reset email');
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Tabs */}
                <div className="md:w-48 flex-shrink-0">
                    <nav className="flex md:flex-col gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <Card>
                            <CardHeader title="Profile" description="Update your personal information" />
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Avatar */}
                                    <div className="flex items-center gap-4">
                                        <Avatar name={user?.displayName || 'User'} size="xl" />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {user?.displayName}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-1">
                                                {user?.role}
                                            </p>
                                        </div>
                                    </div>

                                    <hr className="border-gray-200 dark:border-gray-800" />

                                    {/* Form */}
                                    <div className="space-y-4">
                                        <Input
                                            label="Display Name"
                                            value={profileData.displayName}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, displayName: e.target.value })
                                            }
                                        />

                                        <Input
                                            label="Email"
                                            value={user?.email || ''}
                                            disabled
                                            helperText="Email cannot be changed"
                                        />

                                        <Input
                                            label="Role"
                                            value={user?.role || ''}
                                            disabled
                                            helperText="Contact an admin to change your role"
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleSaveProfile}
                                            loading={saving}
                                            leftIcon={<Save className="w-4 h-4" />}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card>
                            <CardHeader title="Security" description="Manage your account security" />
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            Password
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            Request a password reset email to change your password.
                                        </p>
                                        <Button variant="outline" onClick={handleResetPassword}>
                                            Send Password Reset Email
                                        </Button>
                                    </div>

                                    <hr className="border-gray-200 dark:border-gray-800" />

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            Sessions
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            You are currently signed in on this device.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card>
                            <CardHeader
                                title="Notifications"
                                description="Configure how you receive notifications"
                            />
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                Email Notifications
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Receive email updates about your tasks
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                Task Reminders
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Get reminded before task due dates
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                Daily Summary
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Receive a daily summary of your tasks
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>
                                <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">
                                    Note: Notification settings will be fully functional in Phase 3.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'appearance' && (
                        <Card>
                            <CardHeader title="Appearance" description="Customize the look and feel" />
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Theme
                                        </label>
                                        <div className="flex gap-4">
                                            <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-indigo-500 bg-white">
                                                <div className="w-12 h-8 rounded bg-white border border-gray-200" />
                                                <span className="text-sm font-medium text-gray-900">Light</span>
                                            </button>
                                            <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300">
                                                <div className="w-12 h-8 rounded bg-gray-900 border border-gray-700" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Dark</span>
                                            </button>
                                            <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300">
                                                <div className="w-12 h-8 rounded bg-gradient-to-r from-white to-gray-900 border border-gray-200" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">System</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">
                                    Note: Theme switching will be fully functional in a future update.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
