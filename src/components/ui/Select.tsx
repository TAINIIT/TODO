import React from 'react';
import { cn } from '@/lib/utils/helpers';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
    onChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, helperText, options, placeholder, onChange, id, value, ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            onChange?.(e.target.value);
        };

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        value={value}
                        onChange={handleChange}
                        className={cn(
                            'w-full px-4 py-2.5 pr-10 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 appearance-none',
                            'transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                            'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
                            error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 dark:border-gray-700',
                            className
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value} disabled={option.disabled}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
