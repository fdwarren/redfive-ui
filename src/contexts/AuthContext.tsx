import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
        setUser(JSON.parse(savedUser));
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
    window.google.accounts.oauth2.initCodeClient({
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
              const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
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

  const logout = () => {
    // Call server logout endpoint
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
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
    logout
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
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
          revoke: () => void;
        };
      };
    };
  }
}
