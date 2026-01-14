'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/firebase/auth';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Mail, CheckSquare, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const validateEmail = () => {
        if (!email) {
            setError('Email is required');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail()) return;

        setLoading(true);
        try {
            await resetPassword(email);
            setSubmitted(true);
            success('Password reset email sent!');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to send reset email';
            if (message.includes('user-not-found')) {
                // Don't reveal if email exists for security
                setSubmitted(true);
            } else {
                showError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
                <div className="w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 mb-6">
                        <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Check your email</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        If an account exists for <span className="font-medium">{email}</span>, you will receive a password reset link.
                    </p>
                    <Link href="/login">
                        <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                            Back to login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
                        <CheckSquare className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Forgot password?</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        No worries, we'll send you reset instructions.
                    </p>
                </div>

                <Card variant="elevated" padding="lg">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@tsb.com.vn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={error}
                            leftIcon={<Mail className="w-4 h-4" />}
                            autoComplete="email"
                        />

                        <Button type="submit" className="w-full" loading={loading}>
                            Send reset link
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
