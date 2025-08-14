import React from 'react';
import { useForm, Controller, FieldValues, UseFormReturn } from 'react-hook-form';
import { cn } from '../../utils/cn';
import Input from './Input';
import Button from './Button';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  validation?: {
    required?: string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    validate?: (value: any) => string | true;
  };
  options?: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}

interface FormProps {
  fields: FormField[];
  onSubmit: (data: FieldValues) => void | Promise<void>;
  submitText?: string;
  loading?: boolean;
  className?: string;
  defaultValues?: FieldValues;
  resetOnSubmit?: boolean;
}

function Form({
  fields,
  onSubmit,
  submitText = 'Submit',
  loading = false,
  className,
  defaultValues = {},
  resetOnSubmit = false,
}: FormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    defaultValues,
  });

  const handleFormSubmit = async (data: FieldValues) => {
    try {
      await onSubmit(data);
      if (resetOnSubmit) {
        reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const fieldError = error?.message as string;

    return (
      <Controller
        key={field.name}
        name={field.name}
        control={control}
        rules={{
          required: field.required && (field.validation?.required || `${field.label} is required`),
          minLength: field.validation?.minLength,
          maxLength: field.validation?.maxLength,
          pattern: field.validation?.pattern,
          validate: field.validation?.validate,
        }}
        render={({ field: { onChange, onBlur, value, ref } }) => {
          switch (field.type) {
            case 'textarea':
              return (
                <div key={field.name} className={cn('space-y-2', field.className)}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    ref={ref}
                    value={value || ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={field.placeholder}
                    disabled={field.disabled || loading}
                    className={cn(
                      'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      'dark:bg-gray-800 dark:text-white dark:placeholder-gray-400',
                      'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
                      error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
                      'resize-vertical min-h-[100px]'
                    )}
                  />
                  {fieldError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                  )}
                </div>
              );

            case 'select':
              return (
                <div key={field.name} className={cn('space-y-2', field.className)}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <select
                    ref={ref}
                    value={value || ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={field.disabled || loading}
                    className={cn(
                      'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      'dark:bg-gray-800 dark:text-white',
                      'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
                      error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    )}
                  >
                    <option value="">{field.placeholder || 'Select an option'}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {fieldError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                  )}
                </div>
              );

            case 'checkbox':
              return (
                <div key={field.name} className={cn('flex items-center space-x-3', field.className)}>
                  <input
                    ref={ref}
                    type="checkbox"
                    checked={value || false}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={field.disabled || loading}
                    className={cn(
                      'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
                      'dark:bg-gray-800 dark:border-gray-600',
                      'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
                      error && 'border-red-500'
                    )}
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {fieldError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                  )}
                </div>
              );

            case 'radio':
              return (
                <div key={field.name} className={cn('space-y-2', field.className)}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="space-y-2">
                    {field.options?.map((option) => (
                      <div key={option.value} className="flex items-center space-x-3">
                        <input
                          ref={ref}
                          type="radio"
                          value={option.value}
                          checked={value === option.value}
                          onChange={onChange}
                          onBlur={onBlur}
                          disabled={field.disabled || loading}
                          className={cn(
                            'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300',
                            'dark:bg-gray-800 dark:border-gray-600',
                            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
                            error && 'border-red-500'
                          )}
                        />
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {fieldError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                  )}
                </div>
              );

            default:
              return (
                <Input
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.required}
                  error={fieldError}
                  disabled={field.disabled || loading}
                  className={field.className}
                  {...{ onChange, onBlur, value, ref }}
                />
              );
          }
        }}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-6', className)}>
      <div className="space-y-4">
        {fields.map(renderField)}
      </div>
      
      <Button
        type="submit"
        disabled={loading || isSubmitting}
        loading={loading || isSubmitting}
        className="w-full"
      >
        {submitText}
      </Button>
    </form>
  );
}

// Hook for using form outside of component
export function useFormWithValidation<T extends FieldValues = FieldValues>(
  defaultValues?: Partial<T>
): UseFormReturn<T> {
  return useForm({ defaultValues: defaultValues as any });
}

export default Form;
