import { getApiBaseUrl } from '../utils/apiConfig';

interface DataServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

interface DataServiceRequest {
  query: string;
}

interface SqlRequest {
  sql: string;
}

class DataService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || getApiBaseUrl();
    this.apiKey = apiKey;
  }

  /**
   * Send a user query to the data service and get a JSON response
   * @param query - The user's natural language query
   * @returns Promise with the service response
   */
  async sendPrompt(query: string): Promise<DataServiceResponse> {
    try {
      const requestBody: DataServiceRequest = {
        query
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Get a valid access token (refresh if necessary)
      const accessToken = await this.getValidToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (this.apiKey) {
        // Fallback to API key if no valid token
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }


      const response = await fetch(`${this.baseUrl}/generate-sql`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'include', // Include cookies for session-based auth
        cache: 'no-cache', // Prevent caching issues
      });


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Request processed successfully'
      };

    } catch (error) {
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = `Network error: Unable to connect to the data service. Please check if the service is running at ${this.baseUrl}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to process request'
      };
    }
  }

  /**
   * Execute SQL query
   * @param sql - The SQL query to execute
   * @returns Promise with the execution results
   */
  async executeSql(sql: string): Promise<DataServiceResponse> {
    try {
      const requestBody: SqlRequest = {
        sql
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Get a valid access token (refresh if necessary)
      const accessToken = await this.getValidToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (this.apiKey) {
        // Fallback to API key if no valid token
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }


      const response = await fetch(`${this.baseUrl}/execute-sql`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache',
      });


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'SQL executed successfully'
      };

    } catch (error) {
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to the data service';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to execute SQL'
      };
    }
  }

  /**
   * Get service health status
   * @returns Promise with health status
   */
  async getHealth(): Promise<DataServiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Service is healthy'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        message: 'Service is unavailable'
      };
    }
  }

  /**
   * Update the base URL for the service
   * @param newBaseUrl - New base URL
   */
  setBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl;
  }

  /**
   * Update the API key
   * @param newApiKey - New API key
   */
  setApiKey(newApiKey: string): void {
    this.apiKey = newApiKey;
  }

  /**
   * Get models endpoint
   * @returns Promise with models array
   */
  async getModels(): Promise<DataServiceResponse> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Get a valid access token (refresh if necessary)
      const accessToken = await this.getValidToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (this.apiKey) {
        // Fallback to API key if no valid token
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }


      const response = await fetch(`${this.baseUrl}/get-models`, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache',
      });


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Models retrieved successfully'
      };

    } catch (error) {
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to the data service';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to get models'
      };
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @returns Promise with new tokens
   */
  async refreshToken(): Promise<DataServiceResponse> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available',
          message: 'Please log in again'
        };
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };


      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refresh_token: refreshToken }),
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache',
      });


      if (!response.ok) {
        const errorText = await response.text();
        
        // If refresh fails, clear stored tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        return {
          success: false,
          error: `Token refresh failed: ${errorText}`,
          message: 'Please log in again'
        };
      }

      const data = await response.json();
      
      // Update stored tokens
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
      }
      
      return {
        success: true,
        data: data,
        message: 'Token refreshed successfully'
      };

    } catch (error) {
      
      // Clear stored tokens on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Token refresh failed, please log in again'
      };
    }
  }

  /**
   * Check if a token is expired (basic JWT expiration check)
   * @param token - JWT token to check
   * @returns boolean indicating if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true; // Assume expired if we can't parse
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @returns Promise with valid access token
   */
  async getValidToken(): Promise<string | null> {
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
      return null;
    }

    // Check if token is expired
    if (this.isTokenExpired(accessToken)) {
      const refreshResult = await this.refreshToken();
      
      if (refreshResult.success && refreshResult.data?.access_token) {
        return refreshResult.data.access_token;
      } else {
        return null;
      }
    }

    return accessToken;
  }

 
}

export default DataService;
export type { DataServiceResponse, DataServiceRequest };
