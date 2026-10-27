/**
 * AddCourseModal - the ONE Top 10 sheet (BRIEF_TOP_TEN_SHEET_AND_LABELS, mock
 * top-ten-sheet-v2.html panels A-D).
 *
 * A single continuous surface: header, an order toggle (My order / Auto by
 * rating - the hook's pinned vs auto-filled model made visible), the sortable
 * rows, then the empty slots in place. Tapping a slot swaps the BODY for the
 * add panel in the same sheet; a full ten turns adding into a swap.
 *
 * PRESERVED VERBATIM: dnd-kit sensors (PointerSensor distance 8, KeyboardSensor
 * with sortableKeyboardCoordinates), handleDragEnd's arrayMove/reorderTopTen,
 * restrictToVerticalAxis, and the add/remove/reorder mutations of
 * useUserTopTenCourses. Only what is drawn around the mechanism changed.
 *
 * Ranks come from useCourseListRanks (the membership authority), never the
 * legacy golf_courses rank columns.
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useUserTopTenCourses, type TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, GripVertical } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { toast } from '@/lib/toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { useCourseListRanks, formatListRank, type ListRank } from '@/lib/courses/listRank';
import { numberWord } from '@/lib/text/numbers';
import { analyticsEvents } from '@/utils/analyticsEvents';

// Mock values (top-ten-sheet-v2.html).
const SHELL_BORDER = 'rgba(255,255,255,0.08)';
const GRAB = 'rgba(255,255,255,0.22)';
const TOGGLE_BG = 'rgba(255,255,255,0.05)';
const TOGGLE_ON = 'rgba(255,255,255,0.11)';
const LIFT_BG = 'rgba(255,255,255,0.06)';
const LIFT_SHADOW = '0 10px 28px rgba(0,0,0,0.5)';
const SLOT_DASH = 'rgba(248,250,252,0.22)';
const FIELD_BG = 'rgba(255,255,255,0.06)';
// Derived from A.AMBER rather than a new local amber literal.
const SWAP_BORDER = `color-mix(in srgb, ${A.AMBER} 40%, transparent)`;

const scoreTone = (s: number) => A.INK;
const regionOf = (c: { sub_country?: string | null; region?: string | null; country?: string | null }) =>
  c.sub_country || c.region || c.country || null;

interface AddCourseModalProps {
  userId: string;
  onClose: () => void;
  existingCourseIds: string[];
  /** 'add' opens straight onto the add panel for the first empty position. */
  initialTab?: 'manage' | 'add';
}

type PickCourse = {
  id: string; name: string; country?: string | null; sub_country?: string | null;
  region?: string | null; thumbnail_image?: string | null;
};

const ellipsis: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const btnReset: React.CSSProperties = { background: 'transparent', border: 'none', padding: 0, fontFamily: SANS, cursor: 'pointer' };

const FigureCell: React.FC<{ value: number | null; kicker: string; tone: string }> = ({ value, kicker, tone }) => (
  <span style={{ width: 42, textAlign: 'center', flexShrink: 0 }}>
    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.02em', color: value != null ? tone : A.DIM, ...FIGS }}>
      {value != null ? value.toFixed(1) : '–'}
    </span>
    <span style={{ display: 'block', marginTop: 2, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.DIM }}>{kicker}</span>
  </span>
);

