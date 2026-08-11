import {initializeApp, getApps, getApp, FirebaseApp} from 'firebase/app';
import {initializeAuth, getAuth, Auth} from 'firebase/auth';
// @ts-expect-error — exported under react-native condition, resolved by Metro at runtime
import {getReactNativePersistence} from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getFirestore, Firestore} from 'firebase/firestore';
import Config from 'react-native-config';

const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.FIREBASE_AUTH_DOMAIN,
  projectId: Config.FIREBASE_PROJECT_ID,
  storageBucket: Config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.FIREBASE_APP_ID,
};

// If Firebase config is missing, export null values. AuthProvider handles this gracefully.
const hasConfig = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (hasConfig) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
  db = getFirestore(app);
}

export {app, auth, db};
