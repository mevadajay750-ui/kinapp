import {doc, getDoc, setDoc, serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  startWeightKg: number | null;
  goalWeightKg: number | null;
  heightCm: number | null; // optional, used only for the target suggestion
  dailyKcalTarget: number | null;
  onboardingComplete: boolean;
  createdAt: unknown; // serverTimestamp
  updatedAt: unknown; // serverTimestamp
};

export type OnboardingData = {
  name: string;
  startWeightKg: number;
  goalWeightKg: number;
  heightCm: number | null;
  dailyKcalTarget: number;
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
    heightCm: null,
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
