/**
 * CONTENT_V3_2_COURSES — Courses tab in the v3 grammar (cc3-content-courses.html).
 * Order: Where members play, Directory, gap chips, Fix next. No amber, weights <= 700.
 * gap_counts is optional: absent means chips show bare labels.
 * Where members play + Fix next are get_admin_course_coverage(500) as
 * returned, filtered on the client. Directory figures and search are the
 * existing useCourses. Fix opens the existing course edit drawer; + Add opens
 * AddCourseSheet — both owned by the caller (ContentPage CoursesTab).
 */
import React, { useMemo, useState } from 'react';
import { useCourseCoverage, isPermissionError } from '../../hooks/useContentDesk';
import type { AdminCourseRow } from '../../hooks/useCourses';
import { CC3, NUM, PANEL3, LIST3, PANEL_TITLE, PANEL_META } from '../InboxPanels';
import { btnBrand, btnOutline } from '../InboxQueueRow';
import {
  INK_55, LABEL10, FIG18, CAPTION, STATS, RULE, LIST_HEAD, PANEL_HEAD, ROW, NAME, SUB, MORE3, EMPTY,
  ochip, CHIP_ROW, chipStyle, chipCount, RAIL_FIG, RAIL_LABEL,
} from './v3Styles';

/** coverage{} keys → bar labels. */
const COVERAGE_LABEL: Record<string, string> = {
  photo: 'Photo', tee: 'Tee data', scorecards: 'Scorecards', location: 'Location', description: 'Description',
};
/** Gap filter chips, in the mock's order. gap_counts keys are these chips'
 * keys; fix_next[].gaps hold the display words, so GAP_LABEL bridges the two. */
export const GAP_CHIPS: { key: string | null; label: string }[] = [
  { key: null, label: 'All gaps' },
  { key: 'location', label: 'Location' },
  { key: 'description', label: 'Description' },
  { key: 'tee', label: 'Tee data' },
  { key: 'photo', label: 'Photo' },
];
const GAP_LABEL: Record<string, string> = { location: 'Location', description: 'Description', tee: 'Tee data', photo: 'Photo' };
/** The RPC's fix_next limit (get_admin_course_coverage(500)). */
const FIX_LIMIT = 500;

export type CoverageTone = 'ink' | 'mute' | 'bad';
export function coverageTone(pct: number): CoverageTone {
  if (pct >= 80) return 'ink';
  if (pct >= 50) return 'mute';
  return 'bad';
}
export function coverageColour(pct: number): { fill: string; text: string } {
  const tone = coverageTone(pct);
  if (tone === 'ink') return { fill: CC3.ink, text: CC3.ink };
  if (tone === 'mute') return { fill: INK_55, text: CC3.mute };
  return { fill: CC3.bad, text: CC3.bad };
}

interface FixRow { id: string; name: string; rounds: number; views: number; gaps: string[] }

const n = (v: number | null | undefined) => (v == null ? '-' : v.toLocaleString('en-GB'));
const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

