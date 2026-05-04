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
  'trigram_medium',
  'no_match_found',
  'trigram_high',
  'normalised_name',
  'exact_name',
  'marker_aware',
  'manual',
];

export default function WhsCourseBridgeReviewPage() {
  // toast imported from sonner
  const [filter, setFilter] = useState('unreviewed');
  const [rows, setRows] = useState<BridgeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchById, setSearchById] = useState<Record<string, string>>({});
  const [resultsById, setResultsById] = useState<Record<string, GolfSearchResult[]>>({});
  const [stats, setStats] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from('whs_to_golf_course_map')
      .select(
        'whs_course_id, golf_course_id, match_confidence, match_method, matched_at, reviewed_at, whs_courses!inner(name,country_name), golf_courses(name,country,sub_country)',
      )
      .order('match_confidence', { ascending: true })
      .limit(200);

    if (filter === 'unreviewed') query = query.is('reviewed_at', null);
    else if (filter !== 'all') query = query.eq('match_method', filter);

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load', { description: error.message });
    } else {
      setRows((data ?? []) as unknown as BridgeRow[]);
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

  const confirmCurrent = async (row: BridgeRow) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    const { error } = await supabase
      .from('whs_to_golf_course_map')
      .update({ reviewed_at: new Date().toISOString(), reviewed_by: userId })
      .eq('whs_course_id', row.whs_course_id);
    if (error) toast.error('Failed', { description: error.message });
    else { toast('Confirmed'); load(); }
  };

  const overrideMatch = async (row: BridgeRow, golfCourseId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    const { error } = await supabase
      .from('whs_to_golf_course_map')
      .update({
        golf_course_id: golfCourseId,
        match_method: 'manual',
        match_confidence: 1.0,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq('whs_course_id', row.whs_course_id);
    if (error) toast.error('Failed', { description: error.message });
    else { toast('Overridden'); load(); }
  };

  const totalRows = useMemo(
    () => Object.values(stats).reduce((a, b) => a + b, 0),
    [stats],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">WHS Course Bridge Review</h1>
          <p className="text-sm text-muted-foreground">
            Review and override matches between England Golf WHS courses and Clbhouz golf courses.
          </p>
        </div>
        <Button onClick={runBackfill}>Run backfill (500 rows)</Button>
      </div>

      <div className="flex gap-2 flex-wrap text-xs">
        {Object.entries(stats).map(([k, v]) => (
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
          </Button>
        ))}
      </div>

      {loading && <div>Loading…</div>}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.whs_course_id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <div className="font-semibold">{row.whs_courses?.name ?? '(missing)'}</div>
                <div className="text-xs text-muted-foreground">
                  WHS · {row.whs_courses?.country_name ?? 'unknown'}
                </div>
              </div>
              <div className="flex gap-2 items-center text-xs">
                <Badge variant="secondary">{row.match_method}</Badge>
                <Badge variant="outline">conf {row.match_confidence.toFixed(2)}</Badge>
                {row.reviewed_at && <Badge variant="default">reviewed</Badge>}
              </div>
            </div>

            <div className="text-sm">
              <span className="text-muted-foreground">Current match: </span>
              {row.golf_courses ? (
                <span>
                  <strong>{row.golf_courses.name}</strong> · {row.golf_courses.sub_country ?? row.golf_courses.country ?? '—'}
                </span>
              ) : (
                <span className="text-destructive">none</span>
              )}
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {row.golf_course_id && !row.reviewed_at && (
                <Button size="sm" variant="default" onClick={() => confirmCurrent(row)}>
                  Confirm
                </Button>
              )}
              <Input
                placeholder="Search golf_courses…"
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
        ))}
        {!loading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No rows for this filter.</div>
        )}
      </div>
    </div>
  );
}
