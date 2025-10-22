# Google Authentication Setup

This application now includes Google OAuth authentication. Here's how to set it up:

## Environment Configuration

1. Create a `.env` file in the project root with your Google Client ID:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" in the API & Services section
5. Create OAuth 2.0 Client IDs
6. Set the authorized JavaScript origins to include your development server (e.g., `http://localhost:5173`)
7. Copy the Client ID to your `.env` file

## Features Implemented

- **Authentication Context**: Manages user authentication state across the application
- **Google OAuth Integration**: Uses Google Identity Services for secure authentication
- **Authentication Guard**: Protects the application and requires login
- **User Profile Display**: Shows user name and profile picture in the navbar
- **Session Management**: Handles login/logout with proper token management
- **API Integration**: All API calls now include authentication credentials

## Components Added

- `src/contexts/AuthContext.tsx` - Authentication context and provider
- `src/services/AuthService.ts` - Authentication service for API calls
- `src/components/AuthGuard.tsx` - Component to protect routes
- Updated `src/components/Navbar.tsx` - Login/logout functionality
- Updated `src/App.tsx` - Wrapped with authentication provider

## Usage

1. Start your development server: `npm run dev`
2. The application will show a login screen if not authenticated
3. Click "Login with Google" to authenticate
4. Once authenticated, you'll see your profile in the navbar
5. Click "Logout" to sign out

## Server Integration

The authentication is designed to work with a backend server that:
- Accepts Google OAuth tokens at `/auth/google`
- Manages user sessions
- Validates authentication for protected endpoints

Make sure your backend server is configured to handle Google OAuth authentication.
