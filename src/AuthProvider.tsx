import { createContext, useContext, useState, useEffect } from 'react';
import React from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

export const DEMO_USER_STORAGE_KEY = 'agrocare_demo_user';
export const DEMO_AUTH_TOKEN = 'agrocare-demo-token';

export type AppUser = Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL'> & {
  isDemo?: boolean;
  getIdToken?: () => Promise<string>;
};

const AuthContext = createContext<{
  user: AppUser | null;
  loading: boolean;
  isAuthenticating: boolean;
  authMode: 'demo' | 'firebase';
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}>({
  user: null,
  loading: true,
  isAuthenticating: false,
  authMode: 'demo',
  signIn: async () => {},
  signOut: async () => {},
});

function createDemoUser(): AppUser {
  return {
    uid: 'demo-farmer',
    email: 'demo-farmer@agrocare.local',
    displayName: 'Demo Farmer',
    photoURL: null,
    isDemo: true,
    getIdToken: async () => DEMO_AUTH_TOKEN,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authMode = import.meta.env.VITE_AUTH_MODE === 'firebase' ? 'firebase' : 'demo';
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (authMode === 'demo') {
      const storedDemoUser = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (storedDemoUser) {
        setUser(createDemoUser());
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [authMode]);

  const signIn = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      if (authMode === 'demo') {
        const demoUser = createDemoUser();
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({
          uid: demoUser.uid,
          email: demoUser.email,
          displayName: demoUser.displayName,
        }));
        setUser(demoUser);
        return;
      }

      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        // You could use a toast library here if you wanted, but logging is fine
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOutUser = async () => {
    try {
      if (authMode === 'demo') {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        setUser(null);
        return;
      }

      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticating, authMode, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
