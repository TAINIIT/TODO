'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/firebase/auth';
import { createUser } from '@/lib/firebase/firestore';
import { APP_CONFIG } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Mail, Lock, User, CheckSquare } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
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
            newErrors.email = 'Only @tsb.com.vn email addresses are allowed';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Register with Firebase Auth
            const firebaseUser = await registerUser(
                formData.email,
                formData.password,
                formData.displayName
            );

            // Create user document in Firestore
            await createUser(
                APP_CONFIG.defaultOrgId,
                firebaseUser.uid,
                {
                    email: formData.email,
                    displayName: formData.displayName,
                    role: 'employee', // Default role for self-registration
                },
                firebaseUser.uid // Created by self
            );

            success('Account created successfully! Please check your email to verify your account.');
            router.push('/login');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to create account';
            if (message.includes('email-already-in-use')) {
                showError('An account with this email already exists');
            } else {
                showError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
                        <CheckSquare className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create account</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Get started with TaskFlow</p>
                </div>

                <Card variant="elevated" padding="lg">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            error={errors.displayName}
                            leftIcon={<User className="w-4 h-4" />}
                            autoComplete="name"
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@tsb.com.vn"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={errors.email}
                            helperText="Only @tsb.com.vn emails are allowed"
                            leftIcon={<Mail className="w-4 h-4" />}
                            autoComplete="email"
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="At least 8 characters"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            error={errors.password}
                            leftIcon={<Lock className="w-4 h-4" />}
                            autoComplete="new-password"
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            error={errors.confirmPassword}
                            leftIcon={<Lock className="w-4 h-4" />}
                            autoComplete="new-password"
                        />

                        <Button type="submit" className="w-full" loading={loading}>
                            Create account
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
