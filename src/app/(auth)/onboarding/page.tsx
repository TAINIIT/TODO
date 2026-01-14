'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import {
    Building2,
    Users,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Sparkles,
} from 'lucide-react';

type Step = 'org' | 'admin' | 'invite' | 'complete';

interface OnboardingData {
    orgName: string;
    orgDomain: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    inviteEmails: string[];
}

export default function OnboardingPage() {
    const router = useRouter();
    const { success, error: showError } = useToast();

    const [step, setStep] = useState<Step>('org');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        orgName: '',
        orgDomain: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        inviteEmails: [],
    });
    const [inviteInput, setInviteInput] = useState('');

    const steps: { id: Step; label: string; icon: React.ElementType }[] = [
        { id: 'org', label: 'Organization', icon: Building2 },
        { id: 'admin', label: 'Admin Account', icon: Users },
        { id: 'invite', label: 'Invite Team', icon: Users },
        { id: 'complete', label: 'Complete', icon: CheckCircle },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);

    const handleNext = () => {
        const stepOrder: Step[] = ['org', 'admin', 'invite', 'complete'];
        const nextIndex = stepOrder.indexOf(step) + 1;
        if (nextIndex < stepOrder.length) {
            setStep(stepOrder[nextIndex]);
        }
    };

    const handleBack = () => {
        const stepOrder: Step[] = ['org', 'admin', 'invite', 'complete'];
        const prevIndex = stepOrder.indexOf(step) - 1;
        if (prevIndex >= 0) {
            setStep(stepOrder[prevIndex]);
        }
    };

    const handleAddInvite = () => {
        if (inviteInput && inviteInput.includes('@')) {
            setData({
                ...data,
                inviteEmails: [...data.inviteEmails, inviteInput],
            });
            setInviteInput('');
        }
    };

    const handleRemoveInvite = (email: string) => {
        setData({
            ...data,
            inviteEmails: data.inviteEmails.filter(e => e !== email),
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // In production, this would call an API to:
            // 1. Create the organization document
            // 2. Create the admin user with Firebase Auth
            // 3. Send invite emails to team members

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            success('Organization created successfully!');
            setStep('complete');
        } catch (err) {
            console.error('Onboarding failed:', err);
            showError('Failed to create organization');
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = (): boolean => {
        switch (step) {
            case 'org':
                return data.orgName.length >= 2 && data.orgDomain.length >= 3;
            case 'admin':
                return data.adminName.length >= 2 &&
                    data.adminEmail.includes('@') &&
                    data.adminPassword.length >= 8;
            case 'invite':
                return true; // Optional step
            default:
                return true;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    {steps.map((s, index) => (
                        <React.Fragment key={s.id}>
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${index <= currentStepIndex
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                    }`}
                            >
                                <s.icon className="w-4 h-4" />
                                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`w-8 h-0.5 ${index < currentStepIndex ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <Card className="shadow-2xl">
                    {step === 'org' && (
                        <>
                            <CardHeader
                                title="Create Your Organization"
                                description="Set up your workspace to get started with TaskFlow"
                            />
                            <CardContent>
                                <div className="space-y-6">
                                    <Input
                                        label="Organization Name"
                                        placeholder="Acme Corporation"
                                        value={data.orgName}
                                        onChange={(e) => setData({ ...data, orgName: e.target.value })}
                                    />
                                    <Input
                                        label="Email Domain"
                                        placeholder="acme.com"
                                        helperText="Users with this email domain can self-register"
                                        value={data.orgDomain}
                                        onChange={(e) => setData({ ...data, orgDomain: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </>
                    )}

                    {step === 'admin' && (
                        <>
                            <CardHeader
                                title="Create Admin Account"
                                description="This will be the first administrator of your organization"
                            />
                            <CardContent>
                                <div className="space-y-6">
                                    <Input
                                        label="Full Name"
                                        placeholder="John Doe"
                                        value={data.adminName}
                                        onChange={(e) => setData({ ...data, adminName: e.target.value })}
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        placeholder={`admin@${data.orgDomain || 'company.com'}`}
                                        value={data.adminEmail}
                                        onChange={(e) => setData({ ...data, adminEmail: e.target.value })}
                                    />
                                    <Input
                                        label="Password"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        value={data.adminPassword}
                                        onChange={(e) => setData({ ...data, adminPassword: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </>
                    )}

                    {step === 'invite' && (
                        <>
                            <CardHeader
                                title="Invite Your Team"
                                description="Add team members to collaborate (optional)"
                            />
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder={`colleague@${data.orgDomain || 'company.com'}`}
                                            value={inviteInput}
                                            onChange={(e) => setInviteInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddInvite()}
                                        />
                                        <Button onClick={handleAddInvite}>Add</Button>
                                    </div>

                                    {data.inviteEmails.length > 0 && (
                                        <div className="space-y-2">
                                            {data.inviteEmails.map((email) => (
                                                <div
                                                    key={email}
                                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                                >
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                                                    <button
                                                        onClick={() => handleRemoveInvite(email)}
                                                        className="text-red-500 hover:text-red-600 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-500">
                                        {data.inviteEmails.length} team member(s) will receive an invitation email
                                    </p>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {step === 'complete' && (
                        <>
                            <CardContent>
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Sparkles className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                        You're All Set!
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                                        Your organization <strong>{data.orgName}</strong> has been created successfully.
                                    </p>
                                    <Button onClick={() => router.push('/login')} size="lg">
                                        Go to Login
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Navigation */}
                    {step !== 'complete' && (
                        <div className="px-6 pb-6 flex justify-between">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={step === 'org'}
                                leftIcon={<ArrowLeft className="w-4 h-4" />}
                            >
                                Back
                            </Button>
                            {step === 'invite' ? (
                                <Button
                                    onClick={handleSubmit}
                                    loading={loading}
                                    rightIcon={<Sparkles className="w-4 h-4" />}
                                >
                                    Create Organization
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    disabled={!isStepValid()}
                                    rightIcon={<ArrowRight className="w-4 h-4" />}
                                >
                                    Continue
                                </Button>
                            )}
                        </div>
                    )}
                </Card>

                {/* Features */}
                {step === 'org' && (
                    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                        <div className="p-4">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Building2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Multi-tenant</p>
                            <p className="text-xs text-gray-500">Isolated data per org</p>
                        </div>
                        <div className="p-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Team Ready</p>
                            <p className="text-xs text-gray-500">Invite unlimited users</p>
                        </div>
                        <div className="p-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="w-6 h-6 text-purple-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Secure</p>
                            <p className="text-xs text-gray-500">Enterprise-grade security</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
