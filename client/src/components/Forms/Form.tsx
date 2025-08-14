import React, { FormEvent } from 'react';
import { cn } from '../../utils/cn';

interface FormProps {
  onSubmit: (e: FormEvent) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  className,
  disabled = false,
}) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!disabled) {
      onSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      noValidate
    >
      {children}
    </form>
  );
};

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-end space-x-4 pt-6 border-t border-gray-200', className)}>
      {children}
    </div>
  );
};
