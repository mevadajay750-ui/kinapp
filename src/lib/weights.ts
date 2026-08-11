import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {db} from './firebase';

export type WeightEntry = {
  date: string; // 'YYYY-MM-DD' local
  kg: number;
  createdAt: unknown;
  updatedAt: unknown;
};

export const WEIGHT_VALIDATION_MESSAGE =
  "That doesn't look right. Mind checking?";

function weightsCol(uid: string) {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  return collection(db, 'users', uid, 'weights');
}

function weightDoc(uid: string, dateKey: string) {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  return doc(db, 'users', uid, 'weights', dateKey);
}

function mapWeight(data: Record<string, unknown>): WeightEntry {
  return {
    date: String(data.date ?? ''),
    kg: Number(data.kg ?? 0),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** Round to one decimal place. */
export function normalizeWeightKg(kg: number): number {
  return Math.round(kg * 10) / 10;
}

export function validateWeightKg(kg: number): boolean {
  if (!Number.isFinite(kg)) {
    return false;
  }
  const normalized = normalizeWeightKg(kg);
  return normalized >= 30 && normalized <= 300;
}

export async function setWeight(
  uid: string,
  dateKey: string,
  kg: number,
): Promise<void> {
  if (!validateWeightKg(kg)) {
    throw new Error(WEIGHT_VALIDATION_MESSAGE);
  }
  const normalized = normalizeWeightKg(kg);
  const ref = weightDoc(uid, dateKey);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await setDoc(
      ref,
      {
        date: dateKey,
        kg: normalized,
        updatedAt: serverTimestamp(),
      },
      {merge: true},
    );
  } else {
    await setDoc(ref, {
      date: dateKey,
      kg: normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export function subscribeToLatestWeight(
  uid: string,
  cb: (entry: WeightEntry | null) => void,
): () => void {
  const q = query(weightsCol(uid), orderBy('date', 'desc'), limit(1));

  return onSnapshot(
    q,
    snap => {
      if (snap.empty) {
        cb(null);
        return;
      }
      cb(mapWeight(snap.docs[0].data() as Record<string, unknown>));
    },
    err => {
      console.warn('[kin] subscribeToLatestWeight error', err);
      cb(null);
    },
  );
}

export async function getWeightRange(
  uid: string,
  startKey: string,
  endKey: string,
): Promise<WeightEntry[]> {
  const q = query(
    weightsCol(uid),
    where('date', '>=', startKey),
    where('date', '<=', endKey),
    orderBy('date', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => mapWeight(d.data() as Record<string, unknown>));
}

export function seedWeightIntoBatch(
  batch: ReturnType<typeof writeBatch>,
  uid: string,
  dateKey: string,
  kg: number,
): void {
  if (!validateWeightKg(kg)) {
    throw new Error(WEIGHT_VALIDATION_MESSAGE);
  }
  const normalized = normalizeWeightKg(kg);
  batch.set(
    weightDoc(uid, dateKey),
    {
      date: dateKey,
      kg: normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {merge: true},
  );
}
