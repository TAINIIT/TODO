'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/helpers';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    children: React.ReactNode;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    children,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (closeOnEscape && e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, closeOnEscape]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-4xl',
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            <div
                ref={modalRef}
                className={cn(
                    'w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
                    'animate-scale-in transform',
                    'max-h-[90vh] flex flex-col',
                    sizes[size]
                )}
            >
                {(title || showCloseButton) && (
                    <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                        <div>
                            {title && (
                                <h2
                                    id="modal-title"
                                    className="text-xl font-semibold text-gray-900 dark:text-gray-100"
                                >
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                            )}
                        </div>
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 -m-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </div>
        </div>
    );
}

interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div
            className={cn(
                'flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800',
                className
            )}
        >
            {children}
        </div>
    );
}
