/**
 * BRIEF_CLUB_REQUEST_ANOTHER_COURSE §3 — a club reports a CATALOGUE gap: a
 * course of its club that clbhouz is missing. This extends the course_requests
 * queue through the existing `request-course` function. It is NOT a claim and
 * never touches course_claim_requests. It searches nothing.
 */
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { courseNameWithinClub } from '@/features/courses/_shared/courseLabel';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';
import { toast } from '@/lib/toast';
import { BIZ } from './businessTokens';

interface Props {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  clubId: string;
  clubName: string;
  existingCourses: { course_id: string; course_name: string }[];
}

interface CandidateRow {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_image: string | null;
  club_id: string | null;
}

const KICKER_STYLE = { color: BIZ.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', margin: '16px 0 6px' } as const;
const TEXT_BTN_STYLE = { alignSelf: 'flex-start', border: 'none', background: 'transparent', padding: 0, fontSize: 12.5, fontWeight: 600, color: BIZ.inkMute, cursor: 'pointer', textAlign: 'left' } as const;

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => { const h = setTimeout(() => setV(value), ms); return () => clearTimeout(h); }, [value, ms]);
  return v;
}

async function fetchCandidates(term: string): Promise<CandidateRow[]> {
  const { data, error } = await supabase
    .from('golf_courses')
    .select('id, name, country, sub_country, thumbnail_image, club_id')
    .ilike('name', `%${term}%`)
    .order('name')
    .limit(20);
  if (error) throw error;
  return (data ?? []) as CandidateRow[];
}

const LABEL_STYLE = { color: BIZ.inkMute, fontSize: 12.5, fontWeight: 600, marginBottom: 6, display: 'block' } as const;
const FIELD_CLASS = `${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS} w-full px-4 py-3 text-[15px] focus:outline-none`;

