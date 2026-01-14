'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/firebase/auth';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Mail, Lock, CheckSquare } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await signIn(formData.email, formData.password);
            router.push('/dashboard');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sign in';
            if (message.includes('user-not-found') || message.includes('wrong-password')) {
                showError('Invalid email or password');
            } else if (message.includes('too-many-requests')) {
                showError('Too many failed attempts. Please try again later.');
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
                </div>

                <Card variant="elevated" padding="lg">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@tsb.com.vn"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={errors.email}
                            leftIcon={<Mail className="w-4 h-4" />}
                            autoComplete="email"
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            error={errors.password}
                            leftIcon={<Lock className="w-4 h-4" />}
                            autoComplete="current-password"
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button type="submit" className="w-full" loading={loading}>
                            Sign in
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link
                                href="/register"
                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </Card>

                <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
                    Only @tsb.com.vn email addresses are allowed
                </p>
            </div>
        </div>
    );
}