// ---- Sortable row ----
const SortableRow: React.FC<{
  course: TopTenCourse;
  first: boolean;
  rank: ListRank;
  golfers: number | null;
  onRemove: (id: string) => void;
  onRate: (id: string) => void;
  isRemoving: boolean;
}> = ({ course, first, rank, golfers, onRemove, onRate, isRemoving }) => {
  const { t } = useTranslation('profile');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course.course_id });
  const stop = (e: React.PointerEvent) => e.stopPropagation();
  const r = course.rating ?? null;
  const line = [regionOf(course), formatListRank(rank)].filter(Boolean).join(' · ');
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        zIndex: isDragging ? 50 : undefined,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: isDragging ? '10px 8px' : '10px 0',
        borderTop: !first && !isDragging ? `1px solid ${A.SOFT}` : 'none',
        background: isDragging ? LIFT_BG : 'transparent',
        borderRadius: isDragging ? 12 : 0,
        boxShadow: isDragging ? LIFT_SHADOW : 'none',
        cursor: 'grab', touchAction: 'none',
      }}
    >
      <span style={{ width: 14, flexShrink: 0, color: A.DIM, display: 'flex' }}><GripVertical size={14} /></span>
      <span style={{ width: 15, textAlign: 'right', flexShrink: 0, fontSize: 13, fontWeight: 700, color: A.DIM, ...FIGS }}>{course.position}</span>
      <CourseImageFallback courseId={course.course_id} courseName={course.name} imageUrl={course.thumbnail_image} style={{ width: 46, height: 36, borderRadius: 8, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: A.INK, ...ellipsis }}>{course.name}</span>
        {line && <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, fontWeight: 600, color: A.DIM, ...ellipsis, ...FIGS }}>{line}</span>}
      </span>
      {r == null && (
        <button type="button" onPointerDown={stop} onClick={() => onRate(course.course_id)}
          style={{ ...btnReset, flexShrink: 0, border: `1px solid ${A.HAIRLINE}`, borderRadius: 99, padding: '4px 9px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.AMBER }}>
          {t('topTen.sheet.rateIt', 'Rate it')}
        </button>
      )}
      <FigureCell value={golfers} kicker={t('topTen.golfers', 'Golfers')} tone={A.MUTE} />
      <FigureCell value={r} kicker={t('topTen.you', 'You')} tone={r != null ? scoreTone(r) : A.DIM} />
      <button type="button" onPointerDown={stop} onClick={() => onRemove(course.course_id)} disabled={isRemoving}
        aria-label={`Remove ${course.name}`}
        style={{ ...btnReset, width: 18, flexShrink: 0, textAlign: 'center', fontSize: 15, color: A.DIM, opacity: isRemoving ? 0.4 : 1 }}>
        ×
      </button>
    </div>
  );
};

