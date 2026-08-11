import {doc, getDoc, setDoc, serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  // Onboarding fields — null until the user completes onboarding in a later prompt
  startWeightKg: number | null;
  goalWeightKg: number | null;
  dailyKcalTarget: number | null;
  onboardingComplete: boolean;
  createdAt: unknown; // serverTimestamp
  updatedAt: unknown; // serverTimestamp
};

export async function createUserProfile(
  uid: string,
  email: string,
  name: string,
): Promise<void> {
  if (!db) {
    throw {code: 'auth/not-configured'};
  }

  const profile: UserProfile = {
    uid,
    email,
    name,
    startWeightKg: null,
    goalWeightKg: null,
    dailyKcalTarget: null,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid), profile);
}

export async function getUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  if (!db) {
    return null;
  }

  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as UserProfile;
}
