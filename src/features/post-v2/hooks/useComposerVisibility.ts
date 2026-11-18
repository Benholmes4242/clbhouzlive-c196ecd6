// Composer-only audience ownership: business values are public at every read
// and write boundary, and crossing the business/personal boundary drops choices.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PostVisibility } from '../lib/golfPostRules';

export function composerVisibility(actorType: string | null | undefined, value: PostVisibility): PostVisibility {
  return actorType === 'business' ? 'anyone' : value;
}

export function useComposerVisibility(actorType: string | null | undefined) {
  const [choice, setChoice] = useState<PostVisibility>('anyone');
  const business = actorType === 'business';
  const previousBusiness = useRef(business);
  useEffect(() => {
    if (previousBusiness.current !== business) setChoice('anyone');
    previousBusiness.current = business;
  }, [business]);
  const setVisibility = useCallback((value: PostVisibility) => {
    setChoice(composerVisibility(actorType, value));
  }, [actorType]);
  return { visibility: composerVisibility(actorType, choice), setVisibility };
}