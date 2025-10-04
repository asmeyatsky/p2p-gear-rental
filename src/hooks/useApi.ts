import { useState, useCallback } from 'react';
import { toast, handleApiError } from '@/lib/toast';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface ApiState<T> {
  loading: boolean;
  error: unknown;
  data: T | null;
}

export function useApi<T, TArgs extends unknown[] = unknown[]>(
  apiFunction: (...args: TArgs) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const [state, setState] = useState<ApiState<T>>({
    loading: false,
    error: null,
    data: null,
  });

  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage,
    errorMessage,
  } = options;

  const execute = useCallback(
    async (...args: Parameters<typeof apiFunction>) => {
      setState({ loading: true, error: null, data: null });

      try {
        const result = await apiFunction(...args);
        
        setState({ loading: false, error: null, data: result });
        
        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }
        
        onSuccess?.(result);
        return result;
      } catch (error) {
        setState({ loading: false, error, data: null });
        
        if (showErrorToast) {
          handleApiError(error, errorMessage);
        }
        
        onError?.(error);
        throw error;
      }
    },
    [apiFunction, onSuccess, onError, showSuccessToast, showErrorToast, successMessage, errorMessage]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specialized hook for form submissions
export function useFormApi<T, TArgs>(
  apiFunction: (args: TArgs) => Promise<T>,
  options: UseApiOptions<T> & {
    resetOnSuccess?: boolean;
  } = {}
) {
  const { resetOnSuccess = false, ...apiOptions } = options;
  const api = useApi<T, [TArgs]>(apiFunction as (...args: [TArgs]) => Promise<T>, apiOptions as UseApiOptions<T>);

  const submitForm = useCallback(
    async (formData: TArgs) => {
      try {
        const result = await api.execute(formData);
        if (resetOnSuccess) {
          // Form should be reset by the component
        }
        return result;
      } catch (error) {
        // Error is already handled by useApi
        throw error;
      }
    },
    [api, resetOnSuccess]
  );

  return {
    ...api,
    submitForm,
  };
}

// Hook for mutations with loading states
export function useMutation<T, TArgs>(
  mutationFn: (args: TArgs) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const api = useApi<T>(mutationFn, options);

  const mutate = useCallback(
    (args: TArgs) => api.execute(args),
    [api]
  );

  return {
    ...api,
    mutate,
    isLoading: api.loading,
    isError: !!api.error,
    isSuccess: !api.loading && !api.error && api.data !== null,
  };
}