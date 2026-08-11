import React, {createContext, useCallback, useEffect, useRef, useState} from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {useAuth} from '../hooks/useAuth';
import {db} from '../lib/firebase';
import {seedDefaultHabitsIntoBatch} from '../lib/habits';
import {
  createUserProfile,
  OnboardingData,
  UserProfile,
} from '../lib/userProfile';

type ProfileCtx = {
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
};

function notConfigured(): never {
  throw {code: 'auth/not-configured'};
}

export const ProfileContext = createContext<ProfileCtx>({
  profile: null,
  loading: true,
  refresh: async () => {},
  updateProfile: async () => notConfigured(),
  completeOnboarding: async () => notConfigured(),
});

export type {OnboardingData};

export function ProfileProvider({children}: {children: React.ReactNode}) {
  const {user} = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      creatingRef.current = false;
      return;
    }

    if (!db) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, 'users', user.uid);

    const unsub = onSnapshot(
      ref,
      async snap => {
        if (!snap.exists()) {
          if (creatingRef.current) {
            return;
          }
          creatingRef.current = true;
          try {
            await createUserProfile(
              user.uid,
              user.email ?? '',
              user.displayName ?? '',
            );
          } catch (err) {
            console.error('[kin] Failed to reconcile user profile:', err);
            creatingRef.current = false;
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        creatingRef.current = false;
        const data = snap.data() as UserProfile;
        setProfile({
          ...data,
          heightCm: data.heightCm ?? null,
        });
        setLoading(false);
      },
      err => {
        console.error('[kin] Profile snapshot error:', err);
        setProfile(null);
        setLoading(false);
      },
    );

    return unsub;
  }, [user]);

  const refresh = useCallback(async () => {
    if (!db || !user) {
      setProfile(null);
      return;
    }
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!db || !user) {
        notConfigured();
      }
      await updateDoc(doc(db, 'users', user.uid), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    },
    [user],
  );

  const completeOnboarding = useCallback(
    async (data: OnboardingData) => {
      if (!db || !user) {
        notConfigured();
      }
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', user.uid), {
        name: data.name,
        startWeightKg: data.startWeightKg,
        goalWeightKg: data.goalWeightKg,
        heightCm: data.heightCm,
        dailyKcalTarget: data.dailyKcalTarget,
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      });
      seedDefaultHabitsIntoBatch(batch, user.uid);
      await batch.commit();
    },
    [user],
  );

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        refresh,
        updateProfile,
        completeOnboarding,
      }}>
      {children}
    </ProfileContext.Provider>
  );
}
