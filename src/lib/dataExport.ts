import {collection, getDocs} from 'firebase/firestore';
import {db} from './firebase';
import type {UserProfile} from './userProfile';
import {localDateKey} from './dates';

function serializeValue(value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as {toDate: unknown}).toDate === 'function'
  ) {
    return (value as {toDate: () => Date}).toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeValue(v);
    }
    return out;
  }
  return value;
}

async function dumpSubcollection(
  uid: string,
  name: string,
): Promise<Record<string, unknown>[]> {
  if (!db) {
    throw {code: 'auth/not-configured'};
  }
  const snap = await getDocs(collection(db, 'users', uid, name));
  return snap.docs.map(d =>
    serializeValue({id: d.id, ...d.data()}) as Record<string, unknown>,
  );
}

export type KinExportPayload = {
  exportedAt: string;
  profile: Record<string, unknown> | null;
  mealEntries: Record<string, unknown>[];
  habits: Record<string, unknown>[];
  habitLogs: Record<string, unknown>[];
  weights: Record<string, unknown>[];
};

export async function buildKinExport(
  uid: string,
  profile: UserProfile | null,
): Promise<{filename: string; json: string}> {
  const [mealEntries, habits, habitLogs, weights] = await Promise.all([
    dumpSubcollection(uid, 'mealEntries'),
    dumpSubcollection(uid, 'habits'),
    dumpSubcollection(uid, 'habitLogs'),
    dumpSubcollection(uid, 'weights'),
  ]);

  const payload: KinExportPayload = {
    exportedAt: new Date().toISOString(),
    profile: profile
      ? (serializeValue(profile) as Record<string, unknown>)
      : null,
    mealEntries,
    habits,
    habitLogs,
    weights,
  };

  const filename = `kin-export-${localDateKey()}.json`;
  return {filename, json: JSON.stringify(payload, null, 2)};
}