// =====================================================================
export const AddCourseModal: React.FC<AddCourseModalProps> = ({ userId, onClose, initialTab }) => {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: userActivity = [] } = useUserCourseActivity(userId);
  const { addCourse, removeCourse, reorderTopTen, topTen: rawTopTen, isRemoving } = useUserTopTenCourses(userId);
  const topTen = useMemo(() => [...rawTopTen].sort((a, b) => a.position - b.position), [rawTopTen]);

  const used = new Set(topTen.map((c) => c.position));
  const emptyPositions = Array.from({ length: 10 }, (_, i) => i + 1).filter((p) => !used.has(p));

  const [addAt, setAddAt] = useState<number | null>(null);
  const [didInit, setDidInit] = useState(false);
  const [query, setQuery] = useState('');
  const [confirmAuto, setConfirmAuto] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [swapFor, setSwapFor] = useState<PickCourse | null>(null);
  const [swapChoice, setSwapChoice] = useState<string | null>(null);
  const [swapAll, setSwapAll] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<{ id: string; removed: string; position: number } | null>(null);

  // initialTab 'add' lands on the add panel for the first empty position.
  useEffect(() => {
    if (didInit || initialTab !== 'add') return;
    if (rawTopTen.length === 0 && emptyPositions.length === 10) { setAddAt(1); setDidInit(true); return; }
    setAddAt(emptyPositions[0] ?? 10);
    setDidInit(true);
  }, [didInit, initialTab, rawTopTen.length, emptyPositions]);

  // Swap, step two: once the removed course has left the list, add the new one.
  // removeCourse pins every other entry, so addCourse lands in the vacated gap.
  useEffect(() => {
    if (!pendingAdd) return;
    if (topTen.some((c) => c.course_id === pendingAdd.removed)) return;
    const { id, position } = pendingAdd;
    setPendingAdd(null);
    addCourse(id, {
      onSuccess: () => analyticsEvents.track('profile_top10_slot_filled', { course_id: id, position }),
    });
  }, [pendingAdd, topTen, addCourse]);

  // DnD sensors — preserved verbatim
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = topTen.findIndex((c) => c.course_id === active.id);
      const newIndex = topTen.findIndex((c) => c.course_id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(topTen, oldIndex, newIndex);
        reorderTopTen(newOrder.map((c, i) => ({
          course_id: c.course_id,
          position: i + 1,
          is_pinned: c.is_pinned || (c.position !== i + 1),
        })));
      }
    }
  }, [topTen, reorderTopTen]);

  // ---- Played courses (useUserCourseActivity, excluding the ten) ----
  const inTen = useMemo(() => new Set(topTen.map((c) => c.course_id)), [topTen]);
  const activityById = useMemo(() => new Map(userActivity.map((a) => [a.course_id, a])), [userActivity]);
  const playedIds = useMemo(() => userActivity.map((a) => a.course_id).filter((id) => !inTen.has(id)), [userActivity, inTen]);

  const { data: played = [] } = useQuery({
    queryKey: ['user-played-courses-for-top10', userId, playedIds],
    enabled: playedIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, region, thumbnail_image')
        .in('id', playedIds);
      if (error) throw error;
      return (data || []) as PickCourse[];
    },
  });

  const q = query.trim();
  const { data: searchHits = [] } = useQuery({
    queryKey: ['top10-sheet-search', q],
    enabled: addAt != null && q.length >= 2,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, region, thumbnail_image')
        .ilike('name', `%${q}%`)
        .limit(20);
      if (error) throw error;
      return ((data || []) as PickCourse[]).filter((c) => !inTen.has(c.id));
    },
  });

  const playedShown = useMemo(() => {
    const list = q ? played.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())) : played;
    return [...list].sort((a, b) => (activityById.get(b.id)?.rating_value ?? -1) - (activityById.get(a.id)?.rating_value ?? -1));
  }, [played, q, activityById]);
  const playedSet = new Set(playedShown.map((c) => c.id));
  const otherHits = searchHits.filter((c) => !playedSet.has(c.id));

  const { data: rankMap } = useCourseListRanks([
    ...topTen.map((c) => c.course_id), ...playedShown.map((c) => c.id), ...otherHits.map((c) => c.id),
  ]);
  const rankOf = (id: string): ListRank => rankMap?.get(id) ?? null;

  const tenIds = useMemo(() => topTen.map((c) => c.course_id).sort(), [topTen]);
  const { data: community = {} } = useQuery({
    queryKey: ['top-ten-community-ratings', tenIds],
    enabled: tenIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('course_rating_stats').select('course_id, average_rating').in('course_id', tenIds);
      if (error) throw error;
      return (data || []).reduce<Record<string, number>>((acc, r: any) => {
        if (r.course_id && r.average_rating != null) acc[r.course_id] = Number(r.average_rating);
        return acc;
      }, {});
    },
  });

  // ---- Actions ----
  const hasPins = topTen.some((c) => c.is_pinned);

  const goAuto = async () => {
    setConfirmAuto(false);
    try {
      await supabase.from('user_top_ten_courses').delete().eq('user_id', userId);
      await queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses'], refetchType: 'all' });
    } catch {
      toast.error('Could not sort by rating. Please try again.');
    }
  };
  const goMine = () => {
    if (hasPins || topTen.length === 0) return;
    reorderTopTen(topTen.map((c) => ({ course_id: c.course_id, position: c.position, is_pinned: true })));
  };

  const rate = (id: string) => { onClose(); navigate(`/courses/${id}/rate`); };

  const closeAdd = () => { setAddAt(null); setQuery(''); setSwapFor(null); setSwapChoice(null); setSwapAll(false); };

  const pick = (c: PickCourse) => {
    if (addAt == null) return;
    if (topTen.length >= 10) { setSwapFor(c); setSwapChoice(null); setSwapAll(false); return; }
    const position = addAt;
    const snapshot = topTen.map((x) => ({ course_id: x.course_id, position: x.position, is_pinned: x.is_pinned }));
    addCourse(c.id, {
      // Land it AT the tapped position: restate the list with the new entry pinned there.
      onSuccess: () => {
        reorderTopTen([...snapshot.filter((x) => x.position !== position), { course_id: c.id, position, is_pinned: true }]);
        analyticsEvents.track('profile_top10_slot_filled', { course_id: c.id, position });
      },
    });
    closeAdd();
  };

  const confirmSwap = () => {
    if (!swapFor || !swapChoice) return;
    const out = topTen.find((x) => x.course_id === swapChoice);
    if (!out) return;
    const incoming = swapFor;
    removeCourse(out.course_id, {
      onSuccess: () => setPendingAdd({ id: incoming.id, removed: out.course_id, position: out.position }),
    });
    closeAdd();
  };

  // ---- Render pieces ----
  const adding = addAt != null;
  const titleText = adding
    ? t('topTen.sheet.slotTitle', { word: numberWord(addAt!, false), defaultValue: 'Your number {{word}}' })
    : t('topTen.sheet.title', 'Your top 10');

  const header = (
    <div style={{ padding: '0 16px 13px', borderBottom: `1px solid ${A.SOFT}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.MUTE }}>{t('topTen.sheet.kicker', 'Courses')}</div>
        <div id="add-course-title" style={{ marginTop: 4, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK }}>{titleText}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <button type="button" onClick={adding ? closeAdd : onClose} style={{ ...btnReset, fontSize: 13, fontWeight: 700, color: A.AMBER }}>
          {adding ? t('topTen.sheet.cancel', 'Cancel') : t('topTen.sheet.done', 'Done')}
        </button>
        <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 700, color: A.DIM, ...FIGS }}>
          {t('topTen.sheet.count', { count: topTen.length, defaultValue: '{{count}} of 10' })}
        </div>
      </div>
    </div>
  );

  const seg = (on: boolean): React.CSSProperties => ({
    ...btnReset, flex: 1, borderRadius: 9, padding: '7px 0', fontSize: 11.5, fontWeight: 700,
    color: on ? A.INK : A.MUTE, background: on ? TOGGLE_ON : 'transparent',
  });

  const overIndex = overId ? topTen.findIndex((c) => c.course_id === overId) : -1;
  const showDrop = !!activeId && !!overId && overId !== activeId && overIndex !== -1;

  const listBody = (
    <>
      <div style={{ margin: '12px 16px 0', background: TOGGLE_BG, borderRadius: 11, padding: 3, display: 'flex' }}>
        <button type="button" style={seg(hasPins)} onClick={goMine}>{t('topTen.sheet.myOrder', 'My order')}</button>
        <button type="button" style={seg(!hasPins)} onClick={() => { if (hasPins) setConfirmAuto(true); }}>{t('topTen.sheet.autoByRating', 'Auto by rating')}</button>
      </div>
      {confirmAuto && (
        <div style={{ margin: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: A.BODY, lineHeight: 1.45 }}>
            {t('topTen.sheet.autoConfirm', 'Let your ratings sort the list? Your own order will be discarded.')}
          </span>
          <button type="button" onClick={() => setConfirmAuto(false)} style={{ ...btnReset, fontSize: 12, fontWeight: 700, color: A.MUTE }}>{t('topTen.sheet.cancel', 'Cancel')}</button>
          <button type="button" onClick={goAuto} style={{ ...btnReset, fontSize: 12, fontWeight: 700, color: A.INK }}>{t('topTen.sheet.autoConfirmYes', 'Sort by rating')}</button>
        </div>
      )}
      <div style={{ padding: '9px 16px 0', fontSize: 11, fontWeight: 600, color: A.DIM, lineHeight: 1.45 }}>
        {t('topTen.sheet.hint', 'Drag to reorder. Tap a number to fill it.')}
      </div>

      <div style={{ padding: '4px 16px 0' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveId(String(e.active.id))}
          onDragOver={(e) => setOverId(e.over ? String(e.over.id) : null)}
          onDragCancel={() => { setActiveId(null); setOverId(null); }}
          onDragEnd={(e) => { setActiveId(null); setOverId(null); handleDragEnd(e); }}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={topTen.map((c) => c.course_id)} strategy={verticalListSortingStrategy}>
            {topTen.map((c, i) => (
              <React.Fragment key={c.course_id}>
                <SortableRow
                  course={c}
                  first={i === 0}
                  rank={rankOf(c.course_id)}
                  golfers={community[c.course_id] ?? null}
                  onRemove={(id) => removeCourse(id)}
                  onRate={rate}
                  isRemoving={isRemoving}
                />
                {showDrop && i === overIndex && (
                  <div style={{ margin: '2px 0 0 39px', fontSize: 10.5, fontWeight: 700, color: A.AMBER }}>
                    {t('topTen.sheet.dropHere', { word: numberWord(overIndex + 1, false), defaultValue: 'Drop here to make it your number {{word}}' })}
                  </div>
                )}
              </React.Fragment>
            ))}
          </SortableContext>
        </DndContext>

        {emptyPositions.map((p, i) => (
          <button key={`slot-${p}`} type="button" onClick={() => setAddAt(p)}
            style={{ ...btnReset, width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: topTen.length > 0 || i > 0 ? `1px solid ${A.SOFT}` : 'none', textAlign: 'left' }}>
            <span style={{ width: 29, textAlign: 'right', flexShrink: 0, fontSize: 13, fontWeight: 700, color: A.DIM, ...FIGS }}>{p}</span>
            <span style={{ width: 46, height: 36, borderRadius: 8, border: `1px dashed ${SLOT_DASH}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: A.DIM, flexShrink: 0 }}>+</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: A.DIM }}>
              {i === 0 ? t('topTen.sheet.slotFirst', { word: numberWord(p, false), defaultValue: 'Add your number {{word}}' }) : t('topTen.sheet.slotRest', 'Add a course')}
            </span>
          </button>
        ))}
      </div>
    </>
  );

  const pickRow = (c: PickCourse, i: number) => {
    const a = activityById.get(c.id);
    const score = a?.has_rating && a.rating_value != null ? Number(a.rating_value) : null;
    const line = [
      regionOf(c),
      formatListRank(rankOf(c.id)),
      score != null ? t('topTen.sheet.you', { score: score.toFixed(1), defaultValue: 'You {{score}}' }) : t('topTen.sheet.notRated', 'Not rated yet'),
    ].filter(Boolean).join(' · ');
    return (
      <button key={c.id} type="button" onClick={() => pick(c)}
        style={{ ...btnReset, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i > 0 ? `1px solid ${A.SOFT}` : 'none' }}>
        <CourseImageFallback courseId={c.id} courseName={c.name} imageUrl={c.thumbnail_image ?? null} style={{ width: 38, height: 30, borderRadius: 7, flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: A.INK, ...ellipsis }}>{c.name}</span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, fontWeight: 600, color: A.DIM, ...ellipsis, ...FIGS }}>{line}</span>
        </span>
        <span style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${A.HAIRLINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: A.MUTE, flexShrink: 0 }}>+</span>
      </button>
    );
  };

  const heading = (text: string) => (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.DIM, marginBottom: 4 }}>{text}</div>
  );

  // Full at ten: offer positions eight, nine and ten first; the member decides.
  const swapRows = swapAll ? topTen : topTen.filter((c) => c.position >= 8);
  const swapBlock = swapFor && (
    <div style={{ margin: '14px 16px 0', border: `1px solid ${SWAP_BORDER}`, borderRadius: 14, padding: '13px 14px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>{t('topTen.sheet.swapTitle', { name: swapFor.name, defaultValue: 'Adding {{name}}' })}</div>
      <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 600, color: A.DIM, lineHeight: 1.45 }}>
        {t('topTen.sheet.swapBody', 'Your ten is full. Choose the one it replaces.')}
      </div>
      <div style={{ marginTop: 6 }}>
        {swapRows.map((c, i) => {
          const on = swapChoice === c.course_id;
          return (
            <button key={c.course_id} type="button" onClick={() => setSwapChoice(c.course_id)}
              style={{ ...btnReset, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i > 0 ? `1px solid ${A.SOFT}` : 'none' }}>
              <span style={{ width: 15, textAlign: 'right', flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: A.DIM, ...FIGS }}>{c.position}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: A.INK, ...ellipsis }}>{c.name}</span>
              {c.rating != null && <span style={{ fontSize: 12.5, fontWeight: 700, color: A.MUTE, ...FIGS }}>{c.rating.toFixed(1)}</span>}
              <span aria-hidden style={{ width: 19, height: 19, borderRadius: '50%', flexShrink: 0, border: `1px solid ${on ? A.AMBER : A.HAIRLINE}`, background: on ? A.AMBER : 'transparent' }} />
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!swapAll ? (
          <button type="button" onClick={() => setSwapAll(true)} style={{ ...btnReset, fontSize: 11.5, fontWeight: 600, color: A.MUTE }}>
            {t('topTen.sheet.swapOther', 'Choose another position')}
          </button>
        ) : <span />}
        <button type="button" disabled={!swapChoice} onClick={confirmSwap}
          style={{ ...btnReset, fontSize: 13, fontWeight: 700, color: swapChoice ? A.INK : A.DIM }}>
          {t('topTen.sheet.swapConfirm', 'Replace')}
        </button>
      </div>
    </div>
  );

  const addBody = (
    <>
      {swapBlock}
      <div style={{ margin: '13px 16px 0', background: FIELD_BG, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <Search size={15} color={A.DIM} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('topTen.sheet.search', 'Search courses')}
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontFamily: SANS, fontSize: 13, fontWeight: 600, color: A.INK, caretColor: A.INK }}
        />
      </div>
      {playedShown.length > 0 && (
        <div style={{ marginTop: 17, padding: '0 16px' }}>
          {heading(t('topTen.sheet.played', 'Courses you have played'))}
          {playedShown.map(pickRow)}
        </div>
      )}
      {otherHits.length > 0 && (
        <div style={{ marginTop: 17, padding: '0 16px' }}>
          {heading(t('topTen.sheet.results', 'Courses'))}
          {otherHits.map(pickRow)}
        </div>
      )}
    </>
  );

  return (
    <BottomSheet
      open
      onClose={onClose}
      zIndexBase={1400}
      ariaLabelledBy="add-course-title"
      maxHeight="85dvh"
      topRadius={18}
      grabberColor={GRAB}
      grabberRadius={99}
      grabberPadding="10px 0 14px"
      scrollBody
      style={{ border: `1px solid ${SHELL_BORDER}`, borderBottom: 'none', fontFamily: SANS }}
    >
      {header}
      {adding ? addBody : listBody}
    </BottomSheet>
  );
};
