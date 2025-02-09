import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { UserRole } from '@/types/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  emailVerified: boolean;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Export the hook as a named function declaration for Fast Refresh compatibility
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Function to validate token format
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  // Add any additional token validation logic here
  return true;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // Don't initialize from localStorage here
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] Initializing auth state...');
      const storedToken = localStorage.getItem('token');
      
      if (!isValidToken(storedToken)) {
        console.log('[Auth] No valid token found, redirecting to login');
        localStorage.removeItem('token'); // Clean up invalid token
        setIsLoading(false);
        setLocation('/login');
        return;
      }

      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth] Development mode, using mock data');
          // In development, use mock data
          const mockUser: User = {
            id: '1',
            email: 'admin@tenplatform.com',
            firstName: 'Admin',
            lastName: 'User',
            role: UserRole.ADMIN,
            permissions: ['*'],
            emailVerified: true,
            active: true,
          };
          setUser(mockUser);
          setToken(storedToken);
          console.log('[Auth] Mock user set:', mockUser);
        } else {
          console.log('[Auth] Production mode, fetching user data');
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(storedToken);
            console.log('[Auth] User data fetched:', userData);
          } else {
            console.error('[Auth] Failed to fetch user data:', response.status);
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setLocation('/login');
          }
        }
      } catch (err) {
        console.error('[Auth] Auth initialization failed:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLocation('/login');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        console.log('[Auth] Token changed in another tab');
        if (!e.newValue) {
          // Token was removed
          setUser(null);
          setToken(null);
          setLocation('/login');
        } else {
          // Token was added/changed, reinitialize auth
          initAuth();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setLocation]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('[Auth] Attempting login for:', email);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development mode login');
        // In development, use mock data
        const mockUser: User = {
          id: '1',
          email: email,
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
          permissions: ['*'],
          emailVerified: true,
          active: true,
        };
        const mockToken = 'mock-token-123';
        localStorage.setItem('token', mockToken);
        setUser(mockUser);
        setToken(mockToken);
        setLocation('/admin');
        console.log('[Auth] Mock login successful');
        return;
      }

      console.log('[Auth] Production mode login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { token, user } = await response.json();
        localStorage.setItem('token', token);
        setUser(user);
        setToken(token);
        setLocation('/admin');
        console.log('[Auth] Login successful');
      } else {
        const errorData = await response.json();
        console.error('[Auth] Login failed:', errorData);
        setError(errorData.message || 'Login failed');
      }
    } catch (err) {
      console.error('[Auth] Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('[Auth] Attempting registration');

      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Development mode registration');
        // In development, auto-login after registration
        await login(userData.email, userData.password);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Auth] Registration failed:', errorData);
        setError(errorData.message || 'Registration failed');
      } else {
        console.log('[Auth] Registration successful');
      }
    } catch (err) {
      console.error('[Auth] Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('[Auth] Logging out');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setLocation('/login');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
