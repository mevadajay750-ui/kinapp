import {initializeApp, getApps, getApp, FirebaseApp} from 'firebase/app';
import {initializeAuth, getAuth, Auth, Persistence} from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
// RN-conditioned entry — Metro resolves this to the react-native build at runtime.
import * as firebaseAuthRN from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  Firestore,
} from 'firebase/firestore';
import Config from 'react-native-config';

const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.FIREBASE_AUTH_DOMAIN,
  projectId: Config.FIREBASE_PROJECT_ID,
  storageBucket: Config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.FIREBASE_APP_ID,
};

const hasConfig = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Firebase v12 exposes RN persistence two ways. `reactNativeLocalPersistence`
 * is the newer export; `getReactNativePersistence` is the older factory and
 * is missing from the published TS types (firebase-js-sdk#9316) even though
 * it exists at runtime. Resolve whichever is present.
 *
 * Check both `firebase/auth` and `@firebase/auth` — Metro's react-native
 * condition is reliable on the latter.
 */
function resolveRNPersistence(): Persistence | undefined {
  const candidates = [
    firebaseAuth as unknown as Record<string, unknown>,
    firebaseAuthRN as unknown as Record<string, unknown>,
  ];

  for (const mod of candidates) {
    if (mod.reactNativeLocalPersistence) {
      console.log('[kin] Firebase auth persistence: reactNativeLocalPersistence');
      return mod.reactNativeLocalPersistence as Persistence;
    }
  }

  for (const mod of candidates) {
    if (typeof mod.getReactNativePersistence === 'function') {
      console.log('[kin] Firebase auth persistence: getReactNativePersistence');
      return (mod.getReactNativePersistence as (s: unknown) => Persistence)(
        AsyncStorage,
      );
    }
  }

  return undefined;
}

if (hasConfig) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  try {
    const persistence = resolveRNPersistence();
    if (!persistence) {
      console.warn(
        '[kin] Firebase auth persistence unavailable — sessions will not survive app restart.',
      );
    }
    auth = persistence
      ? initializeAuth(app, {persistence})
      : initializeAuth(app);
  } catch {
    // initializeAuth throws if auth was already initialized (Fast Refresh).
    auth = getAuth(app);
  }

  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });
    console.log('[kin] Firestore: persistentLocalCache enabled');
  } catch (e) {
    console.warn(
      '[kin] Firestore persistentLocalCache unavailable — falling back to getFirestore',
      e,
    );
    db = getFirestore(app);
  }
}

export {app, auth, db};
