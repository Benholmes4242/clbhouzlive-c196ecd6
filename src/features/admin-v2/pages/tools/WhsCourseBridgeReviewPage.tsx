import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface BridgeRow {
  whs_course_id: string;
  golf_course_id: string | null;
  match_confidence: number;
  match_method: string;
  matched_at: string;
  reviewed_at: string | null;
  echo_reasoning: string | null;
  echo_attempted_at: string | null;
  echo_agreement_count: number | null;
  echo_suggested_golf_course_id: string | null;
  whs_courses: { name: string; country_name: string | null } | null;
  golf_courses: { name: string; country: string | null; sub_country: string | null } | null;
}

interface GolfSearchResult {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
}

const METHOD_FILTERS = [
  'all',
  'unreviewed',
  'echo_review',
  'create_new_course_suggested',
  'echo_consensus',
  'echo_consensus_majority',
  'echo_review_confirmed',
  'echo_review_override',
  'echo_review_rejected',
  'echo_no_match',
  'trigram_medium',
  'no_match_found',
  'trigram_high',
  'normalised_name',
  'exact_name',
  'marker_aware',
  'manual',
];

const ECHO_METHODS = new Set([
  'echo_review',
  'echo_consensus',
  'echo_consensus_majority',
  'echo_review_confirmed',
  'echo_review_override',
  'echo_review_rejected',
  'echo_no_match',
  'create_new_course_suggested',
]);

