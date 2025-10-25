import React from "react";

type ValidationStatus = 'neutral' | 'validating' | 'valid' | 'invalid';

interface FormInputProps {
  id: string;
  name: string;
  type: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  validationStatus?: ValidationStatus;
}

export default function FormInput({
  id,
  name,
  type,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  error,
  onBlur,
  validationStatus = 'neutral',
}: FormInputProps) {
  // Determine styling based on validation status
  const getInputClassName = () => {
    const baseClasses = "mt-1 block w-full px-3 py-2 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent";

    switch (validationStatus) {
      case 'invalid':
        return `${baseClasses} bg-red-900 bg-opacity-20 border border-red-500 focus:ring-red-500`;
      case 'valid':
        return `${baseClasses} bg-green-900 bg-opacity-20 border border-green-500 focus:ring-green-500`;
      case 'validating':
        return `${baseClasses} bg-blue-900 bg-opacity-20 border border-blue-500 focus:ring-blue-500`;
      case 'neutral':
      default:
        return `${baseClasses} bg-gray-700 border border-gray-600 focus:ring-blue-500`;
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          className={getInputClassName()}
          placeholder={placeholder}
        />
        {validationStatus === 'valid' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {validationStatus === 'validating' && (
        <p className="mt-1 text-sm text-blue-400">Checking availability...</p>
      )}
      {validationStatus === 'invalid' && error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
