import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import {
  MapPin, Plus, Search, RefreshCw, Image as ImageIcon,
  Trash2, Upload, Loader2, Zap, Users as UsersIcon,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';

import { adminTheme as t } from '../theme';
import SectionTabs from '../components/SectionTabs';
import StatTile from '../components/StatTile';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import DetailDrawer from '../components/DetailDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import AdminSheet from '../components/AdminSheet';
import AdminAccessDenied from '../components/AdminAccessDenied';
import { VALID_CONTINENTS, COURSE_TYPES } from '../constants';
import { useCourses, createCourse, type AdminCourseRow } from '../hooks/useCourses';

type TabId = 'courses' | 'tour' | 'players';

export default function ContentPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const [params, setParams] = useSearchParams();
  const requested = (params.get('tab') as TabId) || 'courses';
  // Hide tour tabs from limited admins
  const tab: TabId = !can.manageAdmins && requested !== 'courses' ? 'courses' : requested;
  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const tabs = useMemo(() => {
    const base: { id: TabId; label: string }[] = [{ id: 'courses', label: 'Courses' }];
    if (can.manageAdmins) {
      base.push({ id: 'tour', label: 'Tour Data' });
      base.push({ id: 'players', label: 'Tour Players' });
    }
    return base;
  }, [can.manageAdmins]);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
      <SectionTabs tabs={tabs} activeId={tab} onChange={setTab} />
      {tab === 'courses' && <CoursesTab />}
      {tab === 'tour' && (can.manageAdmins ? <TourDataTab /> : <AdminAccessDenied />)}
      {tab === 'players' && (can.manageAdmins ? <TourPlayersTab /> : <AdminAccessDenied />)}
    </div>
  );
}

/* ───────────────────────── Courses tab ───────────────────────── */

