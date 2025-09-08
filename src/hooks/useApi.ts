import { useState, useCallback } from 'react';
import { toast, handleApiError } from '@/lib/toast';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface ApiState {
  loading: boolean;
  error: any;
  data: any;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  const [state, setState] = useState<ApiState>({
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
    async (...args: any[]) => {
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
export function useFormApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions & {
    resetOnSuccess?: boolean;
  } = {}
) {
  const { resetOnSuccess = false, ...apiOptions } = options;
  const api = useApi(apiFunction, apiOptions);

  const submitForm = useCallback(
    async (formData: any, ...args: any[]) => {
      try {
        const result = await api.execute(formData, ...args);
        if (resetOnSuccess) {
          // Form should be reset by the component
        }
        return result;
      } catch (error) {
        // Error is already handled by useApi
        throw error;
      }
    },
    [api.execute, resetOnSuccess]
  );

  return {
    ...api,
    submitForm,
  };
}

// Hook for mutations with loading states
export function useMutation<T = any, TArgs = any>(
  mutationFn: (args: TArgs) => Promise<T>,
  options: UseApiOptions = {}
) {
  const api = useApi(mutationFn, options);

  const mutate = useCallback(
    (args: TArgs) => api.execute(args),
    [api.execute]
  );

  return {
    ...api,
    mutate,
    isLoading: api.loading,
    isError: !!api.error,
    isSuccess: !api.loading && !api.error && api.data !== null,
  };
}