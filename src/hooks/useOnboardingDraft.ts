import {useContext} from 'react';
import {OnboardingDraftContext} from '../context/OnboardingDraftProvider';

export const useOnboardingDraft = () => useContext(OnboardingDraftContext);
