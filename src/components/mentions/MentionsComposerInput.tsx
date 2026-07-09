/**
 * MentionsComposerInput — canonical composer input for mentions v2.
 *
 * Suggestions panel architecture (single source; four consumers:
 * PostComposer, ReviewWizard, CommentsSheet, TopTenCardComments):
 *
 *   • react-mentions' own overlay shell (`.suggestions`) is styled
 *     0x0 / pointer-transparent — it exists only as an open/closed
 *     bridge that hands us `children`. We used to render our visible
 *     panel INSIDE that shell; the shell's own layout was piercing
 *     hit-tests (elementFromPoint returned the composer beneath),
 *     so the panel painted but felt invisible.
 *   • AnchoredMentionsPanel now portals its visible chrome directly
 *     to `document.body` via `ReactDOM.createPortal`, as a SIBLING
 *     of the react-mentions shell — no shell/ancestor layout can
 *     clip or occlude it. React tree is unchanged, so the library's
 *     click handlers on the rendered `<li>`s still route normally.
 *   • Placement: measures the composer's input row and fixes itself
 *     to that rect. Width = anchor.width, left = anchor.left,
 *     placement = above/below based on the VISUAL viewport (accounts
 *     for the iOS keyboard shift under Median WebView).
 *   • Listeners: ResizeObserver on the anchor + panel, plus
 *     window.resize/scroll and visualViewport.resize/scroll — all
 *     torn down when the panel unmounts (unmount == close). The
 *     panel remounts every open, so first-frame measurement is
 *     always fresh.
 *   • z-index token: `Z.mentionsPanel` (12010) — clears sheet
 *     surfaces (12003) so comments/top-ten hosts keep working.
 *   • Mouse-down suppression: `onMouseDown` preventDefault on the
 *     panel root keeps the textarea focused so react-mentions'
 *     click handler on the `<li>` lands before blur closes the
 *     suggestions.
 *
 * NO host-level `.suggestions` overrides. Grep for `.suggestions`
 * placement or `mentionsPanel` should only return this file.
 */


import React from 'react';
import ReactDOM from 'react-dom';
import { MentionsInput, Mention, type SuggestionDataItem } from 'react-mentions';

import { CheckCircle2, Building2, AtSign } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';
import { Z } from '@/config/zIndex';

const INK = '#0F172A';
const INK_SUBTLE = '#94A3B8';
const AMBER = '#F7931E';
const BORDER = 'rgba(15,23,42,0.10)';

const PANEL_MAX_HEIGHT = 6 * 44 + 44 + 8; // 6 rows + eyebrow header + gutter
const PANEL_GAP = 6;                 // px between panel and anchor

/** react-mentions passes `id` as a string; we encode `${kind}:${uuid}` there. */
interface RichSuggestion extends SuggestionDataItem {
  id: string; // "u:UUID" | "b:UUID"
  display: string;
  avatarUrl?: string | null;
  secondary?: string;
  isVerified?: boolean;
  kind: 'user' | 'business';
}

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
  try {
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
  } catch {
    // Silent — the library ignores our returned promise, and empty results
    // simply keep the panel closed. Errors don't cascade.
    render([]);
  }
}


export interface MentionsTextStyle {
  fontSize?: number;
  lineHeight?: string | number;
  padding?: string;
  color?: string;
  caretColor?: string;
  minHeight?: number;
  maxHeight?: number;
}

