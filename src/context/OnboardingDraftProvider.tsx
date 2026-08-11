import React, {createContext, useCallback, useMemo, useState} from 'react';
import {useAuth} from '../hooks/useAuth';

export type OnboardingDraft = {
  name: string;
  startWeightKg: string;
  goalWeightKg: string;
  heightCm: string;
  dailyKcalTarget: number | null;
};

type DraftCtx = {
  draft: OnboardingDraft;
  setDraft: (patch: Partial<OnboardingDraft>) => void;
};

const emptyDraft: OnboardingDraft = {
  name: '',
  startWeightKg: '',
  goalWeightKg: '',
  heightCm: '',
  dailyKcalTarget: null,
};

export const OnboardingDraftContext = createContext<DraftCtx>({
  draft: emptyDraft,
  setDraft: () => {},
});

export function OnboardingDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {user} = useAuth();
  const [draft, setDraftState] = useState<OnboardingDraft>(() => ({
    ...emptyDraft,
    name: user?.displayName ?? '',
  }));

  const setDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraftState(prev => ({...prev, ...patch}));
  }, []);

  const value = useMemo(() => ({draft, setDraft}), [draft, setDraft]);

  return (
    <OnboardingDraftContext.Provider value={value}>
      {children}
    </OnboardingDraftContext.Provider>
  );
}
