/**
 * BRIEF_CONTENT_DESK Stage 3 — Courses (Courses.html).
 * Where members play + Fix next are get_admin_course_coverage(500) as
 * returned, filtered on the client. Directory figures and search are the
 * existing useCourses. Fix opens the existing course edit drawer; + Add opens
 * AddCourseSheet — both owned by the caller (ContentPage CoursesTab).
 */
import React, { useMemo, useState } from 'react';
import { adminTheme as t } from '../../theme';
import { useCourseCoverage, isPermissionError } from '../../hooks/useContentDesk';
import type { AdminCourseRow } from '../../hooks/useCourses';
import { desk, SECTION, LIST_SECTION, H, H_RIGHT, FIG_LABEL, MORE, DOT, chip } from './deskTokens';

/** coverage{} keys → bar labels. */
const COVERAGE_LABEL: Record<string, string> = {
  photo: 'Photo', tee: 'Tee data', scorecards: 'Scorecards', location: 'Location', description: 'Description',
};
/** Gap filter chips, in the mock's order. Keys match fix_next[].gaps. */
export const GAP_CHIPS: { key: string | null; label: string }[] = [
  { key: null, label: 'All gaps' },
  { key: 'location', label: 'Location' },
  { key: 'description', label: 'Description' },
  { key: 'tee', label: 'Tee data' },
  { key: 'photo', label: 'Photo' },
];
const GAP_LABEL: Record<string, string> = { location: 'Location', description: 'Description', tee: 'Tee data', photo: 'Photo' };

export function coverageColour(pct: number): string {
  if (pct >= 80) return t.ink;
  if (pct >= 50) return t.warnText;
  return t.dangerText;
}

interface FixRow { id: string; name: string; rounds: number; views: number; gaps: string[] }

