import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatAgo } from '../lib/formatAgo';
import { matchKey, nameTokens, isDupName, wordsMatch } from '../lib/tourDataDisplay';
import { toast } from '@/lib/toast';
import {
  Plus, Search, RefreshCw, Image as ImageIcon,
  Trash2, Upload, Loader2, Zap,
  CheckCircle2, ChevronRight,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';

import { KICKER, LABEL } from '@/lib/tokens/type';
import { adminTheme as t } from '../theme';
import ContentSegments, { type ContentSection } from '../components/content/ContentSegments';
import NewsroomSection from '../components/content/NewsroomSection';
import CoursesSection from '../components/content/CoursesSection';
import TourDataSection from '../components/content/TourDataSection';
import StatTile from '../components/StatTile';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import DetailDrawer from '../components/DetailDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import AdminSheet from '../components/AdminSheet';
import CourseInsight from '../components/CourseInsight';
import AdminAccessDenied from '../components/AdminAccessDenied';
import CourseClubControl from '../components/CourseClubControl';
import AddCourseSheet from '../components/AddCourseSheet';
import { Section, Field, TextInput, SelectInput, Toggle, DraftRestoredBar } from '../components/CourseFormFields';
import { COURSE_TYPES } from '../constants';
import { CourseGeographySelectors } from '../components/CourseGeographySelectors';
import { isCanonicalCountry, trimOrNull } from '../lib/geography';
import { useCourses, type AdminCourseRow, type CourseFilter } from '../hooks/useCourses';
import { saveDraft, loadDraft, clearDraft, draftKeys, draftsEqual } from '../lib/sheetDrafts';
import HelpArticlesTab from '../components/HelpArticlesTab';
import LegalDocumentsTab from '../components/LegalDocumentsTab';

/**
 * BRIEF_CONTENT_DESK — four sections held in ?section=. Old ?tab= links map:
 * wire/amateur→newsroom, courses→courses, tour/players→tour, help/legal→pages.
 */
const LEGACY_TAB: Record<string, ContentSection> = {
  wire: 'newsroom', amateur: 'newsroom', courses: 'courses', tour: 'tour', players: 'tour', help: 'pages', legal: 'pages',
};

export default function ContentPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const [params, setParams] = useSearchParams();

  const visible = useMemo(() => {
    const v: ContentSection[] = [];
    if (can.manageAdmins) v.push('newsroom');
    v.push('courses');
    if (can.manageAdmins) v.push('tour');
    if (can.viewModeration) v.push('pages');
    return v;
  }, [can.manageAdmins, can.viewModeration]);

  const raw = params.get('section') ?? LEGACY_TAB[params.get('tab') ?? ''] ?? null;
  const section: ContentSection = raw && visible.includes(raw as ContentSection) ? (raw as ContentSection) : visible[0];

  const setSection = (id: ContentSection) => {
    const next = new URLSearchParams(params);
    next.delete('tab');
    next.set('section', id);
    setParams(next, { replace: true });
  };

  return (
    <div style={{ padding: '8px 12px 24px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 1180, margin: '0 auto', fontVariantNumeric: 'tabular-nums' }}>
      <ContentSegments sections={visible} active={section} onChange={setSection} />
      {section === 'newsroom' && <NewsroomSection />}
      {section === 'courses' && <CoursesTab />}
      {section === 'tour' && <TourSection />}
      {section === 'pages' && (<><HelpArticlesTab /><LegalDocumentsTab /></>)}
    </div>
  );
}

/* ───────────────────────── Courses tab ───────────────────────── */

const LABEL_T = { ...LABEL, fontFeatureSettings: '"kern" 1, "liga" 1' } as const;
const FIG_T = { fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums' } as const;

/** The active view's name. Names a view, never a sort order. */
const VIEW_LABEL: Record<CourseFilter, string> = {
  all: 'A to Z',
  top100: 'Ranked courses',
  missing_coords: 'Missing coordinates',
  missing_photo: 'Missing photo',
};

/**
 * Tone an issue by RARITY. An issue affecting most of the directory is a fact
 * about the directory, not an exception, so it drops to faint ink. The tone
 * follows the data: a directory at 20% missing gets its amber back.
 */
const issueTone = (affected: number, total: number) =>
  total > 0 && affected / total > 0.5 ? t.inkFaint : t.warnText;

function isCourseFilter(v: string | null): v is CourseFilter {
  return v === 'all' || v === 'top100' || v === 'missing_coords' || v === 'missing_photo';
}

function firstRank(course: AdminCourseRow): number | null {
  return course.global_rank ?? course.usa_rank ?? course.regional_rank ?? course.country_rank ?? null;
}

function isTop100(course: AdminCourseRow): boolean {
  return firstRank(course) != null;
}

function CoursesTab() {
  const c = useCourses();
  const [params, setParams] = useSearchParams();

  // Hydrate hook from URL (?q= and ?filter=) on mount and when URL changes.
  const urlQ = params.get('q') ?? '';
  const urlFilter = params.get('filter');
  const initialFilter: CourseFilter = isCourseFilter(urlFilter) ? urlFilter : 'all';

  const [searchInput, setSearchInput] = useState(urlQ);
  const debounced = useDebouncedValue(searchInput, 250);

  useEffect(() => { c.setSearch(debounced); /* eslint-disable-next-line */ }, [debounced]);
  // Stage 3: the directory search is A to Z only; no filter is visible, so none applies.
  useEffect(() => { c.setFilter('all'); /* eslint-disable-next-line */ }, []);

  // Reflect state back into URL.
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debounced.trim()) next.set('q', debounced.trim()); else next.delete('q');
    if (c.filter !== 'all') next.set('filter', c.filter); else next.delete('filter');
    // preserve tab param if present
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, c.filter]);

  useEffect(() => {
    const h = () => c.refetch();
    window.addEventListener('admin-v2:refetch', h);
    return () => window.removeEventListener('admin-v2:refetch', h);
  }, [c]);

  // Sheet state lives in the URL so app-switch reloads restore it.
  const drawerId = params.get('course');
  const addOpen = params.get('add') === 'course';

  const setSheetParam = (mutate: (p: URLSearchParams) => void, opening: boolean) => {
    const next = new URLSearchParams(params);
    const hadSheet = !!next.get('course') || next.get('add') === 'course';
    mutate(next);
    // push on the initial open (so back-swipe closes the sheet), replace otherwise.
    setParams(next, { replace: !(opening && !hadSheet) });
  };
  const openCourse = (id: string) => setSheetParam(p => { p.set('course', id); p.delete('add'); }, true);
  const openAdd = () => setSheetParam(p => { p.set('add', 'course'); p.delete('course'); }, true);
  const closeSheet = () => setSheetParam(p => { p.delete('course'); p.delete('add'); }, false);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <CoursesSection
        stats={{ total: c.stats.total, geocoded: c.stats.geocoded, missingPhoto: c.stats.missingPhoto, top100: c.stats.top100 }}
        search={searchInput}
        onSearch={setSearchInput}
        results={debounced.trim() ? c.courses : []}
        resultsTotal={c.total}
        page={c.page}
        pageSize={c.pageSize}
        onPage={(p) => c.setPage(p)}
        searching={c.isLoading || searchInput !== debounced}
        onFix={openCourse}
        onAdd={openAdd}
      />

      <CourseDetail
        courseId={drawerId}
        onClose={closeSheet}
        update={c.updateCourse}
        uploadPhoto={c.uploadPhoto}
        uploading={c.isUploadingPhoto}
        deleteCourse={c.deleteCourse}
        deleting={c.isDeleting}
      />

      <AddCourseSheet
        open={addOpen}
        onClose={closeSheet}
        onCreated={() => { c.refetch(); }}
        uploadPhoto={c.uploadPhoto}
        onOpenExisting={(id) => { closeSheet(); openCourse(id); }}
      />


      <style>{`@keyframes admin-pulse { 0%,100%{opacity:.55} 50%{opacity:1} }`}</style>
    </div>
  );
}

