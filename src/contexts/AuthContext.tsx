import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';
import type { User } from '../types';

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
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check if Google Identity Services is already loaded
    if (window.google && window.google.accounts) {
      setIsLoading(false);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      const checkGoogleLoaded = () => {
        if (window.google && window.google.accounts) {
          setIsLoading(false);
        } else {
          setTimeout(checkGoogleLoaded, 100);
        }
      };
      checkGoogleLoaded();
      return;
    }

    // Check if Google Identity Services is loaded
    const checkGoogleLoaded = () => {
      if (window.google && window.google.accounts) {
        setIsLoading(false);
      } else {
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
            return true; // Assume expired if we can't parse
          }
        };

        if (isExpired(savedAccessToken)) {
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
                    setUser(JSON.parse(savedUser));
                  }
                } else {
                  // Refresh failed, clear tokens
                  localStorage.removeItem('user');
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                }
              } catch (error) {
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
    
    // Prevent multiple login attempts
    if (isLoggingIn) {
      return;
    }
    
    if (!window.google || !window.google.accounts) {
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId || clientId === 'your_google_client_id_here') {
      alert('Google OAuth is not configured. Please set up your Google OAuth Client ID in the .env file.');
      return;
    }

    setIsLoggingIn(true);
    
    // Use redirect-based flow to avoid popup blockers
    const oauthClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid profile email',
      ux_mode: 'redirect',
      redirect_uri: window.location.origin,
      callback: (response: any) => {
        
        if (response.access_token) {
          
          // First get user info from Google
          fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`)
            .then(res => res.json())
            .then(userInfo => {
              
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
                }
                setIsLoggingIn(false);
              });
            })
            .catch(() => {
              setIsLoggingIn(false);
            });
        } else {
          setIsLoggingIn(false);
        }
      }
    });
    
    oauthClient.requestAccessToken();
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) {
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
        return true;
      }

      return false;
    } catch (error) {
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
    }).catch(() => {
    });
    
    setUser(null);
    setIsLoggingIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
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