export default function WhsCourseBridgeReviewPage() {
  const [filter, setFilter] = useState('echo_review');
  const [rows, setRows] = useState<BridgeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchById, setSearchById] = useState<Record<string, string>>({});
  const [resultsById, setResultsById] = useState<Record<string, GolfSearchResult[]>>({});
  const [stats, setStats] = useState<Record<string, number>>({});
  const [suggestedById, setSuggestedById] = useState<Record<string, GolfSearchResult>>({});
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from('whs_to_golf_course_map')
      .select(
        'whs_course_id, golf_course_id, match_confidence, match_method, matched_at, reviewed_at, echo_reasoning, echo_attempted_at, echo_agreement_count, echo_suggested_golf_course_id, whs_courses!inner(name,country_name), golf_courses(name,country,sub_country)',
      )
      .order('echo_attempted_at', { ascending: false, nullsFirst: false })
      .order('match_confidence', { ascending: true })
      .limit(200);

    if (filter === 'unreviewed') query = query.is('reviewed_at', null);
    else if (filter !== 'all') query = query.eq('match_method', filter);

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load', { description: error.message });
      setRows([]);
    } else {
      const list = (data ?? []) as unknown as BridgeRow[];
      setRows(list);

      // Hydrate suggested course names for echo_review / create_new_course_suggested rows
      const suggestedIds = Array.from(
        new Set(
          list
            .map((r) => r.echo_suggested_golf_course_id)
            .filter((v): v is string => !!v),
        ),
      );
      if (suggestedIds.length > 0) {
        const { data: courses } = await supabase
          .from('golf_courses')
          .select('id, name, country, sub_country')
          .in('id', suggestedIds);
        const map: Record<string, GolfSearchResult> = {};
        for (const c of (courses ?? []) as GolfSearchResult[]) map[c.id] = c;
        setSuggestedById((prev) => ({ ...prev, ...map }));
      }
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from('whs_to_golf_course_map')
      .select('match_method')
      .limit(50000);
    const counts: Record<string, number> = {};
    for (const r of data ?? []) {
      const m = (r as any).match_method as string;
      counts[m] = (counts[m] ?? 0) + 1;
    }
    setStats(counts);
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { loadStats(); }, []);

  const runBackfill = async () => {
    toast('Running backfill…');
    const { data, error } = await supabase.functions.invoke('backfill-whs-course-mapping', {
      body: { mode: 'bulk' },
    });
    if (error) toast.error('Backfill failed', { description: error.message });
    else toast('Backfill done', { description: JSON.stringify(data).slice(0, 200) });
    loadStats();
    load();
  };

  const searchCourses = async (whsId: string, q: string) => {
    setSearchById((s) => ({ ...s, [whsId]: q }));
    if (!q || q.length < 2) {
      setResultsById((r) => ({ ...r, [whsId]: [] }));
      return;
    }
    const { data } = await supabase
      .from('golf_courses')
      .select('id, name, country, sub_country')
      .ilike('name', `%${q}%`)
      .limit(10);
    setResultsById((r) => ({ ...r, [whsId]: (data ?? []) as GolfSearchResult[] }));
  };

  const writeReview = async (
    row: BridgeRow,
    patch: Record<string, unknown>,
    successMsg: string,
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    const { error } = await supabase
      .from('whs_to_golf_course_map')
      .update({
        ...patch,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq('whs_course_id', row.whs_course_id);
    if (error) toast.error('Failed', { description: error.message });
    else {
      toast(successMsg);
      load();
      loadStats();
    }
  };

  // ── Phase 1b actions ──────────────────────────────────────────────
  const confirmEchoSuggestion = (row: BridgeRow) => {
    if (!row.echo_suggested_golf_course_id) {
      toast.error('No Echo suggestion to confirm');
      return;
    }
    writeReview(
      row,
      {
        golf_course_id: row.echo_suggested_golf_course_id,
        match_method: 'echo_review_confirmed',
        match_confidence: 1.0,
      },
      'Echo match confirmed',
    );
  };

  const overrideWithDifferent = (row: BridgeRow, golfCourseId: string) => {
    writeReview(
      row,
      {
        golf_course_id: golfCourseId,
        match_method: 'echo_review_override',
        match_confidence: 1.0,
      },
      'Overridden with different course',
    );
  };

  const rejectEcho = (row: BridgeRow) => {
    writeReview(
      row,
      {
        golf_course_id: null,
        match_method: 'echo_review_rejected',
      },
      'Echo suggestion rejected',
    );
  };

  // ── Legacy non-Echo actions (preserved) ───────────────────────────
  const confirmCurrent = (row: BridgeRow) =>
    writeReview(row, {}, 'Confirmed');

  const overrideMatch = (row: BridgeRow, golfCourseId: string) => {
    const isEchoRow = ECHO_METHODS.has(row.match_method);
    if (isEchoRow) return overrideWithDifferent(row, golfCourseId);
    writeReview(
      row,
      {
        golf_course_id: golfCourseId,
        match_method: 'manual',
        match_confidence: 1.0,
      },
      'Overridden',
    );
  };

  const totalRows = useMemo(
    () => Object.values(stats).reduce((a, b) => a + b, 0),
    [stats],
  );

  // ── Telemetry counts ──────────────────────────────────────────────
  const unreviewedEchoReview = stats['echo_review'] ?? 0;
  const unreviewedCreateNew = stats['create_new_course_suggested'] ?? 0;
  const consensusMajority = stats['echo_consensus_majority'] ?? 0;
  const confirmedCount = stats['echo_review_confirmed'] ?? 0;
  const overrideCount = stats['echo_review_override'] ?? 0;
  const rejectedCount = stats['echo_review_rejected'] ?? 0;
  const reviewActionTotal = confirmedCount + overrideCount + rejectedCount;
  const confirmRatio =
    reviewActionTotal > 0
      ? `${Math.round((confirmedCount / reviewActionTotal) * 100)}%`
      : '—';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">WHS Course Bridge Review</h1>
          <p className="text-sm text-muted-foreground">
            Review and override matches between WHS courses and Clbhouz golf courses.
          </p>
        </div>
        <Button onClick={runBackfill}>Run backfill (500 rows)</Button>
      </div>

      {/* Echo telemetry pane */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <TelemetryStat label="Awaiting review" value={unreviewedEchoReview} tone="warn" />
        <TelemetryStat label="Suggest create-new" value={unreviewedCreateNew} tone="warn" />
        <TelemetryStat label="Rule B (majority)" value={consensusMajority} />
        <TelemetryStat label="Confirm ratio" value={confirmRatio} />
        <TelemetryStat
          label="Confirmed / Override / Reject"
          value={`${confirmedCount} / ${overrideCount} / ${rejectedCount}`}
        />
      </div>

      <div className="flex gap-2 flex-wrap text-xs">
        {Object.entries(stats)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => (
            <Badge key={k} variant="outline">{k}: {v}</Badge>
          ))}
        <Badge>Total: {totalRows}</Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        {METHOD_FILTERS.map((m) => (
          <Button
            key={m}
            size="sm"
            variant={filter === m ? 'default' : 'outline'}
            onClick={() => setFilter(m)}
          >
            {m}
            {stats[m] != null && <span className="ml-1.5 opacity-60">({stats[m]})</span>}
          </Button>
        ))}
      </div>

      {loading && <div>Loading…</div>}

      <div className="space-y-3">
        {rows.map((row) => {
          const isEchoReview = row.match_method === 'echo_review';
          const isCreateNew = row.match_method === 'create_new_course_suggested';
          const suggested = row.echo_suggested_golf_course_id
            ? suggestedById[row.echo_suggested_golf_course_id]
            : undefined;
          const reasoningOpen = !!expandedReasoning[row.whs_course_id];

          return (
            <div key={row.whs_course_id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <div className="font-semibold">{row.whs_courses?.name ?? '(missing)'}</div>
                  <div className="text-xs text-muted-foreground">
                    WHS · {row.whs_courses?.country_name ?? 'unknown'}
                  </div>
                </div>
                <div className="flex gap-2 items-center text-xs flex-wrap">
                  <Badge variant="secondary">{row.match_method}</Badge>
                  <Badge variant="outline">conf {row.match_confidence?.toFixed?.(2) ?? '—'}</Badge>
                  {row.echo_agreement_count != null && (
                    <Badge variant="outline">{row.echo_agreement_count}/3 LLMs</Badge>
                  )}
                  {row.reviewed_at && <Badge variant="default">reviewed</Badge>}
                </div>
              </div>

              {/* Current match (applied) */}
              <div className="text-sm">
                <span className="text-muted-foreground">Current match: </span>
                {row.golf_courses ? (
                  <span>
                    <strong>{row.golf_courses.name}</strong>{' '}
                    · {row.golf_courses.sub_country ?? row.golf_courses.country ?? '—'}
                  </span>
                ) : (
                  <span className="text-destructive">none</span>
                )}
              </div>

              {/* Echo suggestion (for echo_review / create_new) */}
              {(isEchoReview || isCreateNew) && (
                <div className="text-sm rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2">
                  <span className="text-muted-foreground">Echo suggests: </span>
                  {isCreateNew ? (
                    <strong>Create a new golf_courses row</strong>
                  ) : suggested ? (
                    <span>
                      <strong>{suggested.name}</strong>{' '}
                      · {suggested.sub_country ?? suggested.country ?? '—'}
                    </span>
                  ) : row.echo_suggested_golf_course_id ? (
                    <span className="text-muted-foreground">loading…</span>
                  ) : (
                    <span className="text-muted-foreground">no specific candidate</span>
                  )}
                </div>
              )}

              {/* Echo reasoning */}
              {row.echo_reasoning && (
                <div>
                  <button
                    className="text-xs text-muted-foreground underline"
                    onClick={() =>
                      setExpandedReasoning((s) => ({
                        ...s,
                        [row.whs_course_id]: !reasoningOpen,
                      }))
                    }
                  >
                    {reasoningOpen ? 'Hide' : 'Show'} Echo reasoning
                  </button>
                  {reasoningOpen && (
                    <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded max-h-64 overflow-auto">
                      {row.echo_reasoning}
                    </pre>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 items-center flex-wrap">
                {isEchoReview && !row.reviewed_at && row.echo_suggested_golf_course_id && (
                  <Button size="sm" onClick={() => confirmEchoSuggestion(row)}>
                    Confirm Echo's match
                  </Button>
                )}
                {isCreateNew && !row.reviewed_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    title="Create-new workflow lands in Phase 4"
                  >
                    Create new course (Phase 4)
                  </Button>
                )}
                {!isEchoReview && !isCreateNew && row.golf_course_id && !row.reviewed_at && (
                  <Button size="sm" variant="default" onClick={() => confirmCurrent(row)}>
                    Confirm
                  </Button>
                )}
                {(isEchoReview || isCreateNew) && !row.reviewed_at && (
                  <Button size="sm" variant="destructive" onClick={() => rejectEcho(row)}>
                    Reject
                  </Button>
                )}
                <Input
                  placeholder={
                    isEchoReview
                      ? 'Pick different course — search…'
                      : 'Search golf_courses…'
                  }
                  className="max-w-md"
                  value={searchById[row.whs_course_id] ?? ''}
                  onChange={(e) => searchCourses(row.whs_course_id, e.target.value)}
                />
              </div>

              {(resultsById[row.whs_course_id] ?? []).length > 0 && (
                <div className="border rounded p-2 space-y-1 bg-muted/30">
                  {resultsById[row.whs_course_id].map((c) => (
                    <div key={c.id} className="flex justify-between items-center text-sm">
                      <div>
                        <strong>{c.name}</strong>{' '}
                        <span className="text-muted-foreground">
                          · {c.sub_country ?? c.country ?? '—'}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => overrideMatch(row, c.id)}>
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!loading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No rows for this filter.</div>
        )}
      </div>
    </div>
  );
}

function TelemetryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'warn';
}) {
  return (
    <div
      className={
        'rounded-lg border p-3 ' +
        (tone === 'warn'
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
          : 'bg-muted/30')
      }
    >
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