function PagerBtn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={{
        padding: '6px 12px', borderRadius: t.radius.md,
        border: `1px solid ${t.line}`,
        background: rest.disabled ? t.canvas : t.surface,
        color: rest.disabled ? t.inkFaint : t.ink,
        fontSize: 12, fontWeight: 600,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
      }}
    >{children}</button>
  );
}

/* ───────── Draft-restored notice bar ───────── */




/**
 * One coverage tile. The bar is SHAPE, the figure is MAGNITUDE and the
 * percentage is PROPORTION - three views of one number, and no fourth.
 * The bar is never rescaled and has no minimum width: a nearly empty bar is
 * the true picture and the reason the panel exists.
 */
function CoverageTile({ label, value, total, active, onClick }: {
  label: string; value: number; total: number; active: boolean; onClick: () => void;
}) {
  const share = total > 0 ? value / total : 0;
  const pct = share >= 0.995 ? 100 : share > 0 && share < 0.01 ? Math.round(share * 1000) / 10 : Math.round(share * 100);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '8px 10px 10px',
        borderRadius: t.radius.lg,
        background: active ? t.neutralSoft : t.surface,
        border: `1px solid ${active ? t.line : t.hairline}`,
        cursor: 'pointer', textAlign: 'left', minWidth: 0,
      }}
    >
      <span aria-hidden style={{ height: 2.5, borderRadius: 2, width: '100%', background: t.line, overflow: 'hidden' }}>
        <span style={{
          display: 'block', height: '100%', borderRadius: 2,
          width: `${share * 100}%`, background: t.brand,
        }} />
      </span>
      <span style={{
        ...LABEL_T, color: t.inkMuted,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0 }}>
        <span style={{ ...FIG_T, fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: t.ink }}>
          {value.toLocaleString()}
        </span>
        <span style={{ ...FIG_T, fontSize: 10.5, fontWeight: 700, color: t.inkFaint }}>{pct}%</span>
      </span>
    </button>
  );
}

/**
 * One roster row. No border (the panel owns the edge), no icon tile (an
 * ornamental glyph distinguishes nothing across 23,291 rows). The rank in the
 * right rail says Top 100 better than a tinted capsule did.
 */
