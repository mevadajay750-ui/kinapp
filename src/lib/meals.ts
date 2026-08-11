import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import {db} from './firebase';
import {addDays, localDateKey} from './dates';
import type {MealCategory} from '../data/foods';

export type MealPortion = 0.5 | 1 | 1.5 | 2 | 3;

export type MealEntry = {
  id: string;
  date: string;
  category: MealCategory;
  foodId: string | null;
  name: string;
  serving: string;
  portions: MealPortion;
  kcal: number;
  proteinG: number;
  createdAt: unknown;
};

export type NewMealEntry = {
  date: string;
  category: MealCategory;
  foodId: string | null;
  name: string;
  serving: string;
  portions: MealPortion;
  kcal: number;
  proteinG: number;
};

function entriesCol(uid: string) {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  return collection(db, 'users', uid, 'mealEntries');
}

function entryDoc(uid: string, entryId: string) {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  return doc(db, 'users', uid, 'mealEntries', entryId);
}

function mapEntry(id: string, data: Record<string, unknown>): MealEntry {
  return {
    id,
    date: String(data.date ?? ''),
    category: data.category as MealCategory,
    foodId: (data.foodId as string | null) ?? null,
    name: String(data.name ?? ''),
    serving: String(data.serving ?? ''),
    portions: Number(data.portions) as MealPortion,
    kcal: Number(data.kcal ?? 0),
    proteinG: Number(data.proteinG ?? 0),
    createdAt: data.createdAt,
  };
}

export function subscribeToDay(
  uid: string,
  dateKey: string,
  cb: (entries: MealEntry[]) => void,
): () => void {
  const q = query(entriesCol(uid), where('date', '==', dateKey));

  return onSnapshot(
    q,
    snap => {
      const entries = snap.docs
        .map(d => mapEntry(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => {
          const aTs = a.createdAt as Timestamp | undefined;
          const bTs = b.createdAt as Timestamp | undefined;
          const aMs = aTs?.toMillis?.() ?? 0;
          const bMs = bTs?.toMillis?.() ?? 0;
          return aMs - bMs;
        });
      cb(entries);
    },
    err => {
      console.warn('[kin] subscribeToDay error', err);
      cb([]);
    },
  );
}

export async function addMealEntry(
  uid: string,
  entry: NewMealEntry,
): Promise<string> {
  const ref = await addDoc(entriesCol(uid), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteMealEntry(
  uid: string,
  entryId: string,
): Promise<void> {
  await deleteDoc(entryDoc(uid, entryId));
}

export async function updateMealEntry(
  uid: string,
  entryId: string,
  patch: Partial<Omit<MealEntry, 'id' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(entryDoc(uid, entryId), patch);
}

export type RecentFood = {
  foodId: string | null;
  name: string;
  serving: string;
  kcal: number;
  proteinG: number;
};

/** Distinct foods logged in this category over the last 30 days, newest first (max 8). */
export async function fetchRecentFoods(
  uid: string,
  category: MealCategory,
): Promise<RecentFood[]> {
  const since = addDays(localDateKey(), -30);
  const q = query(
    entriesCol(uid),
    where('date', '>=', since),
    orderBy('date', 'desc'),
  );

  const snap = await getDocs(q);
  const seen = new Set<string>();
  const recents: RecentFood[] = [];

  // Newest first: sort by createdAt when available
  const docs = snap.docs
    .map(d => ({id: d.id, data: d.data() as Record<string, unknown>}))
    .filter(d => d.data.category === category)
    .sort((a, b) => {
      const aTs = a.data.createdAt as Timestamp | undefined;
      const bTs = b.data.createdAt as Timestamp | undefined;
      const aMs = aTs?.toMillis?.() ?? 0;
      const bMs = bTs?.toMillis?.() ?? 0;
      return bMs - aMs;
    });

  for (const {data} of docs) {
    const foodId = (data.foodId as string | null) ?? null;
    const name = String(data.name ?? '');
    const key = foodId ? `id:${foodId}` : `name:${name.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    recents.push({
      foodId,
      name,
      serving: String(data.serving ?? ''),
      // Store per-portion base: reverse portions if needed for re-add at 1
      kcal: Math.round(Number(data.kcal ?? 0) / Number(data.portions ?? 1)),
      proteinG: Math.round(
        (Number(data.proteinG ?? 0) / Number(data.portions ?? 1)) * 10,
      ) / 10,
    });
    if (recents.length >= 8) {
      break;
    }
  }

  return recents;
}