interface Props {
  value: string;
  onChange: (markup: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
  textStyle?: MentionsTextStyle;
}

const DEFAULT_TEXT_STYLE: Required<Pick<MentionsTextStyle, 'fontSize' | 'lineHeight' | 'padding' | 'color' | 'caretColor'>> = {
  fontSize: 14,
  lineHeight: '20px',
  padding: '8px 0',
  color: INK,
  caretColor: INK,
};

/**
 * react-mentions style object. `.suggestions` intentionally renders
 * a 0x0 pointer-transparent shell — the visible panel is drawn by
 * `AnchoredMentionsPanel` (see `customSuggestionsContainer`).
 */
function buildMentionsStyle(text: MentionsTextStyle | undefined) {
  const t = { ...DEFAULT_TEXT_STYLE, ...(text ?? {}) };
  const sharedText = {
    fontFamily: 'inherit',
    fontSize: t.fontSize,
    fontWeight: 400,
    lineHeight: t.lineHeight,
    letterSpacing: '0px',
    padding: t.padding,
    border: '0px solid transparent',
    boxSizing: 'border-box' as const,
    margin: 0,
  };
  const maxH = text?.maxHeight;
  const minH = text?.minHeight;
  return {
    control: {
      background: 'transparent',
      minHeight: minH ?? 36,
      fontFamily: sharedText.fontFamily,
      fontSize: sharedText.fontSize,
      fontWeight: sharedText.fontWeight,
      lineHeight: sharedText.lineHeight,
      letterSpacing: sharedText.letterSpacing,
    },
    highlighter: {
      ...sharedText,
      color: t.color,
      WebkitTextFillColor: t.color,
      minHeight: minH,
      maxHeight: maxH,
      overflow: maxH ? 'hidden' : undefined,
      whiteSpace: 'pre-wrap' as const,
      wordWrap: 'break-word' as const,
      substring: {
        visibility: 'visible' as const,
        color: t.color,
        WebkitTextFillColor: t.color,
      },
    },
    input: {
      ...sharedText,
      outline: 'none',
      minHeight: minH,
      maxHeight: maxH,
      overflow: maxH ? ('auto' as const) : ('hidden' as const),
      background: 'transparent',
      color: 'transparent',
      caretColor: t.caretColor,
      resize: 'none' as const,
      whiteSpace: 'pre-wrap' as const,
      wordWrap: 'break-word' as const,
      WebkitTextFillColor: 'transparent',
    },
    // Invisible/inert shell. All visible chrome + positioning is
    // taken over by AnchoredMentionsPanel below (customSuggestionsContainer).
    suggestions: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      margin: 0,
      padding: 0,
      pointerEvents: 'none' as const,
      background: 'transparent',
      zIndex: Z.mentionsPanel,
      list: {
        background: 'transparent',
        margin: 0,
        padding: 0,
        listStyle: 'none',
      },
      item: {
        padding: 0,
        '&focused': {
          background: 'rgba(247,147,30,0.08)',
        },
      },
    },
  };
}

