import React, {createContext, useEffect, useState} from 'react';
import {onAuthStateChanged, User} from 'firebase/auth';
import {auth} from '../lib/firebase';

type AuthCtx = {user: User | null; initializing: boolean};
export const AuthContext = createContext<AuthCtx>({
  user: null,
  initializing: true,
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

  return (
    <AuthContext.Provider value={{user, initializing}}>
      {children}
    </AuthContext.Provider>
  );
}
