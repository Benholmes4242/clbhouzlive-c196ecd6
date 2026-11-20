/** Review selection shares post candidates, mention resolution and toggle rules.
 * Hydration is scoped to the mounted review; callers supply a known play date
 * or null, never infer it from publication time or unrelated rounds. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { captionMentionIds, toggleWith, type WithCandidate } from '@/features/post-v2/lib/golfPostRules';
import { fetchPlayedWithSuggestions, readWithCandidates, searchMembers } from '@/features/post-v2/lib/golfPostReads';
import { readReviewWith } from '../lib/reviewWith';

export function useReviewPlayedWith({ userId, reviewId, personal, content, round }: {
  userId: string | null; reviewId: string | null; personal: boolean; content: string; round: { courseId: string; day: string } | null;
}) {
  const [suggestions, setSuggestions] = useState<WithCandidate[]>([]);
  const [tagged, setTagged] = useState<WithCandidate[]>([]);
  const [mentioned, setMentioned] = useState<WithCandidate[]>([]);
  const previous = useRef<string[]>([]);
  const [ready, setReady] = useState(!reviewId);
  useEffect(() => {
    if (!personal || !userId) return;
    let cancelled = false;
    void fetchPlayedWithSuggestions(userId, round).then(rows => { if (!cancelled) setSuggestions(rows); }).catch(error => console.warn('[review-v2] Played with suggestions failed:', error));
    return () => { cancelled = true; };
  }, [personal, userId, round?.courseId, round?.day]);
  useEffect(() => {
    if (!personal || !userId || !reviewId) { setReady(true); return; }
    let cancelled = false;
    setReady(false);
    void readReviewWith([reviewId]).then(rows => {
      if (cancelled) return;
      previous.current = rows.map(row => row.userId);
      setTagged(rows.map(row => ({ id: row.userId, name: row.name, avatarUrl: row.avatarUrl, username: row.username, sameRound: false, lastInteraction: '' })));
      setReady(true);
    }).catch(error => { console.warn('[review-v2] Played with preload failed:', error); });
    return () => { cancelled = true; };
  }, [personal, userId, reviewId]);
  const mentionKey = personal ? captionMentionIds(content, userId).join(',') : '';
  useEffect(() => {
    if (!mentionKey) { setMentioned([]); return; }
    let cancelled = false;
    void readWithCandidates(mentionKey.split(',')).then(rows => { if (!cancelled) setMentioned(rows); }).catch(() => { if (!cancelled) setMentioned([]); });
    return () => { cancelled = true; };
  }, [mentionKey]);
  const onToggle = useCallback((person: WithCandidate) => { if (ready) setTagged(rows => toggleWith(rows, person, userId)); }, [userId, ready]);
  const search = useCallback((query: string) => searchMembers(query, userId), [userId]);
  return { suggestions, tagged, mentioned, onToggle, search, previous, ready };
}