export function RequestAnotherCourseSheet({
  open, onClose, businessId, clubId, clubName, existingCourses,
}: Props) {
  const [mode, setMode] = useState<'pick' | 'request'>('pick');
  const [query, setQuery] = useState('');
  const [pickingId, setPickingId] = useState<string | null>(null);
  const debouncedQ = useDebounced(query.trim(), 250);
  const existingIds = useMemo(() => new Set(existingCourses.map((c) => c.course_id)), [existingCourses]);
  const existingCourseNames = useMemo(
    () => existingCourses.flatMap((c) => [c.course_name, courseNameWithinClub(c.course_name)]),
    [existingCourses],
  );
  const stem = existingCourses.length > 0
    ? existingCourses[0].course_name.replace(/\s*\([^()]*\)\s*$/, '').trim()
    : clubName.trim();
  const searching = debouncedQ.length >= 2;
  const seedQ = useQuery({
    queryKey: ['club-course-candidates', clubId, stem],
    queryFn: () => fetchCandidates(stem),
    staleTime: 60_000,
    enabled: open && mode === 'pick' && stem.length >= 4,
  });
  const searchQ = useQuery({
    queryKey: ['club-course-candidates', clubId, 'q', debouncedQ],
    queryFn: () => fetchCandidates(debouncedQ),
    staleTime: 60_000,
    enabled: open && mode === 'pick' && searching,
  });
  const rows: CandidateRow[] = (searching ? searchQ.data : seedQ.data) ?? [];
  const rowIds = rows.map((r) => r.id);
  // One batched availability read per result page — never per row.
  const pendingQ = useQuery({
    queryKey: ['club-course-pending', businessId, rowIds.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_requests')
        .select('for_course_id')
        .eq('for_business_id', businessId)
        .eq('status', 'pending')
        .in('for_course_id', rowIds);
      if (error) throw error;
      return new Set(((data ?? []) as { for_course_id: string | null }[]).map((r) => r.for_course_id).filter(Boolean) as string[]);
    },
    enabled: open && mode === 'pick' && rowIds.length > 0,
    staleTime: 0,
  });
  const verdict = (r: CandidateRow): string | null => {
    if (existingIds.has(r.id)) return 'Already yours';
    if (r.club_id && r.club_id !== clubId) return 'Belongs to another club';
    if (pendingQ.data?.has(r.id)) return 'Requested';
    return null;
  };
  const seedHasSelectable = (seedQ.data ?? []).some((r) => verdict(r) === null);
  const showList = searching ? rows.length > 0 : seedHasSelectable;
  const queryClient = useQueryClient();
  const [courseName, setCourseName] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMode('pick');
      setQuery('');
      setPickingId(null);
      setCourseName('');
      setLocation('');
      setNote('');
      setInlineError(null);
    }
  }, [open]);

  const name = courseName.trim();
  const loc = location.trim();
  const canSubmit = name.length > 0 && loc.length > 0 && !submitting;

  const reportError = async (error: any) => {
      let raw = '';
    let status: number | undefined;
    if (error instanceof FunctionsHttpError) {
      status = (error.context as Response | undefined)?.status;
      try {
        const body = await error.context.json();
        raw = body?.error ?? body?.message ?? '';
      } catch {
        /* keep fallback */
      }
    } else if (error.message) {
      raw = error.message;
    }
    const m = String(raw).toLowerCase();
    if (status === 403 || m.includes('not authorized') || m.includes('cannot request')) {
      toast.error('You need to be an owner or admin of this business.');
    } else {
      toast.error("Couldn't send your request. Please try again.");
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    // Commonest mistake — caught without a server round trip.
    const lower = name.toLowerCase();
    if (existingCourseNames.some((n) => n.trim().toLowerCase() === lower)) {
      setInlineError('That course is already on your club.');
      return;
    }
    setInlineError(null);
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('request-course', {
      body: {
        course_name: name,
        location: loc,
        note: note.trim() || null,
        for_business_id: businessId,
        for_club_id: clubId,
      },
    });
    setSubmitting(false);

    if (error) {
      await reportError(error);
      return;
    }

    if (data?.duplicate) {
      toast.info(data?.message ?? 'You have already asked us for that course — we are on it.');
    } else {
      toast.success('Request sent — we will add it to your club and let you know.');
    }
    queryClient.invalidateQueries({ queryKey: ['club-course-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
    onClose();
  };

  const pickCourse = async (row: CandidateRow) => {
    if (pickingId) return;
    setPickingId(row.id);
    const { data, error } = await supabase.functions.invoke('request-course', {
      body: {
        course_name: row.name,
        location: row.sub_country || row.country || 'Unknown',
        note: null,
        for_business_id: businessId,
        for_club_id: clubId,
        for_course_id: row.id,
      },
    });
    setPickingId(null);
    if (error) {
      await reportError(error);
      return;
    }
    if (data?.duplicate) {
      toast.info(data?.message ?? 'You have already asked us for that course — we are on it.');
    } else {
      toast.success(`Request sent — we will attach ${row.name} to your club and let you know.`);
    }
    queryClient.invalidateQueries({ queryKey: ['club-course-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} scrollBody ariaLabelledBy="request-another-course-title">
      <div style={{ padding: '20px 20px 28px' }}>
        <h2 id="request-another-course-title" style={{ color: BIZ.ink, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          Request another course
        </h2>
        <p style={{ color: BIZ.inkMute, fontSize: 12.5, lineHeight: 1.45, marginBottom: 16 }}>
          This course will be added to {clubName}.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="rac-name" style={LABEL_STYLE}>Course name</label>
            <input
              id="rac-name"
              type="text"
              value={courseName}
              maxLength={200}
              onChange={(e) => { setCourseName(e.target.value); setInlineError(null); }}
              placeholder="e.g. International"
              className={FIELD_CLASS}
              style={{ color: BIZ.ink }}
            />
            {inlineError && (
              <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 12.5, marginTop: 6 }}>
                {inlineError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="rac-loc" style={LABEL_STYLE}>Where it is</label>
            <input
              id="rac-loc"
              type="text"
              value={location}
              maxLength={300}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Town or county"
              className={FIELD_CLASS}
              style={{ color: BIZ.ink }}
            />
          </div>
          <div>
            <label htmlFor="rac-note" style={LABEL_STYLE}>Anything we should know</label>
            <textarea
              id="rac-note"
              value={note}
              maxLength={500}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tees, opening date, anything that helps us add it correctly."
              className={`${FIELD_CLASS} resize-none`}
              style={{ color: BIZ.ink }}
            />
          </div>
        </div>

        <Button className="w-full mt-5" disabled={!canSubmit} onClick={submit}>
          {submitting ? 'Sending…' : 'Send request'}
        </Button>
      </div>
    </BottomSheet>
  );
}

export default RequestAnotherCourseSheet;