const CHEVRON = (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke={CC3.faint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 3l4 4-4 4" /></svg>
);

export default function CoursesSection({
  stats, search, onSearch, results, resultsTotal, page, pageSize, onPage, searching,
  onFix, onAdd,
}: {
  stats: { total: number; geocoded: number; missingPhoto: number; top100: number };
  search: string;
  onSearch: (v: string) => void;
  results: AdminCourseRow[];
  resultsTotal: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  searching: boolean;
  onFix: (id: string) => void;
  onAdd: () => void;
}) {
  const q = useCourseCoverage();
  const d = q.data as any;
  const [gap, setGap] = useState<string | null>(null);
  const [shown, setShown] = useState(6);

  const bars = useMemo(() => {
    const cov = (d?.coverage ?? {}) as Record<string, number>;
    return Object.keys(COVERAGE_LABEL)
      .filter((k) => typeof cov[k] === 'number')
      .map((k) => ({ key: k, label: COVERAGE_LABEL[k], value: cov[k] }))
      .sort((a, b) => b.value - a.value);
  }, [d]);

  const allFix = (d?.fix_next ?? []) as FixRow[];
  const gapLabel = gap ? GAP_LABEL[gap] : null;
  const fix: FixRow[] = useMemo(
    // gaps carry the display words ("Tee data"), not the gap_counts keys.
    () => (gapLabel ? allFix.filter((r) => (r.gaps ?? []).includes(gapLabel)) : allFix),
    [allFix, gapLabel],
  );
  const visible = fix.slice(0, shown);
  const more = fix.length - visible.length;

  const counts = d?.gap_counts as Record<string, number> | undefined;
  const chipCountText = (key: string | null): { text: string; value: number } | null => {
    if (!counts) return null;
    if (key) {
      const v = Number(counts[key] ?? 0);
      return { text: n(v), value: v };
    }
    const explicit = counts.all ?? counts.total;
    if (explicit != null) return { text: n(Number(explicit)), value: Number(explicit) };
    const len = allFix.length;
    return { text: len === FIX_LIMIT ? `${n(len)}+` : n(len), value: len };
  };

  const denied = q.isError && isPermissionError(q.error);
  const total = stats.total;
  const withPhoto = Math.max(0, total - stats.missingPhoto);
  const term = search.trim();

  return (
    <>
      <style>{'.cc3-course-search::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}.cc3-course-search::placeholder{color:var(--cc3-faint)}'}</style>
      <section style={PANEL3} data-section="coverage">
        <div style={PANEL_HEAD}>
          <span style={PANEL_TITLE}>Where members play</span>
          <span style={{ ...PANEL_META, ...NUM, textAlign: 'right' }}><span style={{ color: CC3.ink, fontWeight: 700 }}>{n(d?.courses_played)}</span> courses with rounds</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11.5, color: CC3.mute }}>How complete the courses members actually use are</div>
        {denied ? (
          <div style={{ marginTop: 12, fontSize: 12, color: CC3.faint }}>Full admins only</div>
        ) : (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {bars.map((b) => {
              const c = coverageColour(b.value);
              return (
                <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '86px minmax(0, 1fr) 40px', columnGap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: CC3.ink }}>{b.label}</span>
                  <span style={{ display: 'block', height: 10, borderRadius: 3, background: CC3.track, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(0, Math.min(100, b.value))}%`, borderRadius: 3, background: c.fill }} />
                  </span>
                  <span data-tone={coverageTone(b.value)} style={{ ...NUM, fontSize: 12, fontWeight: 700, textAlign: 'right', color: c.text }}>{b.value}%</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ ...CAPTION, ...RULE }}>Scorecards: share of member rounds that arrived with hole-by-hole detail.</div>
      </section>

      <section style={PANEL3} data-section="directory">
        <div style={PANEL_HEAD}>
          <span style={PANEL_TITLE}>Directory</span>
          <span style={{ ...PANEL_META, ...NUM, textAlign: 'right' }}><span style={{ color: CC3.ink, fontWeight: 700 }}>{n(total)}</span> courses</span>
        </div>
        <div style={STATS(3)}>
          <div><div style={LABEL10}>Located</div><div style={{ ...FIG18, marginTop: 3 }}>{n(stats.geocoded)}</div><div style={{ ...CAPTION, ...NUM }}>{pct(stats.geocoded, total)}% of directory</div></div>
          <div><div style={LABEL10}>Photo</div><div style={{ ...FIG18, marginTop: 3 }}>{n(withPhoto)}</div><div style={{ ...CAPTION, ...NUM }}>{pct(withPhoto, total)}% of directory</div></div>
          <div><div style={LABEL10}>Top 100</div><div style={{ ...FIG18, marginTop: 3 }}>{n(stats.top100)}</div><div style={CAPTION}>ranked anywhere</div></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, height: 40, padding: '0 12px', borderRadius: 12, background: CC3.inset, boxSizing: 'border-box' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={CC3.faint} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.75" /><path d="M10.5 10.5 14 14" /></svg>
            <input className="cc3-course-search" type="search" aria-label="Search courses" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={`Search ${n(total)} courses`}
              style={{ flex: 1, minWidth: 0, width: '100%', border: 0, background: 'transparent', color: CC3.ink, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </label>
          <button type="button" onClick={onAdd} style={{ ...btnBrand(), height: 40, borderRadius: 12, flexShrink: 0 }}>+ Add</button>
        </div>
        {!term ? (
          <div style={{ ...CAPTION, marginTop: 10 }}>The full A to Z list opens from search.</div>
        ) : (
          <div style={{ marginTop: 12, marginLeft: -14, marginRight: -14 }}>
            {searching && results.length === 0 ? (
              <div style={EMPTY}>Searching</div>
            ) : results.length === 0 ? (
              <div style={EMPTY}>No courses for &ldquo;{term}&rdquo;</div>
            ) : results.map((c) => (
              <button key={c.id} type="button" onClick={() => onFix(c.id)} style={{ ...ROW, gridTemplateColumns: 'minmax(0, 1fr) 12px' }}>
                <span style={{ minWidth: 0 }}>
                  <span style={NAME}>{c.name}</span>
                  <span style={SUB}>{[c.region ?? c.sub_country, c.country].filter(Boolean).join(', ')}</span>
                </span>
                {CHEVRON}
              </button>
            ))}
            {resultsTotal > pageSize && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px 0', borderTop: `1px solid ${CC3.hair}` }}>
                <span style={{ ...NUM, fontSize: 11, color: CC3.faint }}>{n((page - 1) * pageSize + 1)}-{n(Math.min(page * pageSize, resultsTotal))} of {n(resultsTotal)}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} style={btnOutline(page <= 1)}>Prev</button>
                  <button type="button" disabled={page * pageSize >= resultsTotal} onClick={() => onPage(page + 1)} style={btnOutline(page * pageSize >= resultsTotal)}>Next</button>
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      <div style={CHIP_ROW} data-section="gaps">
        {GAP_CHIPS.map((g) => {
          const on = g.key === gap;
          const c = chipCountText(g.key);
          return (
            <button key={g.label} type="button" aria-pressed={on} data-zero={c && c.value === 0 ? 'true' : undefined}
              onClick={() => { setGap(on ? null : g.key); setShown(6); }}
              style={{ ...chipStyle(on), opacity: c && c.value === 0 ? 0.45 : 1 }}>
              {g.label}{c && <> <b style={chipCount(on)}>{c.text}</b></>}
            </button>
          );
        })}
      </div>

      <section style={LIST3} data-section="fix-next">
        <div style={LIST_HEAD}>
          <span style={PANEL_TITLE}>Fix next{gapLabel ? ` \u00b7 ${gapLabel}` : ''}</span>
          <span style={{ ...PANEL_META, textAlign: 'right' }}>most played first</span>
        </div>
        {!q.isLoading && !denied && visible.length === 0 && <div style={EMPTY}>Nothing to fix here</div>}
        {visible.map((r) => {
          const gs = (r.gaps ?? []).filter((g) => g !== gapLabel);
          return (
            <button key={r.id} type="button" onClick={() => onFix(r.id)} style={{ ...ROW, gridTemplateColumns: 'minmax(0, 1fr) auto 12px' }}>
              <span style={{ minWidth: 0 }}>
                <span style={NAME}>{r.name}</span>
                <span style={{ ...SUB, ...NUM }}>{n(r.views)} {r.views === 1 ? 'view' : 'views'} in 30d</span>
                {gs.length > 0 && (
                  <span style={{ ...CHIP_ROW, gap: 5, marginTop: 6 }}>
                    {gs.map((g) => <span key={g} style={ochip(g === 'Location' ? 'bad' : 'neutral')}>{g}</span>)}
                  </span>
                )}
              </span>
              <span style={{ textAlign: 'right' }}>
                <span style={RAIL_FIG}>{n(r.rounds)}</span>
                <span style={RAIL_LABEL}>rounds</span>
              </span>
              {CHEVRON}
            </button>
          );
        })}
        {more > 0 && (
          <button type="button" onClick={() => setShown((s) => s + 20)} style={MORE3}>{more.toLocaleString('en-GB')} more</button>
        )}
      </section>
    </>
  );
}
