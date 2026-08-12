import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  writeBatch,
} from 'firebase/firestore';
import {deleteUser, User} from 'firebase/auth';
import {auth, db} from './firebase';

const CHUNK = 400;
const RECENT_LOGIN_MS = 5 * 60 * 1000;

export function isRecentLogin(user: User, withinMs = RECENT_LOGIN_MS): boolean {
  const raw = user.metadata.lastSignInTime;
  if (!raw) {
    return false;
  }
  const last = Date.parse(raw);
  if (!Number.isFinite(last)) {
    return false;
  }
  return Date.now() - last <= withinMs;
}

async function deleteCollectionInChunks(
  uid: string,
  subcollection: string,
): Promise<void> {
  if (!db) {
    throw {code: 'auth/not-configured'};
  }
  const col = collection(db, 'users', uid, subcollection);
  // Page until empty — Firestore has no recursive client delete.
  while (true) {
    const snap = await getDocs(query(col, limit(CHUNK)));
    if (snap.empty) {
      return;
    }
    const batch = writeBatch(db);
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
    if (snap.size < CHUNK) {
      return;
    }
  }
}

/**
 * Deletes Firestore data then the auth user.
 * Caller must ensure a recent login first (see isRecentLogin) to avoid
 * wiping data and then hitting auth/requires-recent-login.
 */
export async function deleteAccountDataAndUser(user: User): Promise<void> {
  if (!db || !auth) {
    throw {code: 'auth/not-configured'};
  }
  const uid = user.uid;

  await deleteCollectionInChunks(uid, 'mealEntries');
  await deleteCollectionInChunks(uid, 'habitLogs');
  await deleteCollectionInChunks(uid, 'habits');
  await deleteCollectionInChunks(uid, 'weights');
  await deleteDoc(doc(db, 'users', uid));

  await deleteUser(user);
}
