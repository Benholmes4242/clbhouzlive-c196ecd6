import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { adminTheme as t } from '../theme';
import AdminSheet from './AdminSheet';
import { COURSE_TYPES } from '../constants';
import { CourseGeographySelectors } from './CourseGeographySelectors';
import { DuplicateCourseWarning, useDuplicateCourseCheck } from './DuplicateCourseWarning';
import { isCanonicalCountry } from '../lib/geography';
import { createCourse } from '../hooks/useCourses';
import { saveDraft, loadDraft, clearDraft, draftKeys, draftsEqual } from '../lib/sheetDrafts';
import { Section, Field, TextInput, SelectInput, Toggle, DraftRestoredBar } from './CourseFormFields';

/* ───────── Add course sheet ───────── */

export default function AddCourseSheet({ open, onClose, onCreated, uploadPhoto, onOpenExisting, prefillName, prefillSubCountry }: {
  open: boolean;
  onClose: () => void;
  /** Receives the created row. Return `false` to keep the sheet open (e.g. a follow-up step failed). */
  onCreated: (created: { id: string; name: string }) => void | boolean | Promise<void | boolean>;
  prefillName?: string;
  prefillSubCountry?: string;
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
  /** Set once a course row exists; blocks a second create in this sheet session. */
  const [createdId, setCreatedId] = useState<string | null>(null);
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
      const hasDraft = !!draft && !draftsEqual(draft as any, EMPTY as any);
      const base = hasDraft ? { ...EMPTY, ...draft } : EMPTY;
      const seeded = {
        ...base,
        ...(prefillName ? { name: prefillName } : {}),
        ...(prefillSubCountry ? { sub_country: prefillSubCountry } : {}),
      };
      if (hasDraft || prefillName || prefillSubCountry) setForm(seeded);
      if (hasDraft) setDraftRestored(true);
      return;
    }
    // Closed: reset ephemeral form + photo, but leave the persisted draft alone.
    setForm(EMPTY);
    setCreatedId(null);
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
    if (createdId) return;
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.region_key || !isCanonicalCountry(form.country) || !form.continent) {
      toast.error('Pick a region (and continent for Rest of World)');
      return;
    }
    if (!form.sub_country.trim()) { toast.error('Country / home nation is required'); return; }
    setBusy(true);
    try {
      const created = await createCourse(form);
      if (created?.id) setCreatedId(created.id);
      if (photoFile && created?.id) {
        try {
          await uploadPhoto(created.id, photoFile);
        } catch {
          toast.error('Course created, but photo upload failed');
        }
      }
      toast.success(`"${form.name}" created`);
      clearDraft(draftKey);
      const keepOpen = (await onCreated({ id: created.id, name: form.name.trim() })) === false;
      if (!keepOpen) onClose();
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {createdId && (
          <div role="status" style={{ fontSize: 12, color: t.inkMuted, fontWeight: 600 }}>
            Course created. Close this and use Attach to club to finish.
          </div>
        )}
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
            disabled={!valid || busy || !!createdId}
            style={{
              padding: '10px 16px', borderRadius: t.radius.md,
              border: 'none',
              background: valid && !busy && !createdId ? t.ink : t.line,
              color: valid && !busy && !createdId ? t.surface : t.inkFaint,
              fontSize: 13, fontWeight: 700,
              cursor: valid && !busy && !createdId ? 'pointer' : 'not-allowed',
              flex: 2, minHeight: 44,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {busy && <Loader2 size={14} className="admin-spin" />}
            {createdId ? 'Created' : busy ? 'Creating…' : 'Create course'}
          </button>
        </div>
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
