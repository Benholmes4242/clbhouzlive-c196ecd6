/**
 * MentionsComposerInput — canonical composer input for mentions v2.
 *
 * DECISION: adopts `react-mentions` rather than a DIY overlay. That
 * library implements exactly the display-transform pattern this brief
 * requires:
 *   - `value` is the canonical markup (`@[Name](u:UUID)`)
 *   - the visible textarea shows the display form (`@Name`)
 *   - caret positions map through the transform
 *   - Backspace into a mention deletes the WHOLE mention atomically
 *     (no half-deleted `(u:...)` states are ever possible)
 *
 * react-mentions' default markup template is exactly
 * `@[__display__](__id__)`, which lines up with our storage format
 * (id = `u:UUID` or `b:UUID`). No custom serialization needed —
 * `onChange(_, newValue)` hands us the canonical string.
 *
 * Suggestions render via `renderSuggestion` using the same Dispatch
 * squircle / verified-badge language as the standalone popup that
 * PR-2a shipped.
 */

import { MentionsInput, Mention, type SuggestionDataItem } from 'react-mentions';
import { CheckCircle2, Building2 } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';

const INK = '#0F172A';
const INK_SUBTLE = '#94A3B8';
const AMBER = '#F7931E';
const BORDER = 'rgba(15,23,42,0.10)';

/** react-mentions passes `id` as a string; we encode `${kind}:${uuid}` there. */
interface RichSuggestion extends SuggestionDataItem {
  id: string; // "u:UUID" | "b:UUID"
  display: string;
  avatarUrl?: string | null;
  secondary?: string;
  isVerified?: boolean;
  kind: 'user' | 'business';
}

/**
 * Search the two mention pools. Called by react-mentions with the
 * text after the `@` trigger and a `render(results)` callback.
 */
async function searchMentions(
  query: string,
  render: (data: SuggestionDataItem[]) => void,
) {
  const q = (query ?? '').trim();
  if (q.length === 0) {
    render([]);
    return;
  }
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

  const userRows: RichSuggestion[] = (users.data ?? []).map(u => ({
    id: `u:${u.id}`,
    display: u.display_name || u.username || 'Golfer',
    secondary: u.username ? `@${u.username}` : undefined,
    avatarUrl: u.profile_photo_url ?? null,
    isVerified: !!u.is_verified,
    kind: 'user',
  }));
  const bizRows: RichSuggestion[] = (businesses.data ?? []).map(b => ({
    id: `b:${b.id}`,
    display: b.name,
    secondary: [b.city, b.country].filter(Boolean).join(', ') || undefined,
    avatarUrl: b.logo_url ?? null,
    isVerified: !!b.is_verified,
    kind: 'business',
  }));

  // Rank: prefix > contains, users before businesses at equal rank.
  const rank = (s: RichSuggestion) => {
    const d = s.display.toLowerCase();
    const qs = q.toLowerCase();
    if (d.startsWith(qs)) return 0;
    if (s.secondary?.toLowerCase().includes(qs)) return 1;
    return 2;
  };
  const merged = [...userRows, ...bizRows]
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 6);

  render(merged);
}

