/**
 * Get the API base URL from environment variables
 * @returns The API base URL
 * @throws Error if VITE_DATA_API_BASE is not configured
 */
export const getApiBaseUrl = (): string => {
  const apiBase = import.meta.env.VITE_DATA_API_BASE;
  
  if (!apiBase) {
    throw new Error('VITE_DATA_API_BASE environment variable is not configured. Please set it in your .env file.');
  }
  
  return apiBase;
};
