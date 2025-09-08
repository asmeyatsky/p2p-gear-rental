import { toast as sonnerToast } from 'sonner';

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const toast = {
  success: (title: string, options?: ToastOptions) => {
    sonnerToast.success(title, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
    });
  },

  error: (title: string, options?: ToastOptions) => {
    sonnerToast.error(title, {
      description: options?.description,
      duration: options?.duration || 5000, // Longer duration for errors
      action: options?.action,
    });
  },

  info: (title: string, options?: ToastOptions) => {
    sonnerToast.info(title, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
    });
  },

  warning: (title: string, options?: ToastOptions) => {
    sonnerToast.warning(title, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
    });
  },

  loading: (title: string, options?: Omit<ToastOptions, 'action'>) => {
    return sonnerToast.loading(title, {
      description: options?.description,
      duration: options?.duration,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: (data: T) => string;
      error: (err: any) => string;
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

// Utility function to handle API errors consistently
export function handleApiError(error: any, fallbackMessage = 'Something went wrong') {
  console.error('API Error:', error);

  let message = fallbackMessage;
  let description: string | undefined;

  if (error?.response?.data?.error) {
    message = error.response.data.error;
    description = error.response.data.code ? `Error code: ${error.response.data.code}` : undefined;
  } else if (error?.message) {
    message = error.message;
  }

  toast.error(message, { description });
}

// Utility for form validation errors
export function handleValidationErrors(errors: Record<string, string[]>) {
  const firstError = Object.values(errors)[0]?.[0];
  if (firstError) {
    toast.error('Validation Error', { 
      description: firstError,
      duration: 4000 
    });
  }
}