function CourseRow({ course, first, activeFilter, missingCoords, missingPhoto, total, onOpen }: {
  course: AdminCourseRow;
  first: boolean;
  activeFilter: CourseFilter;
  missingCoords: number;
  missingPhoto: number;
  total: number;
  onOpen: () => void;
}) {
  const rank = firstRank(course);
  // Suppress a marker that merely repeats the active filter.
  const noCoords = (course.latitude == null || course.longitude == null) && activeFilter !== 'missing_coords';
  const noPhoto = !course.thumbnail_image && activeFilter !== 'missing_photo';
  // `country` is a MACRO-REGION ("Britain & Ireland", "USA"), not a country.
  const region = [course.sub_country, course.country].filter(Boolean).join(' · ') || course.country || '';

  return (
    <button
      onClick={onOpen}
      style={{
        width: '100%', textAlign: 'left', background: 'transparent',
        border: 'none', borderTop: first ? 'none' : `1px solid ${t.hairline}`,
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 700, color: t.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{course.name}</div>
        <div style={{
          marginTop: 2, fontSize: 11.5, color: t.inkFaint,
          display: 'flex', gap: 8, alignItems: 'baseline', minWidth: 0,
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {region || '—'}
          </span>
          {noCoords && (
            <span style={{ ...LABEL_T, color: issueTone(missingCoords, total), flexShrink: 0 }}>No coords</span>
          )}
          {noPhoto && (
            <span style={{ ...LABEL_T, color: issueTone(missingPhoto, total), flexShrink: 0 }}>No photo</span>
          )}
        </div>
      </div>
      {rank != null ? (
        <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 46 }}>
          <div style={{ ...FIG_T, fontSize: 13.5, fontWeight: 700, color: t.brandText }}>#{rank}</div>
          <div style={{ ...LABEL_T, color: t.inkFaint, marginTop: 1 }}>Top 100</div>
        </div>
      ) : (
        <ChevronRight size={16} color={t.inkFaint} style={{ flexShrink: 0 }} />
      )}
    </button>
  );
}

/* ───────── Course detail drawer ───────── */

function CourseDetail({
  courseId, onClose, update, uploadPhoto, uploading, deleteCourse, deleting,
}: {
  courseId: string | null;
  onClose: () => void;
  update: (id: string, updates: any) => Promise<any>;
  uploadPhoto: (id: string, file: File) => Promise<any>;
  uploading: boolean;
  deleteCourse: (id: string) => Promise<any>;
  deleting: boolean;
}) {
  const { data: course, isFetched } = useQuery({
    queryKey: ['admin-v2', 'courses', 'detail', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data } = await supabase
        .from('golf_courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();
      return data;
    },
    enabled: !!courseId,
    staleTime: 30_000,
  });

  const [form, setForm] = useState<Record<string, any>>({});
  const [confirmDel, setConfirmDel] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const draftKey = courseId ? draftKeys.course(courseId) : null;

  // Silently close if the id no longer resolves to a row.
  useEffect(() => {
    if (courseId && isFetched && course == null) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, isFetched, course]);

  const courseValues = useMemo<Record<string, any> | null>(() => {
    if (!course) return null;
    return {
      name: course.name ?? '',
      continent: course.continent ?? '',
      country: course.country ?? '',
      region_key: (course as any).region_key ?? '',
      sub_country: course.sub_country ?? '',
      region: course.region ?? '',
      country_code: course.country_code ?? '',
      latitude: course.latitude ?? '',
      longitude: course.longitude ?? '',
      global_rank: course.global_rank ?? '',
      regional_rank: course.regional_rank ?? '',
      usa_rank: course.usa_rank ?? '',
      country_rank: course.country_rank ?? '',
      website_url: course.website_url ?? '',
      top100_url: course.top100_url ?? '',
      course_type: course.course_type ?? '',
      has_hosted_major: !!course.has_hosted_major,
      description: course.description ?? '',
    };
  }, [course?.id]); // eslint-disable-line

  // Hydrate form from record; if a matching draft exists AND differs from
  // record values, apply the draft and surface the restored bar.
  useEffect(() => {
    if (!courseValues || !draftKey) return;
    const draft = loadDraft(draftKey);
    if (draft && !draftsEqual(draft, courseValues)) {
      setForm({ ...courseValues, ...draft });
      setDraftRestored(true);
    } else {
      setForm(courseValues);
      setDraftRestored(false);
    }
  }, [courseValues, draftKey]);

  const set = (k: string, v: any) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (draftKey) saveDraft(draftKey, next);
      return next;
    });
  };

  const discardDraft = () => {
    if (draftKey) clearDraft(draftKey);
    if (courseValues) setForm(courseValues);
    setDraftRestored(false);
  };

  const handleSave = async () => {
    if (!courseId) return;
    const continent = (form.continent ?? '').trim();
    const country = (form.country ?? '').trim();
    const regionKey = (form.region_key ?? '').trim();
    const name = (form.name ?? '').trim();
    if (!name) { toast.error('Name is required'); return; }
    if (!continent) { toast.error('Continent is required'); return; }
    if (!country) { toast.error('Region is required'); return; }
    // Legacy stored value that isn't a grouping label is allowed only when
    // untouched (i.e. still equals the original record value).
    const original = (course?.country ?? '').trim();
    const legacyUntouched = country === original && !isCanonicalCountry(country);
    if (!legacyUntouched && !isCanonicalCountry(country)) {
      toast.error(`"${country}" is not a valid region grouping`);
      return;
    }
    if (!legacyUntouched && !regionKey) { toast.error('Region key is missing - re-pick the region'); return; }
    if (!trimOrNull(form.sub_country)) { toast.error('Country / home nation is required'); return; }
    const updates: any = {
      name,
      continent: continent as any,
      country,
      region_key: trimOrNull(regionKey),
      sub_country: trimOrNull(form.sub_country),
      region: trimOrNull(form.region),
      country_code: trimOrNull(form.country_code),
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      global_rank: form.global_rank === '' ? null : Number(form.global_rank),
      regional_rank: form.regional_rank === '' ? null : Number(form.regional_rank),
      usa_rank: form.usa_rank === '' ? null : Number(form.usa_rank),
      country_rank: form.country_rank === '' ? null : Number(form.country_rank),
      website_url: trimOrNull(form.website_url),
      top100_url: trimOrNull(form.top100_url),
      course_type: trimOrNull(form.course_type),
      has_hosted_major: !!form.has_hosted_major,
      description: trimOrNull(form.description),
    };
    await update(courseId, updates);
    if (draftKey) clearDraft(draftKey);
    setDraftRestored(false);
    qc.invalidateQueries({ queryKey: ['admin-v2', 'courses', 'detail', courseId] });
  };

  return (
    <DetailDrawer
      open={!!courseId}
      onClose={onClose}
      title={course?.name ?? 'Course'}
      subtitle={course ? `${course.country ?? ''}${course.sub_country ? ` · ${course.sub_country}` : ''}` : undefined}
      footer={course && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setConfirmDel(true)}
            disabled={deleting}
            style={{
              padding: '10px 14px', borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.surface, color: t.danger,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleSave}
            style={{
              padding: '10px 16px', borderRadius: t.radius.md,
              border: 'none', background: t.ink, color: t.surface,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >Save</button>
        </div>
      )}
    >
      {!course ? (
        <div style={{ color: t.inkMuted, fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DraftRestoredBar visible={draftRestored} onDiscard={discardDraft} />
          {/* C4-2: Course Insight (collapsed by default) */}
          <details
            style={{
              border: `1px solid ${t.line}`, borderRadius: t.radius.md,
              background: t.surface, padding: '10px 12px',
            }}
          >
            <summary
              style={{
                cursor: 'pointer', listStyle: 'none',
                color: t.ink, fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>Insights</span>
              <ChevronRight size={14} color={t.inkFaint} />
            </summary>
            <div style={{ marginTop: 10 }}>
              <CourseInsight courseId={courseId} compact />
            </div>
          </details>

          {/* Hero */}
          <div style={{
            position: 'relative', aspectRatio: '16/9',
            borderRadius: t.radius.md, overflow: 'hidden',
            background: t.canvas, border: `1px solid ${t.line}`,
          }}>
            {course.thumbnail_image
              ? <img src={course.thumbnail_image} alt={course.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={32} color={t.inkFaint} />
                </div>
            }
            <input
              ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f && courseId) uploadPhoto(courseId, f);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute', right: 8, bottom: 8,
                padding: '6px 10px', borderRadius: t.radius.sm,
                background: 'rgba(0,0,0,.7)', color: t.ink, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {uploading ? <Loader2 size={12} className="admin-spin" /> : <Upload size={12} />}
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
          </div>

          <Section title="Identity">
            <Field label="Name"><TextInput value={form.name} onChange={v => set('name', v)} /></Field>
            <Field label="Country code"><TextInput value={form.country_code} onChange={v => set('country_code', v)} placeholder="e.g. US" /></Field>
            <Field label="Club">{courseId && <CourseClubControl courseId={courseId} clubId={(course as any)?.club_id ?? null} />}</Field>
          </Section>

          <Section title="Location">
            <CourseGeographySelectors
              value={{
                country: form.country ?? '',
                region_key: form.region_key ?? '',
                continent: form.continent ?? '',
                sub_country: form.sub_country ?? '',
                region: form.region ?? '',
              }}
              onChange={patch => setForm(f => {
                const next = { ...f, ...patch };
                if (draftKey) saveDraft(draftKey, next);
                return next;
              })}
              originalCountry={course?.country ?? null}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Latitude"><TextInput value={form.latitude} onChange={v => set('latitude', v)} inputMode="decimal" /></Field>
              <Field label="Longitude"><TextInput value={form.longitude} onChange={v => set('longitude', v)} inputMode="decimal" /></Field>
            </div>
          </Section>

          <Section title="Rankings">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Global rank"><TextInput value={form.global_rank} onChange={v => set('global_rank', v)} inputMode="numeric" /></Field>
              <Field label="Regional rank"><TextInput value={form.regional_rank} onChange={v => set('regional_rank', v)} inputMode="numeric" /></Field>
              <Field label="USA rank"><TextInput value={form.usa_rank} onChange={v => set('usa_rank', v)} inputMode="numeric" /></Field>
              <Field label="Country rank"><TextInput value={form.country_rank} onChange={v => set('country_rank', v)} inputMode="numeric" /></Field>
            </div>
            <Field label="Top 100 URL"><TextInput value={form.top100_url} onChange={v => set('top100_url', v)} /></Field>
          </Section>

          <Section title="Details">
            <Field label="Website URL"><TextInput value={form.website_url} onChange={v => set('website_url', v)} /></Field>
            <Field label="Course type">
              <SelectInput value={form.course_type} onChange={v => set('course_type', v)}>
                <option value="">Not set</option>
                {COURSE_TYPES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
              </SelectInput>
            </Field>
            <Toggle
              label="Has hosted a major"
              value={!!form.has_hosted_major}
              onChange={v => set('has_hosted_major', v)}
            />
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={5}
                style={{
                  width: '100%', resize: 'vertical', padding: '10px 12px',
                  borderRadius: t.radius.md, border: `1px solid ${t.line}`,
                  background: t.surface, color: t.ink, fontSize: 13, outline: 'none', lineHeight: 1.45,
                }}
              />
            </Field>
            <div style={{ fontSize: 11, color: t.inkFaint }}>
              Added {format(new Date(course.created_at), 'd MMM yyyy')}
            </div>
          </Section>
        </div>
      )}

      <ConfirmDialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={async () => {
          if (!courseId) return;
          await deleteCourse(courseId);
          setConfirmDel(false);
          onClose();
        }}
        title={`Delete "${course?.name ?? 'course'}"?`}
        description="This is blocked if any users have rated or posted about this course. Only safe for duplicates or test entries."
        requireText="DELETE"
        tone="danger"
        confirmLabel="Delete course"
        busy={deleting}
      />

      <style>{`.admin-spin { animation: admin-rot 1s linear infinite; } @keyframes admin-rot { to { transform: rotate(360deg); } }`}</style>
    </DetailDrawer>
  );
}




/* ───────────────────────── Tour Players tab ───────────────────────── */

const TOURS: Record<string, string> = {
  pga: 'PGA Tour', euro: 'DP World', lpga: 'LPGA',
  pgad: 'Korn Ferry', liv: 'LIV', champ: 'Champions',
};

function normalizeTourCode(code: string): string {
  const c = code.toLowerCase();
  if (c === 'eur' || c === 'dp' || c === 'dpwt') return 'euro';
  if (c === 'korn-ferry') return 'pgad';
  if (c === 'champions-tour') return 'champ';
  return c;
}

interface PlayerRow {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  countryCode: string | null;
  tourCodes: string[] | null;
  headshotOverride: string | null;
  photoUrl: string | null;
  updatedAt: string | null;
}

const PLAYERS_KEY = ['admin-v2', 'tour', 'players'] as const;

/** The full sr_players directory (paged in 1000s). */
function useAdminPlayers() {
  return useQuery({
    queryKey: PLAYERS_KEY,
    queryFn: async (): Promise<PlayerRow[]> => {
      const batch = 1000;
      let offset = 0; let all: any[] = []; let more = true;
      while (more) {
        const { data, error } = await supabase
          .from('sr_players')
          .select('id, full_name, first_name, last_name, country, country_code, tour_codes, headshot_override, photo_url, updated_at')
          .order('full_name', { ascending: true })
          .range(offset, offset + batch - 1);
        if (error) throw error;
        all = all.concat(data ?? []);
        more = (data?.length ?? 0) === batch;
        offset += batch;
      }
      return all.map(p => ({
        id: p.id, fullName: p.full_name, firstName: p.first_name, lastName: p.last_name,
        country: p.country, countryCode: p.country_code,
        tourCodes: p.tour_codes, headshotOverride: p.headshot_override,
        photoUrl: p.photo_url ?? null,
        updatedAt: p.updated_at,
      }));
    },
    staleTime: 10 * 60_000,
  });
}

const ALL_TOURS = ['pga', 'eur', 'lpga', 'pgad', 'liv', 'champions-tour'];
const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA Tour', eur: 'DP World', lpga: 'LPGA',
  pgad: 'Korn Ferry', liv: 'LIV', 'champions-tour': 'Champions',
};

/** The existing "Sync players" action, unchanged, shared by Run now and the directory. */
function usePlayerSync() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncLabel, setSyncLabel] = useState('');
  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    const results: { tour: string; ok: boolean }[] = [];
    for (const tourId of ALL_TOURS) {
      setSyncLabel(TOUR_LABELS[tourId]);
      try {
        const { data, error } = await supabase.functions.invoke('sportradar-sync', {
          body: { action: 'players', tourId, year: 2026, seasonYear: 2026, roundType: 'stroke' },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        results.push({ tour: TOUR_LABELS[tourId], ok: true });
      } catch (e) {
        results.push({ tour: TOUR_LABELS[tourId], ok: false });
      }
    }
    setSyncing(false); setSyncLabel('');
    queryClient.invalidateQueries({ queryKey: PLAYERS_KEY });
    queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'feeds'] });
    const failed = results.filter(r => !r.ok);
    if (failed.length === 0) toast.success('All tours synced');
    else toast.error(`Failed: ${failed.map(r => r.tour).join(', ')}`);
  };
  return { syncing, syncLabel, handleSync };
}

