'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

interface AnimatedFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
  initialDelay?: number;
}

const AnimatedForm = ({ 
  children, 
  onSubmit, 
  className, 
  initialDelay = 0 
}: AnimatedFormProps) => {
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.4, 
          delay: initialDelay 
        } 
      }}
      onSubmit={onSubmit}
      className={cn('space-y-4', className)}
    >
      {children}
    </motion.form>
  );
};

AnimatedForm.Field = ({ 
  id, 
  label, 
  children, 
  required,
  className
}: { 
  id: string; 
  label: string; 
  children: React.ReactNode; 
  required?: boolean;
  className?: string;
}) => {
  return (
    <div className={className}>
      <Label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
};

AnimatedForm.Input = ({
  id,
  label,
  required,
  placeholder,
  type = 'text',
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: string;
  required?: boolean;
  className?: string;
}) => {
  return (
    <AnimatedForm.Field
      id={id}
      label={label}
      required={required}
      className={className}
    >
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        required={required}
        {...props}
      />
    </AnimatedForm.Field>
  );
};

AnimatedForm.Button = ({ 
  children, 
  loading, 
  disabled, 
  variant = 'default',
  className,
  ...props 
}: React.ComponentProps<typeof Button> & { 
  loading?: boolean; 
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <Button
      type="submit"
      disabled={loading || disabled}
      variant={variant}
      className={className}
      {...props}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ 
            repeat: Infinity, 
            ease: 'linear', 
            duration: 1 
          }}
          className="mr-2"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </motion.span>
      ) : null}
      {children}
    </Button>
  );
};

export { AnimatedForm };