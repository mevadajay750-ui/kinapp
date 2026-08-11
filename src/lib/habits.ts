import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {db} from './firebase';
import {
  HabitKind,
  habitLogId,
  isHabitCompleted,
} from './habitLogic';

export type {HabitKind, WeekDotStatus} from './habitLogic';
export {
  habitLogId,
  isHabitCompleted,
  createdDateKey,
  weekDotStatus,
  consecutiveStreak,
} from './habitLogic';

export type Habit = {
  id: string;
  name: string;
  kind: HabitKind;
  icon: string;
  target: number | null;
  unit: string | null;
  order: number;
  archived: boolean;
  createdAt: unknown;
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string;
  value: number;
  target: number | null;
  completed: boolean;
  updatedAt: unknown;
};

export type NewHabit = {
  name: string;
  kind: HabitKind;
  icon: string;
  target: number | null;
  unit: string | null;
  order?: number;
};

export type DefaultHabitSeed = {
  name: string;
  kind: HabitKind;
  icon: string;
  target: number | null;
  unit: string | null;
  order: number;
};

export const DEFAULT_HABITS: DefaultHabitSeed[] = [
  {
    name: 'Drink water',
    kind: 'count',
    icon: 'Droplet',
    target: 8,
    unit: 'glasses',
    order: 0,
  },
  {
    name: 'Sleep',
    kind: 'amount',
    icon: 'Moon',
    target: 7.5,
    unit: 'hours',
    order: 1,
  },
  {
    name: 'Walk 30 minutes',
    kind: 'binary',
    icon: 'Footprints',
    target: null,
    unit: null,
    order: 2,
  },
  {
    name: 'Stretch or move',
    kind: 'binary',
    icon: 'Sparkles',
    target: null,
    unit: null,
    order: 3,
  },
  {
    name: 'Eat a vegetable at every meal',
    kind: 'binary',
    icon: 'Salad',
    target: null,
    unit: null,
    order: 4,
  },
];

function habitsCol(uid: string) {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  return collection(db, 'users', uid, 'habits');
}

function habitDoc(uid: string, habitId: string) {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  return doc(db, 'users', uid, 'habits', habitId);
}

function habitLogsCol(uid: string) {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  return collection(db, 'users', uid, 'habitLogs');
}

function habitLogDoc(uid: string, logId: string) {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  return doc(db, 'users', uid, 'habitLogs', logId);
}

function mapHabit(id: string, data: Record<string, unknown>): Habit {
  return {
    id,
    name: String(data.name ?? ''),
    kind: data.kind as HabitKind,
    icon: String(data.icon ?? 'Sparkles'),
    target: data.target == null ? null : Number(data.target),
    unit: data.unit == null ? null : String(data.unit),
    order: Number(data.order ?? 0),
    archived: Boolean(data.archived),
    createdAt: data.createdAt,
  };
}

function mapLog(id: string, data: Record<string, unknown>): HabitLog {
  return {
    id,
    habitId: String(data.habitId ?? ''),
    date: String(data.date ?? ''),
    value: Number(data.value ?? 0),
    target: data.target == null ? null : Number(data.target),
    completed: Boolean(data.completed),
    updatedAt: data.updatedAt,
  };
}

export function subscribeToHabits(
  uid: string,
  cb: (habits: Habit[]) => void,
): () => void {
  const q = query(
    habitsCol(uid),
    where('archived', '==', false),
    orderBy('order'),
  );

  return onSnapshot(
    q,
    snap => {
      cb(snap.docs.map(d => mapHabit(d.id, d.data() as Record<string, unknown>)));
    },
    err => {
      console.warn('[kin] subscribeToHabits error', err);
      cb([]);
    },
  );
}

export function subscribeToArchivedHabits(
  uid: string,
  cb: (habits: Habit[]) => void,
): () => void {
  const q = query(
    habitsCol(uid),
    where('archived', '==', true),
    orderBy('order'),
  );

  return onSnapshot(
    q,
    snap => {
      cb(snap.docs.map(d => mapHabit(d.id, d.data() as Record<string, unknown>)));
    },
    err => {
      console.warn('[kin] subscribeToArchivedHabits error', err);
      cb([]);
    },
  );
}

export function subscribeToHabitLogs(
  uid: string,
  dateKey: string,
  cb: (logs: HabitLog[]) => void,
): () => void {
  const q = query(habitLogsCol(uid), where('date', '==', dateKey));

  return onSnapshot(
    q,
    snap => {
      cb(snap.docs.map(d => mapLog(d.id, d.data() as Record<string, unknown>)));
    },
    err => {
      console.warn('[kin] subscribeToHabitLogs error', err);
      cb([]);
    },
  );
}

export async function getHabitLogRange(
  uid: string,
  startKey: string,
  endKey: string,
): Promise<HabitLog[]> {
  const q = query(
    habitLogsCol(uid),
    where('date', '>=', startKey),
    where('date', '<=', endKey),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => mapLog(d.id, d.data() as Record<string, unknown>));
}

export async function setHabitValue(
  uid: string,
  habit: Habit,
  dateKey: string,
  value: number,
): Promise<void> {
  const id = habitLogId(dateKey, habit.id);
  const completed = isHabitCompleted(habit.kind, value, habit.target);
  await setDoc(
    habitLogDoc(uid, id),
    {
      id,
      habitId: habit.id,
      date: dateKey,
      value,
      target: habit.target,
      completed,
      updatedAt: serverTimestamp(),
    },
    {merge: true},
  );
}

export async function createHabit(
  uid: string,
  input: NewHabit,
): Promise<string> {
  const ref = doc(habitsCol(uid));
  let order = input.order;
  if (order == null) {
    const active = query(
      habitsCol(uid),
      where('archived', '==', false),
      orderBy('order'),
    );
    const snap = await getDocs(active);
    const last = snap.docs[snap.docs.length - 1];
    order = last ? Number(last.data().order ?? 0) + 1 : 0;
  }
  await setDoc(ref, {
    name: input.name,
    kind: input.kind,
    icon: input.icon,
    target: input.target,
    unit: input.unit,
    order,
    archived: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHabit(
  uid: string,
  habitId: string,
  patch: Partial<
    Pick<Habit, 'name' | 'kind' | 'icon' | 'target' | 'unit' | 'order' | 'archived'>
  >,
): Promise<void> {
  await updateDoc(habitDoc(uid, habitId), patch);
}

export async function archiveHabit(uid: string, habitId: string): Promise<void> {
  await updateDoc(habitDoc(uid, habitId), {archived: true});
}

export async function getHabit(
  uid: string,
  habitId: string,
): Promise<Habit | null> {
  const snap = await getDoc(habitDoc(uid, habitId));
  if (!snap.exists()) {
    return null;
  }
  return mapHabit(snap.id, snap.data() as Record<string, unknown>);
}

export async function reorderHabits(
  uid: string,
  orderedIds: string[],
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(habitDoc(uid, id), {order: index});
  });
  await batch.commit();
}

/** Seed default habits into an existing writeBatch (onboarding). */
export function seedDefaultHabitsIntoBatch(
  batch: ReturnType<typeof writeBatch>,
  uid: string,
): void {
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  for (const seed of DEFAULT_HABITS) {
    const ref = doc(habitsCol(uid));
    batch.set(ref, {
      name: seed.name,
      kind: seed.kind,
      icon: seed.icon,
      target: seed.target,
      unit: seed.unit,
      order: seed.order,
      archived: false,
      createdAt: serverTimestamp(),
    });
  }
}
