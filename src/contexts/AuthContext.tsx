import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Google Identity Services is loaded
    const checkGoogleLoaded = () => {
      if (window.google && window.google.accounts) {
        console.log('Google Identity Services loaded successfully');
        setIsLoading(false);
      } else {
        console.log('Waiting for Google Identity Services to load...');
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = checkGoogleLoaded;
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    // Check for existing authentication on mount
    const savedUser = localStorage.getItem('user');
    const savedAccessToken = localStorage.getItem('access_token');
    
    if (savedUser && savedAccessToken) {
      try {
        // Check if token is expired
        const isExpired = (token: string): boolean => {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
          } catch (error) {
            console.error('Error checking token expiration:', error);
            return true; // Assume expired if we can't parse
          }
        };

        if (isExpired(savedAccessToken)) {
          console.log('Access token is expired, attempting refresh...');
          // Token is expired, try to refresh it
          setTimeout(async () => {
            const refreshTokenValue = localStorage.getItem('refresh_token');
            if (refreshTokenValue) {
              const apiBase = getApiBaseUrl();
              try {
                const response = await fetch(`${apiBase}/auth/refresh`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({ refresh_token: refreshTokenValue })
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                    if (data.refresh_token) {
                      localStorage.setItem('refresh_token', data.refresh_token);
                    }
                    console.log('Token refreshed successfully on app startup');
                    setUser(JSON.parse(savedUser));
                  }
                } else {
                  // Refresh failed, clear tokens
                  localStorage.removeItem('user');
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                }
              } catch (error) {
                console.error('Token refresh failed on startup:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
              }
            } else {
              // No refresh token, clear everything
              localStorage.removeItem('user');
              localStorage.removeItem('access_token');
            }
          }, 100);
        } else {
          // Token is still valid
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const login = () => {
    console.log('Login button clicked');
    
    if (!window.google || !window.google.accounts) {
      console.error('Google Identity Services not loaded');
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log('Client ID:', clientId);
    
    if (!clientId) {
      console.error('Google Client ID not configured');
      return;
    }

    console.log('Initializing Google OAuth client...');
    
    // Use redirect-based flow to avoid popup blockers
    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid profile email',
      ux_mode: 'redirect',
      redirect_uri: window.location.origin,
      callback: (response: any) => {
        console.log('OAuth callback received:', response);
        
        if (response.access_token) {
          console.log('Access token received, authenticating with server...');
          
          // First get user info from Google
          fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`)
            .then(res => res.json())
            .then(userInfo => {
              console.log('User info received:', userInfo);
              
              // Now authenticate with our backend server
              const apiBase = getApiBaseUrl();
              return fetch(`${apiBase}/auth/google`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for session cookies
                body: JSON.stringify({
                  access_token: response.access_token,
                  user_info: userInfo
                })
              }).then(res => res.json()).then(authResponse => {
                console.log('Server authentication response:', authResponse);
                
                if (authResponse.success || authResponse.user) {
                  const userData: User = {
                    id: authResponse.user?.id || userInfo.id,
                    name: authResponse.user?.name || userInfo.name,
                    email: authResponse.user?.email || userInfo.email,
                    picture: authResponse.user?.picture || userInfo.picture
                  };
                  setUser(userData);
                  localStorage.setItem('user', JSON.stringify(userData));
                } else {
                  console.error('Server authentication failed:', authResponse);
                }
              });
            })
            .catch(error => {
              console.error('Error during authentication:', error);
            });
        } else {
          console.error('No access token in response:', response);
        }
      }
    }).requestAccessToken();
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) {
        console.log('No refresh token available');
        return false;
      }

      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: refreshTokenValue })
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        return false;
      }

      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        console.log('Token refreshed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      return false;
    }
  };

  const logout = () => {
    // Call server logout endpoint
    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(error => {
      console.error('Error during logout:', error);
    });
    
    setUser(null);
    localStorage.removeItem('user');
    
    // Revoke Google token if available
    if (window.google && window.google.accounts) {
      window.google.accounts.oauth2.revoke();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: any;
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
          initCodeClient: (config: any) => {
            requestAccessToken: () => void;
          };
          revoke: () => void;
        };
      };
    };
  }
}
