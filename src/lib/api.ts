/**
 * Client-side API utilities
 *
 * These utilities handle basePath configuration for API calls.
 * When NEXT_PUBLIC_BASE_PATH is set (e.g., /gear-staging), API calls
 * need to include the base path prefix.
 */

/**
 * Get the base path for API calls
 * Returns the NEXT_PUBLIC_BASE_PATH if set, empty string otherwise
 */
export function getApiBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Construct a full API URL with the correct base path
 * @param path - The API path (e.g., '/api/gear' or 'api/gear')
 * @returns The full URL with base path prefix
 */
export function apiUrl(path: string): string {
  const basePath = getApiBasePath();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}

/**
 * Fetch wrapper that automatically adds the base path to API calls
 * @param path - The API path (e.g., '/api/gear')
 * @param options - Standard fetch options
 * @returns Promise<Response>
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...options,
    credentials: 'include', // Always include cookies for auth
  });
}
