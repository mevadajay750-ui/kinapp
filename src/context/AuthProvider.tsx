import React, {createContext, useEffect, useState} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import {auth} from '../lib/firebase';
import {createUserProfile} from '../lib/userProfile';

type AuthCtx = {
  user: User | null;
  initializing: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

function notConfigured(): never {
  throw {code: 'auth/not-configured'};
}

export const AuthContext = createContext<AuthCtx>({
  user: null,
  initializing: true,
  signUp: async () => notConfigured(),
  signIn: async () => notConfigured(),
  signOut: async () => notConfigured(),
  resetPassword: async () => notConfigured(),
});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Firebase not configured yet — resolve immediately so app doesn't hang.
      setInitializing(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth) {
      notConfigured();
    }
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const cred = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );
    await updateProfile(cred.user, {displayName: trimmedName});

    try {
      await createUserProfile(cred.user.uid, normalizedEmail, trimmedName);
    } catch (err) {
      // Auth account stands; reconcile missing profile on app open in a later prompt.
      // TODO: reconcile missing Firestore user profile on app open
      console.error('[kin] Failed to create user profile:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      notConfigured();
    }
    await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );
  };

  const signOut = async () => {
    if (!auth) {
      notConfigured();
    }
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      notConfigured();
    }
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{user, initializing, signUp, signIn, signOut, resetPassword}}>
      {children}
    </AuthContext.Provider>
  );
}