const n = (v: number | null | undefined) => (v == null ? '-' : v.toLocaleString('en-GB'));

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

  const fix: FixRow[] = useMemo(() => {
    const all = (d?.fix_next ?? []) as FixRow[];
    return gap ? all.filter((r) => (r.gaps ?? []).includes(gap)) : all;
  }, [d, gap]);
  const visible = fix.slice(0, shown);
  const more = fix.length - visible.length;

  const denied = q.isError && isPermissionError(q.error);
  const total = stats.total;
  const locatedPct = total > 0 ? Math.round((stats.geocoded / total) * 100) : 0;
  const withPhoto = Math.max(0, total - stats.missingPhoto);
  const term = search.trim();

  return (
    <>
      <section style={SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={H}>Where members play</span>
          <span style={H_RIGHT}><span style={{ color: t.ink, fontWeight: 700 }}>{n(d?.courses_played)}</span> courses with rounds</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11.5, color: t.inkMuted }}>How complete the courses members actually use are</div>
        {denied ? (
          <div style={{ marginTop: 12, fontSize: 12, color: t.inkFaint }}>Full admins only</div>
        ) : (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {bars.map((b) => {
              const c = coverageColour(b.value);
              return (
                <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr) 40px', columnGap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{b.label}</span>
                  <span style={{ height: 10, borderRadius: 3, background: desk.trackBg }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(0, Math.min(100, b.value))}%`, borderRadius: 3, background: c }} />
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, textAlign: 'right', color: c }}>{b.value}%</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.hairline}`, fontSize: 11, color: t.inkFaint }}>
          Scorecards: share of member rounds that arrived with hole-by-hole detail.
        </div>
      </section>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {GAP_CHIPS.map((g) => {
          const on = g.key === gap;
          return (
            <button key={g.label} type="button" aria-pressed={on} onClick={() => { setGap(g.key); setShown(6); }} style={{
              flex: 'none', height: 34, padding: '0 14px', borderRadius: 999, border: 0, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: on ? t.ink : t.surface, color: on ? t.canvas : t.ink,
            }}>{g.label}</button>
          );
        })}
      </div>

      <section style={LIST_SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 10px' }}>
          <span style={H}>Fix next</span>
          <span style={H_RIGHT}>rounds{DOT}views 30d</span>
        </div>
        {!q.isLoading && !denied && visible.length === 0 && (
          <div style={{ padding: '11px 16px 12px', borderTop: `1px solid ${t.hairline}`, fontSize: 12, color: t.inkFaint }}>Nothing to fix here</div>
        )}
        {visible.map((r) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center', padding: '11px 16px', borderTop: `1px solid ${t.hairline}` }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: t.inkFaint }}>{n(r.rounds)} rounds{DOT}{n(r.views)} views</span>
              <span style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(r.gaps ?? []).map((g) => (
                  <span key={g} style={{ ...chip('danger'), fontSize: 10.5, padding: '2px 7px' }}>{GAP_LABEL[g] ?? g}</span>
                ))}
              </span>
            </span>
            <button type="button" onClick={() => onFix(r.id)} style={OUTLINE_30}>Fix</button>
          </div>
        ))}
        {more > 0 && (
          <button type="button" onClick={() => setShown((s) => s + 20)} style={MORE}>{more.toLocaleString('en-GB')} more with gaps</button>
        )}
      </section>

      <section style={SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={H}>Directory</span>
          <span style={H_RIGHT}><span style={{ color: t.ink, fontWeight: 700 }}>{n(total)}</span> courses</span>
        </div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          <div><div style={FIG_LABEL}>Located</div><div style={FIG_18}>{n(stats.geocoded)} <span style={{ fontSize: 11, fontWeight: 700, color: t.inkMuted }}>{locatedPct}%</span></div></div>
          <div><div style={FIG_LABEL}>Photo</div><div style={FIG_18}>{n(withPhoto)}</div></div>
          <div><div style={FIG_LABEL}>Top 100</div><div style={FIG_18}>{n(stats.top100)}</div></div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 14px', borderRadius: 12, background: t.neutralSoft }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke={t.inkFaint} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3.5 3.5" /></svg>
            <input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={`Search ${n(total)} courses`}
              style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', color: t.ink, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </label>
          <button type="button" onClick={onAdd} style={{ height: 44, padding: '0 14px', borderRadius: 12, border: 0, background: t.ink, color: t.canvas, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Add</button>
        </div>
        {!term ? (
          <div style={{ marginTop: 12, fontSize: 11, color: t.inkFaint }}>The full A to Z list opens from search, so the page leads with what members use.</div>
        ) : (
          <div style={{ marginTop: 12, marginLeft: -16, marginRight: -16 }}>
            {searching && results.length === 0 ? (
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.hairline}`, fontSize: 12, color: t.inkFaint }}>Searching</div>
            ) : results.length === 0 ? (
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.hairline}`, fontSize: 12, color: t.inkFaint }}>No courses for &ldquo;{term}&rdquo;</div>
            ) : results.map((c) => (
              <button key={c.id} type="button" onClick={() => onFix(c.id)} style={RESULT_ROW}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: t.inkFaint }}>{[c.region ?? c.sub_country, c.country].filter(Boolean).join(', ')}</span>
                </span>
                <span aria-hidden="true" style={{ color: t.inkFaint, fontSize: 16 }}>&rsaquo;</span>
              </button>
            ))}
            {resultsTotal > pageSize && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 0', borderTop: `1px solid ${t.hairline}` }}>
                <span style={{ fontSize: 11, color: t.inkFaint }}>{n((page - 1) * pageSize + 1)}-{n(Math.min(page * pageSize, resultsTotal))} of {n(resultsTotal)}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} style={{ ...OUTLINE_30, opacity: page <= 1 ? 0.4 : 1 }}>Prev</button>
                  <button type="button" disabled={page * pageSize >= resultsTotal} onClick={() => onPage(page + 1)} style={{ ...OUTLINE_30, opacity: page * pageSize >= resultsTotal ? 0.4 : 1 }}>Next</button>
                </span>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}

const FIG_18: React.CSSProperties = { marginTop: 2, fontSize: 18, fontWeight: 800, color: '' as string };
FIG_18.color = t.ink;
const OUTLINE_30: React.CSSProperties = { height: 30, padding: '0 12px', borderRadius: 999, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' };
const RESULT_ROW: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center', width: '100%',
  padding: '11px 16px', textAlign: 'left', background: 'transparent', border: 0, borderTop: `1px solid ${t.hairline}`, cursor: 'pointer', font: 'inherit',
};