const mentionStyle = {
  color: AMBER,
  fontWeight: 400,
  background: 'transparent',
};

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
        position: 'relative',
        padding: '9px 14px',
        minHeight: 44,
        background: focused ? 'rgba(247,147,30,0.10)' : 'transparent',
      }}
    >
      {focused && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 6,
            bottom: 6,
            width: 3,
            background: AMBER,
            borderTopRightRadius: 2,
            borderBottomRightRadius: 2,
          }}
        />
      )}
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
            style={{ fontSize: 14, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}
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
            style={{ fontSize: 12, color: INK_SUBTLE, lineHeight: 1.2, marginTop: 1 }}
          >
            {s.secondary}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// AnchoredMentionsPanel — the actual visible suggestions surface.
//
// Portaled to document.body via react-mentions' suggestionsPortalHost.
// Measures the composer's anchor row and re-measures on every event
// that can shift geometry:
//   - ResizeObserver on the anchor and on the panel itself
//   - window resize / scroll (capture: true, so ancestor scroll fires)
//   - visualViewport resize / scroll (iOS keyboard show/hide/pan)
// Placement is judged against visualViewport.height so the wizard's
// low verdict field flips ABOVE when the keyboard eats the space
// below.
// ────────────────────────────────────────────────────────────────
interface AnchoredPanelProps {
  anchorRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
}

function AnchoredMentionsPanel({ anchorRef, children }: AnchoredPanelProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [geom, setGeom] = React.useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: 'above' | 'below';
  } | null>(null);

  const measure = React.useCallback(() => {
    const a = anchorRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const vTop = vv?.offsetTop ?? 0;
    const vHeight = vv?.height ?? window.innerHeight;
    const vBottom = vTop + vHeight;

    const spaceBelow = vBottom - r.bottom - PANEL_GAP - 8;
    const spaceAbove = r.top - vTop - PANEL_GAP - 8;

    // Prefer BELOW when it fits comfortably; flip ABOVE when below
    // is cramped and above has more room (the keyboard-up case).
    const wantsAbove =
      spaceBelow < Math.min(180, PANEL_MAX_HEIGHT) && spaceAbove > spaceBelow;

    const panelH = panelRef.current?.getBoundingClientRect().height ?? PANEL_MAX_HEIGHT;

    const maxHeight = Math.max(
      120,
      Math.min(PANEL_MAX_HEIGHT, wantsAbove ? spaceAbove : spaceBelow),
    );

    const top = wantsAbove
      ? Math.max(vTop + 8, r.top - PANEL_GAP - Math.min(panelH, maxHeight))
      : Math.min(vBottom - Math.min(panelH, maxHeight) - 8, r.bottom + PANEL_GAP);

    // Clamp to visual viewport so a narrow sheet can never cause overflow.
    const vLeft = vv?.offsetLeft ?? 0;
    const vW = vv?.width ?? window.innerWidth;
    const clampedLeft = Math.max(vLeft + 8, r.left);
    const clampedWidth = Math.min(r.width, vW - 16);

    setGeom(prev => {
      const next = { top, left: clampedLeft, width: clampedWidth, maxHeight, placement: (wantsAbove ? 'above' : 'below') as 'above' | 'below' };
      if (
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.maxHeight === next.maxHeight &&
        prev.placement === next.placement
      ) {
        return prev;
      }
      return next;
    });
  }, [anchorRef]);

  // Mount-time measurement + full listener lifecycle. This effect
  // runs every time the panel mounts (== every time suggestions
  // open), so no "measured stale" state can persist across steps.
  React.useLayoutEffect(() => {
    measure();

    const ro = new ResizeObserver(() => measure());
    if (anchorRef.current) ro.observe(anchorRef.current);
    // Observe our own panel too — first render has no height yet,
    // so the initial `panelH` guess is PANEL_MAX_HEIGHT; the RO
    // will re-fire once the ul lays out and correct placement.
    if (panelRef.current) ro.observe(panelRef.current);

    const onWinResize = () => measure();
    const onWinScroll = () => measure();
    window.addEventListener('resize', onWinResize);
    window.addEventListener('scroll', onWinScroll, true);

    const vv = window.visualViewport;
    vv?.addEventListener('resize', onWinResize);
    vv?.addEventListener('scroll', onWinScroll);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWinResize);
      window.removeEventListener('scroll', onWinScroll, true);
      vv?.removeEventListener('resize', onWinResize);
      vv?.removeEventListener('scroll', onWinScroll);
    };
  }, [measure, anchorRef]);

  // Portal the visible chrome DIRECTLY to <body>, as a SIBLING of the
  // react-mentions shell — nothing about the shell (0x0, pointer-none)
  // can clip / pierce / occlude it. React tree is unchanged, so the
  // library's synthetic click handlers on the <li>s still route.
  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(
    <div
      ref={panelRef}
      // Preserve textarea focus so react-mentions' click handler lands
      // before blur closes the suggestions overlay.
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        top: geom?.top ?? -9999,
        left: geom?.left ?? -9999,
        width: geom?.width ?? 0,
        maxHeight: geom?.maxHeight ?? PANEL_MAX_HEIGHT,
        overflowY: 'auto',
        background: '#FFFFFF',
        borderRadius: 14,
        border: `1px solid rgba(15,23,42,0.08)`,
        boxShadow:
          '0 12px 32px -8px rgba(15,23,42,0.22), 0 2px 6px rgba(15,23,42,0.08)',
        fontSize: 13.5,
        pointerEvents: 'auto',
        opacity: geom ? 1 : 0,
        zIndex: Z.mentionsPanel,
      }}
    >
      {children}
    </div>,
    document.body,
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
  textStyle,
}: Props) {
  const mentionsStyle = React.useMemo(() => buildMentionsStyle(textStyle), [textStyle]);
  const anchorRef = React.useRef<HTMLDivElement | null>(null);

  // Server-render / test safety: only enable the portal once we know
  // document.body exists. React-mentions treats a falsy portal host
  // as "render inline" (which is what we did before), so any SSR path
  // still renders a valid tree.
  const portalHost = typeof document !== 'undefined' ? document.body : undefined;

  const customSuggestionsContainer = React.useCallback(
    (children: React.ReactNode) => (
      <AnchoredMentionsPanel anchorRef={anchorRef}>{children}</AnchoredMentionsPanel>
    ),
    [],
  );

  return (
    <div
      ref={anchorRef}
      style={{ position: 'relative', flex: 1, minWidth: 0, width: '100%', ...style }}
    >
      <MentionsInput
        value={value}
        onChange={(_evt, newValue) => onChange(newValue)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        inputRef={inputRef as any}
        // Let the library measure; AnchoredMentionsPanel flips based
        // on visualViewport, so we don't force a direction here.
        allowSuggestionsAboveCursor
        suggestionsPortalHost={portalHost as any}
        customSuggestionsContainer={customSuggestionsContainer}
        style={mentionsStyle}
        onKeyDown={(e: any) => {
          if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="mentions-composer"
      >
        <Mention
          trigger="@"
          data={searchMentions}
          renderSuggestion={renderSuggestion}
          displayTransform={(_id, display) => `@${display}`}
          appendSpaceOnAdd
          style={mentionStyle}
        />
      </MentionsInput>
    </div>
  );
}

