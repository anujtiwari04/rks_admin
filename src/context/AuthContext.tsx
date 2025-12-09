import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  name: string;
  email: string;
  role: 'user' | 'admin';
  memberships?: string[];
}

type LoginPayload = { token?: string; user?: User | null } | undefined;

interface IMembership {
  _id: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled';
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  role: 'user' | 'admin' | null;
  login: (payload?: LoginPayload) => void;
  logout: () => void;
  isAuthDialogOpen: boolean;
  setAuthDialogOpen: (open: boolean) => void;
  isAuthLoading: boolean;
  refetchUserMemberships: () => Promise<void>; // <-- 1. ADD THIS
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Check for token on initial app load
useEffect(() => {
    let isMounted = true;
    const checkTokenAndFetchUser = async () => {
      const storedToken = localStorage.getItem('TOKEN');
      
      if (storedToken) {
        try {
          // 1. Set token in state so api interceptor can use it
          setToken(storedToken); 
          
          // 2. Fetch user data using the token
          const userData = await api.get<User>('/auth/me'); 
          
          if (isMounted) {
            // 3. Set all auth state from the fresh user data
            setUser(userData); 
            setRole(userData.role);
            setIsAuthenticated(true);
            
            // 4. Ensure role is also in localStorage
            localStorage.setItem('ROLE', userData.role);
          }
        } catch (error) {
          // Token is invalid or expired
          console.error('Token validation failed:', error);
          if (isMounted) {
            logout(); // This will clear localStorage, state, etc.
          }
        }
      }
      
      // Stop loading *after* auth check is complete or if no token
      if (isMounted) {
        setIsAuthLoading(false);
      }
    };
    
    checkTokenAndFetchUser();
    
    return () => { isMounted = false; };
  }, []);


  // --- 2. EXTRACT MEMBERSHIP FETCH LOGIC ---
  const fetchUserMemberships = async () => {
    if (!token || role !== 'user') {
      // Only fetch for authenticated users
      return;
    }
    
    try {
      const memberships = await api.get<IMembership[]>('/memberships');
      const activeMemberships = (Array.isArray(memberships) ? memberships : [])
        .filter((m) => m.status === 'active')
        .map((m) => m.planName);

      setUser((prevUser) => ({
        ...prevUser, 
        email: prevUser?.email || '',
        name: prevUser?.name || '',
        role: prevUser?.role || 'user',
        memberships: activeMemberships,
      }));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      if ((error as any)?.status === 401) {
        logout(); // Token is invalid, log out
      }
    }
  };

  // Fetch user data (memberships) when authenticated as a user
  useEffect(() => {
    if (isAuthenticated && token && role === 'user') {
      fetchUserMemberships();
    }
  }, [isAuthenticated, token, role]); // Runs on login

  // --- 3. CREATE THE PUBLIC RE-FETCH FUNCTION ---
  const refetchUserMemberships = async () => {
    await fetchUserMemberships();
  };


  const login = (payload?: LoginPayload) => {
    if (payload?.token) {
      try {
        localStorage.setItem('TOKEN', payload.token);
        setToken(payload.token);
      } catch {
        /* ignore storage errors */
      }
    }
    if (payload?.user) {
      setUser(payload.user);
      setRole(payload.user.role);
      try {
        localStorage.setItem('ROLE', payload.user.role);
        console.log("User:", payload.user);
      } catch {
        /* ignore storage errors */
      }
    }
    setIsAuthenticated(true);
    setAuthDialogOpen(false);
    setIsAuthLoading(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setRole(null);
    setIsAuthLoading(false);
    try {
      localStorage.removeItem('TOKEN');
      localStorage.removeItem('ROLE');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        role,
        login,
        logout,
        isAuthDialogOpen,
        setAuthDialogOpen,
        isAuthLoading,
        refetchUserMemberships, // <-- 4. PROVIDE THE FUNCTION
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};