/**
 * BRIEF_CONTENT_DESK Stage 4 — the Tour data section plus its sub-view, the
 * existing player list, and the existing headshot override sheet (?player=).
 */
export function TourSection() {
  const [params, setParams] = useSearchParams();
  const sub = params.get('sub');
  const players = useAdminPlayers();
  const sync = usePlayerSync();
  const [cacheBust, setCacheBust] = useState(0);
  const [fallback, setFallback] = useState<PlayerRow | null>(null);
  const activePlayerId = params.get('player');
  const setParam = (k: string, v: string | null, push = false, extra?: Record<string, string>) => {
    // One navigation owns both directory and search; router edits do not queue.
    setParams(current => {
      const next = new URLSearchParams(current);
      if (v == null) next.delete(k); else next.set(k, v);
      for (const [key, value] of Object.entries(extra ?? {})) next.set(key, value);
      if (k === 'sub' && v !== 'players') next.delete('q');
      return next;
    }, { replace: !push });
  };

  useEffect(() => {
    const h = () => players.refetch();
    window.addEventListener('admin-v2:refetch', h);
    return () => window.removeEventListener('admin-v2:refetch', h);
  }, [players]);

  const list = players.data ?? [];
  const noPhotoSet = players.data ? list.filter(p => !p.photoUrl && !p.headshotOverride).length : null;
  const active = list.find(p => p.id === activePlayerId) ?? (fallback?.id === activePlayerId ? fallback : null);

  const sheet = (
    <PhotoSheet
      player={active}
      onClose={() => { setParam('player', null); setFallback(null); }}
      cacheBust={cacheBust}
      onCacheBust={() => { setCacheBust(p => p + 1); }}
    />
  );

  if (sub === 'players') {
    return (
      <>
        <button type="button" onClick={() => setParam('sub', null)} style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', padding: '4px 0', color: t.inkMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>&lsaquo; Tour data</button>
        <TourPlayersTab players={list} isLoading={players.isLoading} refetch={() => players.refetch()} sync={sync} cacheBust={cacheBust} onOpen={(id) => setParam('player', id, !activePlayerId)} />
        {sheet}
      </>
    );
  }
  return (
    <>
      <TourDataSection
        syncing={sync.syncing}
        syncLabel={sync.syncLabel}
        onRunSync={sync.handleSync}
        noPhotoSet={noPhotoSet}
        onOpenDirectory={() => setParam('sub', 'players', true)}
        onOpenPlayer={async (id, name) => {
          // Exact-name fallback never chooses between same-name players.
          if (id == null) {
            const key = matchKey(name);
            const nameOf = (p: PlayerRow) => p.fullName || `${p.firstName ?? ''} ${p.lastName ?? ''}`;
            const exact = key ? list.filter(p => matchKey(nameOf(p)) === key) : [];
            // No exact match: a unique word match among non-DUP rows.
            const words = exact.length === 0 ? list.filter(p => !isDupName(nameOf(p)) && wordsMatch(name, nameOf(p))) : [];
            const pick = exact.length === 1 ? exact[0] : exact.length === 0 && words.length === 1 ? words[0] : null;
            if (pick) {
              setParam('player', pick.id, true);
            } else {
              setParam('sub', 'players', true, { q: name });
            }
            return;
          }
          // Linked rows outside the loaded directory retain the single fetch.
          if (list.some(p => p.id === id)) { setParam('player', id, true); return; }
          const { data, error } = await supabase
            .from('sr_players')
            .select('id, full_name, first_name, last_name, country, country_code, tour_codes, headshot_override, photo_url, updated_at')
            .eq('id', id)
            .maybeSingle();
          if (error || !data) { toast.error('Could not open this player'); return; }
          setFallback({
            id: data.id, fullName: data.full_name ?? name, firstName: data.first_name, lastName: data.last_name,
            country: data.country, countryCode: data.country_code, tourCodes: data.tour_codes,
            headshotOverride: data.headshot_override, photoUrl: data.photo_url ?? null, updatedAt: data.updated_at,
          });
          setParam('player', id, true);
        }}
        onAddPhoto={(fp) => {
          if (!list.some(p => p.id === fp.player_id)) {
            setFallback({ id: fp.player_id, fullName: fp.name, firstName: null, lastName: null, country: fp.country, countryCode: null, tourCodes: fp.tour_codes, headshotOverride: fp.headshot_override, photoUrl: fp.photo_url, updatedAt: null });
          }
          setParam('player', fp.player_id, true);
        }}
      />
      {sheet}
    </>
  );
}

