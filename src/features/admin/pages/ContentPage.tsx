import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
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
import SectionTabs from '../components/SectionTabs';
import StatTile from '../components/StatTile';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import DetailDrawer from '../components/DetailDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import AdminSheet from '../components/AdminSheet';
import CourseInsight from '../components/CourseInsight';
import AdminAccessDenied from '../components/AdminAccessDenied';
import { COURSE_TYPES } from '../constants';
import { CourseGeographySelectors } from '../components/CourseGeographySelectors';
import { DuplicateCourseWarning, useDuplicateCourseCheck } from '../components/DuplicateCourseWarning';
import { isCanonicalCountry, trimOrNull } from '../lib/geography';
import { useCourses, createCourse, type AdminCourseRow, type CourseFilter } from '../hooks/useCourses';
import { saveDraft, loadDraft, clearDraft, draftKeys, draftsEqual } from '../lib/sheetDrafts';
import HelpArticlesTab from '../components/HelpArticlesTab';
import LegalDocumentsTab from '../components/LegalDocumentsTab';
import TheWireTab from '../components/wire/TheWireTab';
import AmateurNewsTab from '../components/wire/AmateurNewsTab';

type TabId = 'courses' | 'wire' | 'tour' | 'players' | 'help' | 'legal';

export default function ContentPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const [params, setParams] = useSearchParams();
  

  // Legacy redirect: ?tab=course-requests -> Inbox
  if (params.get('tab') === 'course-requests') {
    return <Navigate to="/admin-v2/inbox?type=courseRequest" replace />;
  }

  const requested = (params.get('tab') as TabId) || 'courses';
  const isAllowed = (id: TabId): boolean => {
    if (id === 'courses') return true;
    if (id === 'help' || id === 'legal') return can.viewModeration;
    if (id === 'tour' || id === 'players' || id === 'wire') return can.manageAdmins;
    return false;
  };
  const tab: TabId = isAllowed(requested) ? requested : 'courses';

  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const tabs = useMemo(() => {
    const base: { id: TabId; label: string }[] = [{ id: 'courses', label: 'Courses' }];
    if (can.manageAdmins) {
      base.push({ id: 'wire', label: 'The Wire' });
      base.push({ id: 'amateur', label: 'Amateur news' });
      base.push({ id: 'tour', label: 'Tour data' });
      base.push({ id: 'players', label: 'Players' });
    }
    if (can.viewModeration) {
      base.push({ id: 'help', label: 'Help' });
      base.push({ id: 'legal', label: 'Legal' });
    }
    return base;
  }, [can.manageAdmins, can.viewModeration]);

  return (
    <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1180, margin: '0 auto' }}>
      <SectionTabs tabs={tabs} activeId={tab} onChange={setTab} />
      {tab === 'courses' && <CoursesTab />}
      {tab === 'help' && (can.viewModeration ? <HelpArticlesTab /> : <AdminAccessDenied />)}
      {tab === 'legal' && (can.viewModeration ? <LegalDocumentsTab /> : <AdminAccessDenied />)}
      {tab === 'wire' && (can.manageAdmins ? <TheWireTab /> : <AdminAccessDenied />)}
      {tab === 'amateur' && (can.manageAdmins ? <AmateurNewsTab /> : <AdminAccessDenied />)}
      {tab === 'tour' && (can.manageAdmins ? <TourDataTab /> : <AdminAccessDenied />)}
      {tab === 'players' && (can.manageAdmins ? <TourPlayersTab /> : <AdminAccessDenied />)}
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
  useEffect(() => { c.setFilter(initialFilter); /* eslint-disable-next-line */ }, []);

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

  const totalPages = Math.max(1, Math.ceil(c.total / c.pageSize));

  const total = c.stats.total;
  const withCoords = c.stats.geocoded;
  const withPhoto = Math.max(0, total - c.stats.missingPhoto);

  /**
   * Each tile states what the directory HAS and filters to the INVERSE - the
   * work is the gap, not the coverage. The list heading names the filtered
   * view, which is what makes the inversion legible.
   */
  const coverage: { id: CourseFilter; label: string; value: number }[] = [
    { id: 'missing_coords', label: 'With coords', value: withCoords },
    { id: 'missing_photo',  label: 'With photo',  value: withPhoto },
    { id: 'top100',         label: 'Ranked',      value: c.stats.top100 },
  ];

  const activeIssueChip = c.filter === 'missing_coords' || c.filter === 'missing_photo';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search + Add */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: t.inkFaint }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search courses"
            style={{
              width: '100%', padding: '10px 12px 10px 36px',
              borderRadius: t.radius.md, border: `1px solid ${t.line}`,
              background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
            }}
          />
        </div>
        <button
          onClick={openAdd}
          style={{
            padding: '10px 14px', borderRadius: t.radius.md,
            border: 'none', background: t.ink, color: t.surface,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={16} /> Add course
        </button>
      </div>

      {/* Coverage board — states what the directory HAS; tiles filter the gap. */}
      <div style={{
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: 18, padding: '10px 12px 12px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          gap: 10, marginBottom: 10,
        }}>
          <span style={{ ...KICKER, color: t.inkMuted }}>Directory</span>
          <span style={{ ...LABEL_T, ...FIG_T, color: t.inkFaint }}>
            {total.toLocaleString()} courses
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {coverage.map(tile => (
            <CoverageTile
              key={tile.id}
              label={tile.label}
              value={tile.value}
              total={total}
              active={c.filter === tile.id}
              onClick={() => c.setFilter(c.filter === tile.id ? 'all' : tile.id)}
            />
          ))}
        </div>
      </div>

      {/* List */}
      {c.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 64, background: t.canvas, borderRadius: 18, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : c.courses.length === 0 ? (
        activeIssueChip
          ? <EmptyState icon={<CheckCircle2 size={22} color={t.ok} />} title="Nothing to fix here." />
          : <EmptyState title="No courses" subtitle={searchInput ? `for "${searchInput}"` : undefined} />
      ) : (
        <div style={{
          background: t.surface, border: `1px solid ${t.line}`,
          borderRadius: 18, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${t.line}`,
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
          }}>
            <span style={{ ...LABEL_T, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {VIEW_LABEL[c.filter]}
            </span>
            <span style={{ ...LABEL_T, ...FIG_T, color: t.inkFaint, flexShrink: 0 }}>
              {c.total.toLocaleString()}
            </span>
          </div>
          {c.courses.map((course, i) => (
            <CourseRow
              key={course.id}
              course={course}
              first={i === 0}
              activeFilter={c.filter}
              missingCoords={c.stats.missingCoords}
              missingPhoto={c.stats.missingPhoto}
              total={total}
              onOpen={() => openCourse(course.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {c.total > c.pageSize && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: t.inkMuted, fontVariantNumeric: 'tabular-nums' }}>
            {(c.page - 1) * c.pageSize + 1}-{Math.min(c.page * c.pageSize, c.total)} of {c.total.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <PagerBtn disabled={c.page <= 1} onClick={() => c.setPage(p => p - 1)}>Prev</PagerBtn>
            <span style={{ fontSize: 13, color: t.ink, padding: '6px 4px', fontVariantNumeric: 'tabular-nums' }}>{c.page} / {totalPages}</span>
            <PagerBtn disabled={c.page >= totalPages} onClick={() => c.setPage(p => p + 1)}>Next</PagerBtn>
          </div>
        </div>
      )}

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

function DraftRestoredBar({ visible, onDiscard }: { visible: boolean; onDiscard: () => void }) {
  if (!visible) return null;
  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, padding: '8px 12px', minHeight: 40,
        borderRadius: t.radius.md, border: `1px solid ${t.line}`,
        background: t.brandSoft, color: t.brandText,
        fontSize: 12, fontWeight: 600,
      }}
    >
      <span>Draft restored</span>
      <button
        type="button"
        onClick={onDiscard}
        style={{
          background: 'transparent', border: 'none',
          color: t.brandText, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', padding: '4px 8px',
        }}
      >Discard</button>
    </div>
  );
}



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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.inkFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: t.inkMuted, fontWeight: 600 }}>
        {label}{required && <span style={{ color: t.danger, marginLeft: 2 }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { value: any; onChange: (v: string) => void }) {
  const { value, onChange, ...rest } = props;
  return (
    <input
      {...rest}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', minHeight: 44, padding: '10px 12px',
        borderRadius: t.radius.md, border: `1px solid ${t.line}`,
        background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
        ...(rest.style || {}),
      }}
    />
  );
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', minHeight: 44, padding: '10px 12px',
        borderRadius: t.radius.md, border: `1px solid ${t.line}`,
        background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
      }}
    >{children}</select>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', minHeight: 44,
        borderRadius: t.radius.md, border: `1px solid ${t.line}`,
        background: t.surface, cursor: 'pointer', width: '100%',
        textAlign: 'left',
      }}
    >
      <span style={{ flex: 1, fontSize: 14, color: t.ink, fontWeight: 500 }}>{label}</span>
      <span style={{
        width: 40, height: 24, borderRadius: 999,
        background: value ? t.ink : t.line,
        position: 'relative', transition: 'background .15s',
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 20, height: 20, borderRadius: '50%',
          background: t.surface, transition: 'left .15s',
        }} />
      </span>
    </button>
  );
}

/* ───────── Add course sheet ───────── */

function AddCourseSheet({ open, onClose, onCreated, uploadPhoto, onOpenExisting }: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  uploadPhoto: (id: string, file: File) => Promise<any>;
  onOpenExisting: (id: string) => void;
}) {
  const EMPTY = {
    name: '', country: '', continent: '', region_key: '',
    sub_country: '', region: '',
    latitude: '', longitude: '',
    website_url: '', course_type: '',
    has_hosted_major: false, description: '',
  };
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const duplicateHits = useDuplicateCourseCheck(form.name);
  const draftKey = draftKeys.courseNew();
  const set = (k: keyof typeof form, v: any) => setForm(f => {
    const next = { ...f, [k]: v };
    saveDraft(draftKey, next);
    return next;
  });

  useEffect(() => {
    if (open) {
      // Restore any prior draft when the sheet appears (fresh mount or reopen).
      const draft = loadDraft(draftKey) as Partial<typeof EMPTY> | null;
      if (draft && !draftsEqual(draft as any, EMPTY as any)) {
        setForm({ ...EMPTY, ...draft });
        setDraftRestored(true);
      }
      return;
    }
    // Closed: reset ephemeral form + photo, but leave the persisted draft alone.
    setForm(EMPTY);
    setDraftRestored(false);
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  }, [open]); // eslint-disable-line

  const discardDraft = () => {
    clearDraft(draftKey);
    setForm(EMPTY);
    setDraftRestored(false);
  };


  const onPickPhoto = (f: File | null) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(f);
    setPhotoPreview(f ? URL.createObjectURL(f) : null);
  };

  const valid = !!(
    form.name.trim() &&
    form.continent &&
    form.region_key &&
    isCanonicalCountry(form.country) &&
    form.sub_country.trim()
  );

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.region_key || !isCanonicalCountry(form.country) || !form.continent) {
      toast.error('Pick a region (and continent for Rest of World)');
      return;
    }
    if (!form.sub_country.trim()) { toast.error('Country / home nation is required'); return; }
    setBusy(true);
    try {
      const created = await createCourse(form);
      if (photoFile && created?.id) {
        try {
          await uploadPhoto(created.id, photoFile);
        } catch {
          toast.error('Course created, but photo upload failed');
        }
      }
      toast.success(`"${form.name}" created`);
      clearDraft(draftKey);
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create course');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSheet
      open={open}
      onClose={onClose}
      title="Add course"
      subtitle="Create a new golf course record"
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: '10px 16px', borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1, minHeight: 44,
            }}
          >Cancel</button>
          <button
            onClick={submit}
            disabled={!valid || busy}
            style={{
              padding: '10px 16px', borderRadius: t.radius.md,
              border: 'none',
              background: valid && !busy ? t.ink : t.line,
              color: valid && !busy ? t.surface : t.inkFaint,
              fontSize: 13, fontWeight: 700,
              cursor: valid && !busy ? 'pointer' : 'not-allowed',
              flex: 2, minHeight: 44,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {busy && <Loader2 size={14} className="admin-spin" />}
            {busy ? 'Creating…' : 'Create course'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <DraftRestoredBar visible={draftRestored} onDiscard={discardDraft} />
        <Section title="Photo">

          <div style={{
            position: 'relative', aspectRatio: '16/9',
            borderRadius: t.radius.md, overflow: 'hidden',
            background: t.canvas, border: `1px solid ${t.line}`,
          }}>
            {photoPreview
              ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={28} color={t.inkFaint} />
                </div>}
            <input
              ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0] ?? null; onPickPhoto(f); e.target.value = ''; }}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={busy}
              style={{
                position: 'absolute', right: 8, bottom: 8,
                padding: '6px 10px', borderRadius: t.radius.sm,
                background: 'rgba(0,0,0,.7)', color: t.ink, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <Upload size={12} />
              {photoFile ? 'Change photo' : 'Add photo'}
            </button>
          </div>
          <div style={{ color: t.inkFaint, fontSize: 11, marginTop: 6 }}>
            Optional - uploaded after the course is created.
          </div>
        </Section>

        <DuplicateCourseWarning
          hits={duplicateHits}
          onUseInstead={(id) => { onOpenExisting(id); }}
        />

        <Section title="Identity">
          <Field label="Course name" required>
            <TextInput value={form.name} onChange={v => set('name', v)} placeholder="e.g. Augusta National" />
          </Field>
        </Section>

        <Section title="Location">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CourseGeographySelectors
              value={{
                country: form.country,
                region_key: form.region_key,
                continent: form.continent,
                sub_country: form.sub_country,
                region: form.region,
              }}
              onChange={patch => setForm(f => {
                const next = { ...f, ...patch };
                saveDraft(draftKey, next);
                return next;
              })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Latitude">
              <TextInput value={form.latitude} onChange={v => set('latitude', v)} inputMode="decimal" placeholder="33.5021" />
            </Field>
            <Field label="Longitude">
              <TextInput value={form.longitude} onChange={v => set('longitude', v)} inputMode="decimal" placeholder="-82.0232" />
            </Field>
          </div>
        </Section>

        <Section title="Details">
          <Field label="Website URL">
            <TextInput value={form.website_url} onChange={v => set('website_url', v)} placeholder="https://…" />
          </Field>
          <Field label="Course type">
            <SelectInput value={form.course_type} onChange={v => set('course_type', v)}>
              <option value="">Not set</option>
              {COURSE_TYPES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
            </SelectInput>
          </Field>
          <Toggle
            label="Has hosted a major"
            value={form.has_hosted_major}
            onChange={v => set('has_hosted_major', v)}
          />
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Optional course description…"
              style={{
                width: '100%', resize: 'vertical', padding: '10px 12px',
                borderRadius: t.radius.md, border: `1px solid ${t.line}`,
                background: t.surface, color: t.ink, fontSize: 14, outline: 'none', lineHeight: 1.45,
              }}
            />
          </Field>
        </Section>
      </div>
    </AdminSheet>
  );
}

/* ───────────────────────── Tour Data tab ───────────────────────── */

function TourDataTab() {
  const [activeTour, setActiveTour] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'tour', 'rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tour_season_rankings')
        .select('id, player_id, player_name, position, points, tour_code, season_year, updated_at')
        .order('position', { ascending: true })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const h = () => refetch();
    window.addEventListener('admin-v2:refetch', h);
    return () => window.removeEventListener('admin-v2:refetch', h);
  }, [refetch]);

  const tours = useMemo(() => {
    const codes = Array.from(new Set(data.map(r => r.tour_code))).sort();
    return ['all', ...codes];
  }, [data]);

  const filtered = data.filter(r => {
    const matchT = activeTour === 'all' || r.tour_code === activeTour;
    const matchS = !search.trim() || (r.player_name ?? '').toLowerCase().includes(search.toLowerCase());
    return matchT && matchS;
  });
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const lastUpdated = data[0]?.updated_at;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        <StatTile label="Rankings" value={data.length.toLocaleString()} />
        <StatTile label="Tours" value={new Set(data.map(r => r.tour_code)).size} />
        <StatTile label="Seasons" value={new Set(data.map(r => r.season_year)).size} />
      </div>

      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        scrollbarWidth: 'none', padding: '2px',
      }}>
        {tours.map(tour => {
          const active = activeTour === tour;
          const count = tour === 'all' ? data.length : data.filter(r => r.tour_code === tour).length;
          return (
            <button
              key={tour}
              onClick={() => { setActiveTour(tour); setPage(1); }}
              style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 999,
                border: `1px solid ${active ? 'transparent' : t.line}`,
                background: active ? t.brandSoft : t.surface,
                color: active ? t.brandText : t.inkMuted,
                fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >{tour === 'all' ? 'All' : tour} · {count}</button>
          );
        })}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: t.inkFaint }} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search player…"
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            borderRadius: t.radius.md, border: `1px solid ${t.line}`,
            background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {lastUpdated && (
        <div style={{ fontSize: 11, color: t.inkFaint }}>
          Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 52, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState title="No rankings" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {paginated.map(r => (
            <div key={r.id} style={{
              background: t.surface, border: `1px solid ${t.line}`,
              borderRadius: t.radius.md, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: t.radius.sm,
                background: t.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: t.ink, fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}>#{r.position}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.player_name}
                </div>
                <div style={{ fontSize: 11, color: t.inkMuted, marginTop: 2 }}>
                  {String(r.tour_code).toUpperCase()} · {r.season_year}
                </div>
              </div>
              <div style={{ fontSize: 13, color: t.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {r.points?.toLocaleString() ?? '—'}
              </div>
            </div>
          ))}
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
  updatedAt: string | null;
}

function TourPlayersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tourFilter, setTourFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [syncLabel, setSyncLabel] = useState('');
  const [playerParams, setPlayerParams] = useSearchParams();
  const activePlayerId = playerParams.get('player');
  const openPlayer = (id: string) => {
    const next = new URLSearchParams(playerParams);
    const wasOpen = !!next.get('player');
    next.set('player', id);
    setPlayerParams(next, { replace: wasOpen });
  };
  const closePlayer = () => {
    const next = new URLSearchParams(playerParams);
    next.delete('player');
    setPlayerParams(next, { replace: true });
  };
  const [cacheBust, setCacheBust] = useState(0);
  const PAGE_SIZE = 25;

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'tour', 'players'],
    queryFn: async (): Promise<PlayerRow[]> => {
      const batch = 1000;
      let offset = 0; let all: any[] = []; let more = true;
      while (more) {
        const { data, error } = await supabase
          .from('sr_players')
          .select('id, full_name, first_name, last_name, country, country_code, tour_codes, headshot_override, updated_at')
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
        updatedAt: p.updated_at,
      }));
    },
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    const h = () => refetch();
    window.addEventListener('admin-v2:refetch', h);
    return () => window.removeEventListener('admin-v2:refetch', h);
  }, [refetch]);

  const ALL_TOURS = ['pga', 'eur', 'lpga', 'pgad', 'liv', 'champions-tour'];
  const TOUR_LABELS: Record<string, string> = {
    pga: 'PGA Tour', eur: 'DP World', lpga: 'LPGA',
    pgad: 'Korn Ferry', liv: 'LIV', 'champions-tour': 'Champions',
  };

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
    queryClient.invalidateQueries({ queryKey: ['admin-v2', 'tour', 'players'] });
    const failed = results.filter(r => !r.ok);
    if (failed.length === 0) toast.success('All tours synced');
    else toast.error(`Failed: ${failed.map(r => r.tour).join(', ')}`);
  };

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
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(p =>
        (p.fullName ?? '').toLowerCase().includes(q) ||
        (p.country ?? '').toLowerCase().includes(q));
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
          {paginated.map(p => <PlayerRowCard key={p.id} player={p} cacheBust={cacheBust} onPhoto={() => openPlayer(p.id)} />)}
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

      <PhotoSheet
        player={data.find(p => p.id === activePlayerId) ?? null}
        onClose={closePlayer}
        cacheBust={cacheBust}
        onCacheBust={() => setCacheBust(p => p + 1)}
      />
    </div>
  );
}


function PlayerAvatar({ player, cacheBust, size = 40 }: { player: PlayerRow; cacheBust?: number; size?: number }) {
  const name = player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim();
  const primaryTour = player.tourCodes?.[0] ? normalizeTourCode(player.tourCodes[0]) : 'pga';
  const candidates = useMemo(
    () => resolvePlayerAvatarCandidates({
      name,
      tourSlug: primaryTour,
      headshotOverride: player.headshotOverride ?? null,
    }),
    [name, primaryTour, player.headshotOverride],
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
          {formatDistanceToNow(new Date(player.updatedAt), { addSuffix: true })}
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