function CoursesTab() {
  const c = useCourses();
  const [searchInput, setSearchInput] = useState(c.search);
  const debounced = useDebouncedValue(searchInput, 250);
  useEffect(() => { c.setSearch(debounced); /* eslint-disable-next-line */ }, [debounced]);

  useEffect(() => {
    const h = () => c.refetch();
    window.addEventListener('admin-v3:refetch', h);
    return () => window.removeEventListener('admin-v3:refetch', h);
  }, [c]);

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const totalPages = Math.max(1, Math.ceil(c.total / c.pageSize));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        <StatTile label="Total" value={c.stats.total.toLocaleString()} />
        <StatTile label="Geocoded" value={c.stats.geocoded.toLocaleString()} />
        <StatTile label="Missing Coords" value={c.stats.missingCoords.toLocaleString()} />
        <StatTile label="Top 100" value={c.stats.top100.toLocaleString()} />
      </div>

      {/* Search + filters + Add */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: t.inkFaint }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search courses…"
            style={{
              width: '100%', padding: '10px 12px 10px 36px',
              borderRadius: t.radius.md, border: `1px solid ${t.line}`,
              background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
            }}
          />
        </div>
        <select
          value={c.country}
          onChange={e => c.setCountry(e.target.value)}
          style={{
            padding: '10px 12px', borderRadius: t.radius.md,
            border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
            fontSize: 14, outline: 'none', minWidth: 160,
          }}
        >
          <option value="all">All countries</option>
          {c.countries.map(co => <option key={co} value={co}>{co}</option>)}
        </select>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            padding: '10px 14px', borderRadius: t.radius.md,
            border: 'none', background: t.ink, color: t.surface,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={16} /> Add Course
        </button>
      </div>

      {/* List */}
      {c.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 64, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : c.courses.length === 0 ? (
        <EmptyState title="No courses" subtitle={searchInput ? `for "${searchInput}"` : undefined} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.courses.map(course => (
            <CourseCard key={course.id} course={course} onOpen={() => setDrawerId(course.id)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {c.total > c.pageSize && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: t.inkMuted }}>
            {(c.page - 1) * c.pageSize + 1}–{Math.min(c.page * c.pageSize, c.total)} of {c.total.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <PagerBtn disabled={c.page <= 1} onClick={() => c.setPage(p => p - 1)}>Prev</PagerBtn>
            <span style={{ fontSize: 13, color: t.ink, padding: '6px 4px' }}>{c.page} / {totalPages}</span>
            <PagerBtn disabled={c.page >= totalPages} onClick={() => c.setPage(p => p + 1)}>Next</PagerBtn>
          </div>
        </div>
      )}

      <CourseDetail
        courseId={drawerId}
        onClose={() => setDrawerId(null)}
        update={c.updateCourse}
        uploadPhoto={c.uploadPhoto}
        uploading={c.isUploadingPhoto}
        deleteCourse={c.deleteCourse}
        deleting={c.isDeleting}
      />

      <AddCourseSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => { c.refetch(); }}
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

function CourseCard({ course, onOpen }: { course: AdminCourseRow; onOpen: () => void }) {
  const geocoded = course.latitude != null && course.longitude != null;
  return (
    <button
      onClick={onOpen}
      style={{
        width: '100%', textAlign: 'left',
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: t.radius.md, padding: 12,
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: t.radius.md,
        background: t.canvas, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {course.thumbnail_image
          ? <img src={course.thumbnail_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <ImageIcon size={18} color={t.inkFaint} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {course.name}
        </div>
        <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 2 }}>
          {course.country}{course.sub_country ? ` · ${course.sub_country}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {course.global_rank && <StatusPill tone="warn">Global #{course.global_rank}</StatusPill>}
          {course.regional_rank && <StatusPill tone="neutral">Reg #{course.regional_rank}</StatusPill>}
          {course.usa_rank && <StatusPill tone="danger">USA #{course.usa_rank}</StatusPill>}
          <StatusPill tone={geocoded ? 'ok' : 'warn'}>{geocoded ? 'Geocoded' : 'No coords'}</StatusPill>
          {course.avg_rating != null && (
            <StatusPill tone="neutral">★ {course.avg_rating.toFixed(1)} · {course.review_count ?? 0}</StatusPill>
          )}
        </div>
      </div>
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
  const { data: course } = useQuery({
    queryKey: ['admin-v3', 'courses', 'detail', courseId],
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
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (course) setForm({
      name: course.name ?? '',
      country: course.country ?? '',
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
    });
  }, [course?.id]); // eslint-disable-line

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!courseId) return;
    const updates: any = {
      name: form.name?.trim(),
      country: form.country?.trim(),
      sub_country: form.sub_country || null,
      region: form.region || null,
      country_code: form.country_code || null,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      global_rank: form.global_rank === '' ? null : Number(form.global_rank),
      regional_rank: form.regional_rank === '' ? null : Number(form.regional_rank),
      usa_rank: form.usa_rank === '' ? null : Number(form.usa_rank),
      country_rank: form.country_rank === '' ? null : Number(form.country_rank),
      website_url: form.website_url || null,
      top100_url: form.top100_url || null,
      course_type: form.course_type || null,
      has_hosted_major: !!form.has_hosted_major,
      description: form.description || null,
    };
    await update(courseId, updates);
    qc.invalidateQueries({ queryKey: ['admin-v3', 'courses', 'detail', courseId] });
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
                background: 'rgba(15,23,42,.7)', color: '#fff', fontSize: 12, fontWeight: 600,
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
            <Field label="Country"><TextInput value={form.country} onChange={v => set('country', v)} /></Field>
            <Field label="Country code"><TextInput value={form.country_code} onChange={v => set('country_code', v)} placeholder="e.g. US" /></Field>
          </Section>

          <Section title="Location">
            <Field label="State / Sub-country"><TextInput value={form.sub_country} onChange={v => set('sub_country', v)} /></Field>
            <Field label="Region"><TextInput value={form.region} onChange={v => set('region', v)} /></Field>
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

function AddCourseSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', country: '', continent: '',
    sub_country: '', region: '',
    latitude: '', longitude: '',
    website_url: '', course_type: '',
    has_hosted_major: false, description: '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) {
      setForm({
        name: '', country: '', continent: '',
        sub_country: '', region: '',
        latitude: '', longitude: '',
        website_url: '', course_type: '',
        has_hosted_major: false, description: '',
      });
    }
  }, [open]);

  const valid = form.name.trim() && form.country.trim() && form.continent;

  const submit = async () => {
    if (!valid) {
      toast.error('Name, country and continent are required');
      return;
    }
    setBusy(true);
    try {
      await createCourse(form);
      toast.success(`"${form.name}" created`);
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
        <Section title="Identity">
          <Field label="Course name" required>
            <TextInput value={form.name} onChange={v => set('name', v)} placeholder="e.g. Augusta National" />
          </Field>
          <Field label="Country" required>
            <TextInput value={form.country} onChange={v => set('country', v)} placeholder="e.g. USA" />
          </Field>
          <Field label="Continent" required>
            <SelectInput value={form.continent} onChange={v => set('continent', v)}>
              <option value="">Select…</option>
              {VALID_CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </SelectInput>
          </Field>
        </Section>

        <Section title="Location">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="State / Sub-country">
              <TextInput value={form.sub_country} onChange={v => set('sub_country', v)} placeholder="e.g. Georgia" />
            </Field>
            <Field label="Region">
              <TextInput value={form.region} onChange={v => set('region', v)} placeholder="e.g. South East" />
            </Field>
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
    queryKey: ['admin-v3', 'tour', 'rankings'],
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
    window.addEventListener('admin-v3:refetch', h);
    return () => window.removeEventListener('admin-v3:refetch', h);
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
  const [photoPlayer, setPhotoPlayer] = useState<PlayerRow | null>(null);
  const [cacheBust, setCacheBust] = useState(0);
  const PAGE_SIZE = 25;

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v3', 'tour', 'players'],
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
    window.addEventListener('admin-v3:refetch', h);
    return () => window.removeEventListener('admin-v3:refetch', h);
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
    queryClient.invalidateQueries({ queryKey: ['admin-v3', 'tour', 'players'] });
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
          {paginated.map(p => <PlayerRowCard key={p.id} player={p} cacheBust={cacheBust} onPhoto={() => setPhotoPlayer(p)} />)}
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
        player={photoPlayer}
        onClose={() => setPhotoPlayer(null)}
        cacheBust={cacheBust}
        onCacheBust={() => setCacheBust(p => p + 1)}
      />
    </div>
  );
}

function PlayerAvatar({ player, cacheBust, size = 40 }: { player: PlayerRow; cacheBust?: number; size?: number }) {
  const codes = player.tourCodes?.length ? player.tourCodes.map(normalizeTourCode) : ['pga'];
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const name = player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim();
  const src = useMemo(() => {
    if (done || !name) return PLAYER_SILHOUETTE_URL;
    const base = getPlayerHeadshotUrl(name, codes[idx] || 'pga', player.headshotOverride);
    return cacheBust ? `${base}${base.includes('?') ? '&' : '?'}cb=${cacheBust}` : base;
  }, [name, codes, idx, done, player.headshotOverride, cacheBust]);

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
          if (idx < codes.length - 1) setIdx(i => i + 1);
          else setDone(true);
        }}
      />
    </div>
  );
}

function PlayerRowCard({ player, cacheBust, onPhoto }: { player: PlayerRow; cacheBust: number; onPhoto: () => void }) {
  const name = player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown';
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: t.radius.md, padding: 10,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button
        onClick={onPhoto}
        title="Manage headshot"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <PlayerAvatar player={player} cacheBust={cacheBust} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: t.inkMuted, marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span>{player.country ?? player.countryCode ?? '—'}</span>
          {player.tourCodes?.length ? (
            <span>· {player.tourCodes.map(tc => TOURS[normalizeTourCode(tc)] || tc).join(', ')}</span>
          ) : null}
        </div>
      </div>
      {player.updatedAt && (
        <div style={{ fontSize: 11, color: t.inkFaint, flexShrink: 0 }}>
          {formatDistanceToNow(new Date(player.updatedAt), { addSuffix: true })}
        </div>
      )}
    </div>
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

  useEffect(() => { setOverride(player?.headshotOverride ?? ''); }, [player?.id, player?.headshotOverride]);

  if (!player) return null;
  const name = player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown';
  const primary = player.tourCodes?.[0] ? normalizeTourCode(player.tourCodes[0]) : 'pga';
  const preview = (() => {
    const base = getPlayerHeadshotUrl(name, primary, player.headshotOverride);
    return cacheBust ? `${base}${base.includes('?') ? '&' : '?'}cb=${cacheBust}` : base;
  })();

  const invalidateAndBust = () => {
    qc.invalidateQueries({ queryKey: ['admin-v3', 'tour', 'players'] });
    onCacheBust();
  };

  const saveOverride = async () => {
    setSavingOverride(true);
    try {
      const val = override.trim() || null;
      const { error } = await supabase.from('sr_players').update({ headshot_override: val } as any).eq('id', player.id);
      if (error) throw error;
      toast.success('Override saved');
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
              onChange={e => setOverride(e.target.value)}
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