function TourPlayersTab({ players: data, isLoading, refetch, sync, cacheBust, onOpen }: {
  players: PlayerRow[]; isLoading: boolean; refetch: () => void;
  sync: { syncing: boolean; syncLabel: string; handleSync: () => Promise<void> };
  cacheBust: number; onOpen: (id: string) => void;
}) {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(() => params.get('q') ?? '');
  const [page, setPage] = useState(1);
  const [tourFilter, setTourFilter] = useState('all');
  const { syncing, syncLabel, handleSync } = sync;
  const PAGE_SIZE = 25;

  const stats = useMemo(() => {
    const byTour: Record<string, number> = {};
    for (const p of data) {
      p.tourCodes?.forEach(tc => {
        const k = normalizeTourCode(tc);
        byTour[k] = (byTour[k] || 0) + 1;
      });
    }
    return {
      total: data.length,
      countries: new Set(data.map(p => p.country || p.countryCode).filter(Boolean)).size,
      byTour,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let r = data;
    if (tourFilter !== 'all') r = r.filter(p => p.tourCodes?.some(tc => normalizeTourCode(tc) === tourFilter));
    const tokens = nameTokens(search);
    if (tokens.length) {
      // Every query word must appear in the name or in the country.
      r = r.filter(p => {
        const n = matchKey(p.fullName || `${p.firstName ?? ''} ${p.lastName ?? ''}`);
        const c = matchKey(p.country);
        return tokens.every(tk => n.includes(tk)) || tokens.every(tk => c.includes(tk));
      });
    }
    return r;
  }, [data, tourFilter, search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        <StatTile label="Players" value={stats.total.toLocaleString()} />
        <StatTile label="Countries" value={stats.countries} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            padding: '10px 14px', borderRadius: t.radius.md,
            border: 'none', background: syncing ? t.line : t.ink,
            color: syncing ? t.inkFaint : t.surface,
            fontSize: 13, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          {syncing ? <Loader2 size={14} className="admin-spin" /> : <Zap size={14} />}
          {syncing ? `Syncing ${syncLabel}…` : 'Sync players'}
        </button>
        <button
          onClick={() => refetch()}
          style={{
            padding: '10px 14px', borderRadius: t.radius.md,
            border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', padding: '2px' }}>
        {[['all', `All · ${stats.total}`] as const, ...Object.entries(TOURS).map(([k, l]) => [k, `${l} · ${stats.byTour[k] ?? 0}`] as const)].map(([key, label]) => {
          const active = tourFilter === key;
          return (
            <button
              key={key}
              onClick={() => { setTourFilter(key); setPage(1); }}
              style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 999,
                border: `1px solid ${active ? 'transparent' : t.line}`,
                background: active ? t.brandSoft : t.surface,
                color: active ? t.brandText : t.inkMuted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >{label}</button>
          );
        })}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: t.inkFaint }} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or country…"
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            borderRadius: t.radius.md, border: `1px solid ${t.line}`,
            background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 56, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState title="No players" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {paginated.map(p => <PlayerRowCard key={p.id} player={p} cacheBust={cacheBust} onPhoto={() => onOpen(p.id)} />)}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: t.inkMuted }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <PagerBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</PagerBtn>
            <span style={{ fontSize: 13, color: t.ink, padding: '6px 4px' }}>{page} / {totalPages}</span>
            <PagerBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</PagerBtn>
          </div>
        </div>
      )}

    </div>
  );
}