interface Props {
  value: string; // canonical markup
  onChange: (markup: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  /** Bubbles up focus/blur so the surrounding composer can style its border. */
  onFocus?: () => void;
  onBlur?: () => void;
  /** Optional inline style on the outer wrapper (rare; prefer wrapping in a styled div). */
  style?: React.CSSProperties;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
}

/**
 * Style object for react-mentions. Keys map to internal DOM parts.
 * We keep the input transparent so the surrounding composer chrome
 * (the pill background + border) shines through.
 */
const mentionsStyle = {
  control: {
    fontSize: 14,
    lineHeight: 1.4,
    fontFamily: 'inherit',
    background: 'transparent',
    minHeight: 20,
  },
  highlighter: {
    padding: '8px 0',
    border: 0,
    minHeight: 20,
    maxHeight: 120,
    overflow: 'hidden',
    // Give mentions their visual amber weight in the overlay.
  },
  input: {
    padding: '8px 0',
    border: 0,
    outline: 'none',
    minHeight: 20,
    maxHeight: 120,
    overflow: 'auto' as const,
    background: 'transparent',
    color: INK,
    fontFamily: 'inherit',
    resize: 'none' as const,
  },
  suggestions: {
    // Anchor the suggestion list ABOVE the input, matching the PR-2a
    // popup position. react-mentions positions it under the caret by
    // default; the anchored composer sits at the bottom of the sheet
    // so we flip it upward via CSS in the wrapper below.
    list: {
      background: '#ffffff',
      borderRadius: 12,
      border: `0.5px solid ${BORDER}`,
      boxShadow:
        '0 8px 24px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.08)',
      maxHeight: 260,
      overflowY: 'auto' as const,
      fontSize: 13.5,
      position: 'absolute' as const,
      bottom: '100%',
      marginBottom: 8,
      left: 0,
      right: 0,
      width: 'auto',
      zIndex: 210,
    },
    item: {
      padding: 0,
      borderBottom: `0.5px solid ${BORDER}`,
      '&focused': {
        background: 'rgba(247,147,30,0.08)',
      },
    },
  },
};

const mentionStyle = {
  // Overlay style for a rendered mention token — amber, semibold.
  color: AMBER,
  fontWeight: 600,
  background: 'transparent',
  textShadow:
    '1px 1px 1px #ffffff, 1px -1px 1px #ffffff, -1px 1px 1px #ffffff, -1px -1px 1px #ffffff',
};

/**
 * Convert the react-mentions `display` (which is `@Name` — the raw
 * matched string including the `@`) into just the display name.
 */
function renderSuggestion(
  entry: SuggestionDataItem,
  _search: string,
  _highlighted: React.ReactNode,
  _index: number,
  focused: boolean,
) {
  const s = entry as RichSuggestion;
  return (
    <div
      className="flex items-center gap-2.5 text-left"
      style={{
        padding: '8px 10px',
        minHeight: 44,
        background: focused ? 'rgba(247,147,30,0.08)' : 'transparent',
      }}
    >
      <SquircleAvatar
        size={30}
        src={s.avatarUrl ?? undefined}
        alt={s.display}
        fallback={s.display.charAt(0).toUpperCase()}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span
            className="truncate"
            style={{ fontSize: 13.5, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}
          >
            {s.display}
          </span>
          {s.isVerified && (
            <CheckCircle2 size={12} style={{ color: AMBER, flexShrink: 0 }} strokeWidth={2.25} />
          )}
          {s.kind === 'business' && (
            <Building2 size={11} style={{ color: INK_SUBTLE, flexShrink: 0 }} strokeWidth={2} />
          )}
        </div>
        {s.secondary && (
          <div
            className="truncate"
            style={{ fontSize: 11.5, color: INK_SUBTLE, lineHeight: 1.2, marginTop: 1 }}
          >
            {s.secondary}
          </div>
        )}
      </div>
    </div>
  );
}

export function MentionsComposerInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength,
  autoFocus,
  onFocus,
  onBlur,
  style,
  inputRef,
}: Props) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, ...style }}>
      <MentionsInput
        value={value}
        onChange={(_evt, newValue) => onChange(newValue)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        inputRef={inputRef as any}
        allowSuggestionsAboveCursor
        forceSuggestionsAboveCursor
        style={mentionsStyle}
        // Enter submits (matches composer contract); Shift+Enter → newline.
        onKeyDown={(e: any) => {
          if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
        // Keep placeholder colour aligned with the rest of the app.
        className="mentions-composer"
      >
        <Mention
          trigger="@"
          data={searchMentions}
          renderSuggestion={renderSuggestion}
          // Default markup is `@[__display__](__id__)` — which for us
          // becomes `@[Name](u:UUID)`. Do NOT override.
          displayTransform={(_id, display) => `@${display}`}
          appendSpaceOnAdd
          style={mentionStyle}
        />
      </MentionsInput>
    </div>
  );
}
