import React, { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../utils/apiConfig';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const googleSignInRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && window.google && window.google.accounts) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (clientId && googleSignInRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            console.log('Google Sign-In response:', response);
            // Handle the credential response
            if (response.credential) {
              // Decode the JWT token to get user info
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              console.log('User info from JWT:', payload);
              
              // Send to your backend for authentication
              const apiBase = getApiBaseUrl();
              fetch(`${apiBase}/auth/google`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  token: response.credential
                })
              }).then(res => {
                console.log('Response status:', res.status);
                if (!res.ok) {
                  return res.json().then(errorData => {
                    console.error('Server error details:', errorData);
                    throw new Error(`Server error: ${JSON.stringify(errorData)}`);
                  });
                }
                return res.json();
              }).then(authResponse => {
                console.log('Server authentication response:', authResponse);
                if (authResponse.access_token) {
                  // Store the tokens
                  localStorage.setItem('access_token', authResponse.access_token);
                  localStorage.setItem('refresh_token', authResponse.refresh_token);
                  
                  // Store user data
                  const userData = {
                    id: payload.sub,
                    name: payload.name,
                    email: payload.email,
                    picture: payload.picture
                  };
                  localStorage.setItem('user', JSON.stringify(userData));
                  
                  console.log('Authentication successful! Stored tokens and user data.');
                  console.log('User data:', userData);
                  console.log('Access token:', authResponse.access_token);
                  
                  // Reload to trigger re-authentication
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              }).catch(error => {
                console.error('Authentication error:', error);
              });
            }
          }
        });
        
        window.google.accounts.id.renderButton(googleSignInRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular'
        });
      }
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <div className="mb-4">
            <h1 className="display-4 fw-bold" style={{ color: '#aa0000' }}>
              <span>red</span><span style={{ fontStyle: 'italic', opacity: 0.9 }}>five</span>
            </h1>
            <p className="lead text-muted">Data Analytics Platform</p>
          </div>
          
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4>Initializing...</h4>
          <p className="text-muted">Setting up authentication</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <div className="mb-4">
            <h1 className="display-4 fw-bold" style={{ color: '#aa0000' }}>
              <span>red</span><span style={{ fontStyle: 'italic', opacity: 0.9 }}>five</span>
            </h1>
            <p className="lead text-muted">Data Analytics Platform</p>
          </div>
          
          <div className="card shadow-lg border-0" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div className="card-body p-5">
              <h4 className="card-title text-center mb-4">Welcome</h4>
              <p className="text-muted text-center mb-4">Sign in with your Google account to continue</p>
              
              <div ref={googleSignInRef} className="d-flex justify-content-center"></div>
            </div>
          </div>
          
          <div className="mt-4">
            <small className="text-muted">
              Secure authentication powered by Google
            </small>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