function PlayerAvatar({ player, cacheBust, size = 40 }: { player: PlayerRow; cacheBust?: number; size?: number }) {
  const name = player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim();
  const primaryTour = player.tourCodes?.[0] ? normalizeTourCode(player.tourCodes[0]) : 'pga';
  const candidates = useMemo(
    () => resolvePlayerAvatarCandidates({
      name,
      photoUrl: player.photoUrl ?? null,
      tourSlug: primaryTour,
      headshotOverride: player.headshotOverride ?? null,
    }),
    [name, primaryTour, player.headshotOverride, player.photoUrl],
  );

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  // Reset walk when the candidate list changes
  const candidatesKey = candidates.join('|');
  useEffect(() => { setIdx(0); setDone(false); }, [candidatesKey]);

  const src = useMemo(() => {
    if (done || candidates.length === 0) return PLAYER_SILHOUETTE_URL;
    const base = candidates[Math.min(idx, candidates.length - 1)];
    return cacheBust ? `${base}${base.includes('?') ? '&' : '?'}cb=${cacheBust}` : base;
  }, [candidates, idx, done, cacheBust]);

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', background: t.canvas, flexShrink: 0,
    }}>
      <img
        src={src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        onError={() => {
          if (idx < candidates.length - 1) setIdx(i => i + 1);
          else setDone(true);
        }}
      />
    </div>
  );
}


