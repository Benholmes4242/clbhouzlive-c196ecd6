/**
 * useMentionAutocomplete — shared token detection + suggestion state.
 *
 * The composer owns the textarea, its value, and its caret position.
 * This hook takes those inputs and returns:
 *
 *   - `activeQuery`   — the text after the trigger `@` under the caret,
 *                       or `null` when there's no active token
 *   - `suggestions`   — up to 6 user + business matches
 *   - `isLoading`     — search in flight
 *   - `applySelection(sel)` → { newText, newCaret }
 *                       Caller sets the textarea value + caret.
 *
 * STORAGE FORMAT: the textarea holds the canonical `@[Name](u:UUID)`
 * markup — the user sees the raw markup while typing. This is a
 * deliberate v2 choice (documented in the PR-2a ship note):
 * contentEditable adds a large maintenance surface for keyboard/IME
 * quirks and doesn't play nicely with the composer autoresize logic,
 * whereas raw markup keeps the textarea a plain <textarea> and gives
 * the rendered feed/comment surfaces (MentionText) a lossless input.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { serializeMention, type MentionEntityType } from './format';

export interface MentionSuggestion {
  entityType: MentionEntityType;
  entityId: string;
  display: string;
  secondary?: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
}

/**
 * Match the @token immediately before the caret.
 * Preceding char must be start-of-string or whitespace.
 * Token body: any char except whitespace, `@`, `]`, `[`, `(`, `)` — up to 30 chars.
 */
const TOKEN_RE = /(?:^|\s)@([^\s@[\]()]{0,30})$/;

interface DetectedToken {
  query: string;
  start: number; // index of the `@` in the full text
  end: number;   // caret position (exclusive end)
}

function detectToken(text: string, caret: number): DetectedToken | null {
  if (caret <= 0 || caret > text.length) return null;
  const head = text.slice(0, caret);
  const m = head.match(TOKEN_RE);
  if (!m) return null;
  const query = m[1] ?? '';
  const atIndex = m.index! + (m[0].length - query.length - 1); // position of `@`
  return { query, start: atIndex, end: caret };
}

export function useMentionAutocomplete(text: string, caret: number) {
  const token = useMemo(() => detectToken(text, caret), [text, caret]);

  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!token) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }
    const q = token.query.trim();
    // Show something even with an empty query — recent/popular is a
    // future win; for v2 an empty @ just waits for at least 1 char.
    if (q.length === 0) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const myReq = ++reqIdRef.current;
    setIsLoading(true);
    const t = setTimeout(async () => {
      try {
        const like = `%${q.replace(/[%_]/g, ch => '\\' + ch)}%`;
        const [users, businesses] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url, is_verified')
            .or(`display_name.ilike.${like},username.ilike.${like},first_name.ilike.${like}`)
            .eq('is_suspended', false)
            .limit(6),
          supabase
            .from('business_accounts')
            .select('id, name, logo_url, is_verified, city, country')
            .ilike('name', like)
            .eq('is_deleted', false)
            .limit(4),
        ]);

        if (myReq !== reqIdRef.current) return; // stale

        const userSug: MentionSuggestion[] = (users.data ?? []).map(u => ({
          entityType: 'user',
          entityId: u.id,
          display: u.display_name || u.username || 'Golfer',
          secondary: u.username ? `@${u.username}` : undefined,
          avatarUrl: u.profile_photo_url ?? null,
          isVerified: !!u.is_verified,
        }));
        const bizSug: MentionSuggestion[] = (businesses.data ?? []).map(b => ({
          entityType: 'business',
          entityId: b.id,
          display: b.name,
          secondary: [b.city, b.country].filter(Boolean).join(', ') || undefined,
          avatarUrl: b.logo_url ?? null,
          isVerified: !!b.is_verified,
        }));

        // Rank: exact prefix match first, then containment. Users before
        // businesses at equal rank (mentions are people-first).
        const rank = (s: MentionSuggestion) => {
          const d = s.display.toLowerCase();
          const qs = q.toLowerCase();
          if (d.startsWith(qs)) return 0;
          if (s.secondary?.toLowerCase().includes(qs)) return 1;
          return 2;
        };
        const merged = [...userSug, ...bizSug]
          .sort((a, b) => rank(a) - rank(b))
          .slice(0, 6);

        setSuggestions(merged);
      } finally {
        if (myReq === reqIdRef.current) setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(t);
  }, [token]);

  const applySelection = (sel: MentionSuggestion): { newText: string; newCaret: number } => {
    if (!token) return { newText: text, newCaret: caret };
    const markup = serializeMention({
      display: sel.display,
      entityType: sel.entityType,
      entityId: sel.entityId,
    });
    const before = text.slice(0, token.start);
    const after = text.slice(token.end);
    // Add a trailing space so the user can keep typing without another @-collision.
    const insert = `${markup} `;
    return {
      newText: `${before}${insert}${after}`,
      newCaret: before.length + insert.length,
    };
  };

  return {
    isActive: !!token && (isLoading || suggestions.length > 0 || (token?.query?.length ?? 0) > 0),
    activeQuery: token?.query ?? null,
    suggestions,
    isLoading,
    applySelection,
  };
}
