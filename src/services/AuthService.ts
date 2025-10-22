import type { User } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../utils/apiConfig';

export class AuthService {
  private static instance: AuthService;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiBaseUrl();
  }

  static getInstance(baseUrl?: string): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(baseUrl);
    }
    return AuthService.instance;
  }

  async authenticateWithGoogle(accessToken: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Authentication failed' };
      }

      const data = await response.json();
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Authentication error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Logout failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  async getCurrentUser(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session-based auth
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Not authenticated' };
        }
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to get user' };
      }

      const data = await response.json();
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Get current user error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }
}