function PlayerRowCard({ player, cacheBust, onPhoto }: { player: PlayerRow; cacheBust: number; onPhoto: () => void }) {
  const name = player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown';
  return (
    <button
      type="button"
      onClick={onPhoto}
      style={{
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: t.radius.md, padding: 10,
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', textAlign: 'left', cursor: 'pointer',
      }}
    >
      <PlayerAvatar player={player} cacheBust={cacheBust} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: t.inkMuted, marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span>{player.country ?? player.countryCode ?? '-'}</span>
          {player.tourCodes?.length ? (
            <span>- {player.tourCodes.map(tc => TOURS[normalizeTourCode(tc)] || tc).join(', ')}</span>
          ) : null}
        </div>
      </div>
      {player.updatedAt && (
        <div style={{ fontSize: 11, color: t.inkFaint, flexShrink: 0 }}>
          {formatAgo(player.updatedAt, { suffix: true })}
        </div>
      )}
      <ChevronRight size={16} color={t.inkFaint} style={{ flexShrink: 0 }} />
    </button>
  );
}

function PhotoSheet({
  player, onClose, cacheBust, onCacheBust,
}: {
  player: PlayerRow | null; onClose: () => void;
  cacheBust: number; onCacheBust: () => void;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [savingOverride, setSavingOverride] = useState(false);
  const [override, setOverride] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const draftKey = player ? draftKeys.player(player.id) : null;

  useEffect(() => {
    if (!player || !draftKey) { setOverride(''); setDraftRestored(false); return; }
    const record = player.headshotOverride ?? '';
    const draft = loadDraft(draftKey) as { override?: string } | null;
    if (draft && typeof draft.override === 'string' && draft.override !== record) {
      setOverride(draft.override);
      setDraftRestored(true);
    } else {
      setOverride(record);
      setDraftRestored(false);
    }
  }, [player?.id, player?.headshotOverride, draftKey]);

  const onOverrideChange = (v: string) => {
    setOverride(v);
    if (draftKey) saveDraft(draftKey, { override: v });
  };

  const discardDraft = () => {
    if (draftKey) clearDraft(draftKey);
    setOverride(player?.headshotOverride ?? '');
    setDraftRestored(false);
  };

  if (!player) return null;
  const name = player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown';
  const primary = player.tourCodes?.[0] ? normalizeTourCode(player.tourCodes[0]) : 'pga';
  const preview = (() => {
    const base = getPlayerHeadshotUrl(name, primary, player.headshotOverride);
    return cacheBust ? `${base}${base.includes('?') ? '&' : '?'}cb=${cacheBust}` : base;
  })();

  const invalidateAndBust = () => {
    qc.invalidateQueries({ queryKey: ['admin-v2', 'tour', 'players'] });
    onCacheBust();
  };

  const saveOverride = async () => {
    setSavingOverride(true);
    try {
      const val = override.trim() || null;
      const { error } = await supabase.from('sr_players').update({ headshot_override: val } as any).eq('id', player.id);
      if (error) throw error;
      toast.success('Override saved');
      if (draftKey) clearDraft(draftKey);
      setDraftRestored(false);
      invalidateAndBust();
    } catch (e: any) { toast.error(`Failed: ${e.message}`); }
    finally { setSavingOverride(false); }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('playerName', player.headshotOverride || name);
      fd.append('tourCode', primary);
      fd.append('oldTourCode', primary);
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-player-headshot`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Upload failed');
      toast.success('Headshot uploaded');
      invalidateAndBust();
    } catch (e: any) { toast.error(`Upload failed: ${e.message}`); }
    finally { setUploading(false); }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-player-headshot`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: player.headshotOverride || name, tourCode: primary }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Delete failed');
      toast.success('Headshot removed');
      invalidateAndBust();
    } catch (e: any) { toast.error(`Remove failed: ${e.message}`); }
    finally { setRemoving(false); }
  };

  return (
    <AdminSheet
      open={!!player}
      onClose={onClose}
      title="Manage headshot"
      subtitle={name}
      footer={
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px 16px', borderRadius: t.radius.md,
            border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44,
          }}
        >Close</button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <DraftRestoredBar visible={draftRestored} onDiscard={discardDraft} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 112, height: 112, borderRadius: t.radius.lg,
            overflow: 'hidden', background: t.canvas, border: `1px solid ${t.line}`,
          }}>
            <img
              src={preview} alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
            />
          </div>
        </div>

        <Field label="Headshot override">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={override}
              onChange={e => onOverrideChange(e.target.value)}
              placeholder={name}
              style={{
                flex: 1, minHeight: 44, padding: '10px 12px',
                borderRadius: t.radius.md, border: `1px solid ${t.line}`,
                background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
              }}
            />
            <button
              onClick={saveOverride} disabled={savingOverride}
              style={{
                padding: '0 14px', minHeight: 44, borderRadius: t.radius.md,
                border: 'none', background: t.ink, color: t.surface,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >{savingOverride ? '…' : 'Save'}</button>
          </div>
          <span style={{ fontSize: 11, color: t.inkFaint, marginTop: 4, display: 'block' }}>
            If the R2 filename doesn't match the player's full name, enter the correct filename here (no .webp).
          </span>
        </Field>

        <input
          ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '12px 14px', minHeight: 48,
            borderRadius: t.radius.md, border: 'none',
            background: t.ink, color: t.surface,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {uploading ? <Loader2 size={14} className="admin-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading…' : 'Upload new photo'}
        </button>
        <button
          onClick={remove} disabled={removing}
          style={{
            padding: '12px 14px', minHeight: 48,
            borderRadius: t.radius.md, border: `1px solid ${t.line}`,
            background: t.surface, color: t.danger,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {removing ? <Loader2 size={14} className="admin-spin" /> : <Trash2 size={14} />}
          {removing ? 'Removing…' : 'Remove photo'}
        </button>
      </div>
    </AdminSheet>
  );
}
