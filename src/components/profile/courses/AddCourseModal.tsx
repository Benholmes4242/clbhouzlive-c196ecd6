/**
 * AddCourseModal - Bottom sheet for managing the Personal Top 10.
 *
 * Two tabs:
 *  - Manage: drag-to-reorder + chevrons + remove (preserves dnd-kit behavior)
 *  - Add Course: search played courses, add rated, prompt to rate unrated
 *
 * Current sheet language: 75dvh canvas sheet, no amber anywhere, CAPS eyebrows,
 * SF Pro throughout, tabular-num scores, band-coloured ratings, uniform dim ranks.
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Star, Plus, Trash2, ChevronUp, ChevronDown, Trophy, RotateCcw } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
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
import { reviewLabelColor } from '@/components/shared/ReviewGhostScore';

// ---- Canonical tokens (post-flip: no amber on this sheet) ----
const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_SUBTLE = '#94A3B8';
const BORDER = '#EDF0F3';
const PANEL = '#FFFFFF';
const TILE = '#F4F6F9';
const DANGER = '#DC2626';
const BG_SURFACE = '#F8FAFC';

interface AddCourseModalProps {
  userId: string;
  onClose: () => void;
  existingCourseIds: string[];
  /** Optional course ID to highlight at the top of the Add tab */
  preSelectedCourseId?: string;
}

interface CourseWithRating {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  thumbnail_image?: string;
  rating_value: number | null;
  has_rating: boolean;
}

// Plain tabular score - canonical replacement for the retired SerifScore.
const PlainScore: React.FC<{ value: number; size?: number; color?: string }> = ({ value, size = 13, color = INK }) => {
  const safe = Number.isFinite(value) ? value : 0;
  return (
    <span style={{
      fontSize: size,
      fontWeight: 700,
      color,
      letterSpacing: '-0.01em',
      fontVariantNumeric: 'tabular-nums lining-nums',
      fontFeatureSettings: '"kern" 1, "liga" 1, "tnum" 1',
    }}>
      {safe.toFixed(1)}
    </span>
  );
};

// ---- Sortable Manage row (Option C stacked card) ----
interface SortableItemProps {
  course: {
    course_id: string;
    name: string;
    country?: string | null;
    sub_country?: string | null;
    thumbnail_image?: string | null;
    rating?: number | string | null;
  };
  index: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (courseId: string) => void;
  isRemoving: boolean;
  isReordering: boolean;
  totalItems: number;
}

const SortableManageItem: React.FC<SortableItemProps> = ({
  course,
  index,
  onMoveUp,
  onMoveDown,
  onRemove,
  isRemoving,
  isReordering,
  totalItems,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.course_id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const position = index + 1;
  const ratingNum = typeof course.rating === 'number'
    ? course.rating
    : course.rating != null ? parseFloat(course.rating) : null;

  const stopDrag = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...dragStyle,
        background: PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: '12px 14px',
        marginBottom: 12,
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Rank numeral — uniform dim tabular figures at every position */}
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: INK_SUBTLE,
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums lining-nums',
          fontFeatureSettings: '"kern" 1, "liga" 1, "tnum" 1',
          lineHeight: 1.3,
          flexShrink: 0,
          minWidth: 18,
        }}>
          {position}
        </div>

        {/* Thumbnail — 44px squircle */}
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              width: 44,
              height: 44,
              objectFit: 'cover',
              borderRadius: '34%',
              background: TILE,
              flexShrink: 0,
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '34%',
            background: TILE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Trophy size={16} color={INK_SUBTLE} />
          </div>
        )}

        {/* Right column: name + location row */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + remove */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13.5,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}>
              {course.name}
            </div>
            <button
              onPointerDown={stopDrag}
              onClick={() => onRemove(course.course_id)}
              disabled={isRemoving}
              aria-label={`Remove ${course.name} from Top 10`}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: isRemoving ? 'not-allowed' : 'pointer',
                padding: 2,
                flexShrink: 0,
                color: INK_SUBTLE,
                opacity: isRemoving ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Location flush under name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: INK_SUBTLE,
              }}>
                {course.sub_country || course.country}
              </span>
              {ratingNum != null && (
                <>
                  <span style={{ color: INK_SUBTLE }}>·</span>
                  <PlainScore value={ratingNum} size={13} color={reviewLabelColor(ratingNum, 'light')} />
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {(() => {
                const upDisabled = index === 0 || isReordering;
                const downDisabled = index === totalItems - 1 || isReordering;
                const quiet = (disabled: boolean): React.CSSProperties => ({
                  border: 'none',
                  background: TILE,
                  borderRadius: 10,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  padding: 5,
                  color: INK,
                  opacity: disabled ? 0.35 : 1,
                  pointerEvents: disabled ? 'none' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                });
                return (
                  <>
                    <button
                      onPointerDown={stopDrag}
                      onClick={() => onMoveUp(index)}
                      disabled={upDisabled}
                      aria-label="Move up"
                      aria-disabled={upDisabled}
                      style={quiet(upDisabled)}
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      onPointerDown={stopDrag}
                      onClick={() => onMoveDown(index)}
                      disabled={downDisabled}
                      aria-label="Move down"
                      aria-disabled={downDisabled}
                      style={quiet(downDisabled)}
                    >
                      <ChevronDown size={15} />
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Add Course row (name wraps freely) ----
interface CourseRowProps {
  course: CourseWithRating;
  onAction: () => void;
  actionIcon: React.ReactNode;
  actionLabel: string;
  isAtLimit?: boolean;
  isSecondary?: boolean;
}

const CourseRow: React.FC<CourseRowProps> = ({
  course,
  onAction,
  actionIcon,
  actionLabel,
  isAtLimit = false,
  isSecondary = false,
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 16px',
    background: PANEL,
    borderBottom: `1px solid ${BORDER}`,
    opacity: isAtLimit ? 0.4 : 1,
  }}>
    {course.thumbnail_image ? (
      <img
        src={course.thumbnail_image}
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          width: 48,
          height: 48,
          objectFit: 'cover',
          borderRadius: 10,
          background: TILE,
          flexShrink: 0,
          display: 'block',
        }}
      />
    ) : (
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        background: TILE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Trophy size={18} color={INK_SUBTLE} />
      </div>
    )}

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: INK,
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
        marginBottom: 4,
        wordBreak: 'break-word',
      }}>
        {course.name}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: INK_SUBTLE,
          textTransform: 'uppercase',
        }}>
          {course.sub_country || course.country}
        </span>
        {course.has_rating && course.rating_value != null && (
          <>
            <span style={{ color: INK_SUBTLE }}>·</span>
            <PlainScore value={course.rating_value} size={13} color={reviewLabelColor(course.rating_value, 'light')} />
          </>
        )}
      </div>
    </div>

    <button
      onClick={onAction}
      disabled={isAtLimit}
      style={{
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isAtLimit
          ? TILE
          : isSecondary
            ? TILE
            : PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        cursor: isAtLimit ? 'not-allowed' : 'pointer',
        color: isAtLimit ? INK_SUBTLE : isSecondary ? INK_SOFT : INK,
        padding: 0,
        flexShrink: 0,
      }}
      aria-label={actionLabel}
    >
      {actionIcon}
    </button>
  </div>
);

import SectionHeader from '@/components/ui/SectionHeader';

// =====================================================================
export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  userId,
  onClose,
  existingCourseIds,
  preSelectedCourseId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'manage' | 'add'>(preSelectedCourseId ? 'add' : 'manage');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [sortTileDismissed, setSortTileDismissed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: userActivity = [] } = useUserCourseActivity(userId);
  const { addCourse, removeCourse, reorderTopTen, topTen, isRemoving, isReordering } = useUserTopTenCourses(userId);

  const isPreSelectedInTop10 = preSelectedCourseId ? existingCourseIds.includes(preSelectedCourseId) : false;
  const isAtLimit = topTen.length >= 10;

  // Pre-selected course details
  const { data: preSelectedCourse } = useQuery({
    queryKey: ['course', preSelectedCourseId],
    queryFn: async () => {
      if (!preSelectedCourseId) return null;
      const { data } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .eq('id', preSelectedCourseId)
        .single();
      return data;
    },
    enabled: !!preSelectedCourseId && !isPreSelectedInTop10,
  });

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

  const playedCourseIds = useMemo(() => {
    return userActivity
      .filter(a => !existingCourseIds.includes(a.course_id))
      .map(a => a.course_id);
  }, [userActivity, existingCourseIds]);

  const { data: playedCourses = [], isLoading } = useQuery({
    queryKey: ['user-played-courses-for-top10', userId, playedCourseIds],
    enabled: playedCourseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .in('id', playedCourseIds);
      if (error) throw error;
      return (data || []).map(course => {
        const activity = userActivity.find(a => a.course_id === course.id);
        return {
          ...course,
          rating_value: activity?.rating_value ?? null,
          has_rating: activity?.has_rating ?? false,
        } as CourseWithRating;
      });
    },
    staleTime: 60_000,
  });

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return playedCourses;
    const query = searchQuery.toLowerCase().trim();
    return playedCourses.filter(course =>
      course.name.toLowerCase().includes(query) ||
      course.country?.toLowerCase().includes(query) ||
      course.sub_country?.toLowerCase().includes(query),
    );
  }, [playedCourses, searchQuery]);

  const ratedCourses = useMemo(() =>
    filteredCourses.filter(c => c.has_rating).sort((a, b) =>
      (b.rating_value || 0) - (a.rating_value || 0),
    ), [filteredCourses]);

  const unratedCourses = useMemo(() =>
    filteredCourses.filter(c => !c.has_rating), [filteredCourses]);

  const handleAddCourse = (courseId: string) => {
    if (topTen.length >= 10) {
      toast.error('Top 10 is full', { description: 'Remove a course to add another' });
      return;
    }
    addCourse(courseId);
    toast.success('Course added');
  };

  const handleRateFirst = (courseId: string) => {
    onClose();
    navigate(`/courses/${courseId}?action=rate`);
  };

  const handleRemoveCourse = (courseId: string) => {
    const course = topTen.find(c => c.course_id === courseId);
    removeCourse(courseId);
    toast.success('Course removed', { description: course?.is_pinned ? 'Removed from your Top 10' : 'Course excluded from auto-population' });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...topTen];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderTopTen(newOrder.map((c, i) => ({
      course_id: c.course_id,
      position: i + 1,
      is_pinned: c.is_pinned || (c.position !== i + 1),
    })));
  };

  const handleMoveDown = (index: number) => {
    if (index === topTen.length - 1) return;
    const newOrder = [...topTen];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderTopTen(newOrder.map((c, i) => ({
      course_id: c.course_id,
      position: i + 1,
      is_pinned: c.is_pinned || (c.position !== i + 1),
    })));
  };

  // Reset preserves the actual delete + invalidate + onClose mechanism (Decision 2)
  const handleResetToAutoSort = async () => {
    if (!userId) return;
    setIsResetting(true);
    try {
      await supabase.from('user_top_ten_courses').delete().eq('user_id', userId);
      await supabase.from('user_top10_exclusions').delete().eq('user_id', userId);
      await queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses'], refetchType: 'all' });
      toast.success('Reset complete', { description: 'Your Top 10 now shows your highest-rated courses' });
      setShowResetConfirm(false);
      onClose();
    } catch (err) {
      toast.error('Error', { description: 'Failed to reset. Please try again.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      zIndexBase={1400}
      ariaLabelledBy="add-course-title"
      variant="light"
      maxHeight="90dvh"
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        background: BG_SURFACE,
      }}
    >
      {/* Flex column shell — header/status/tabs/search are natural height; scroll fills rest */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: BG_SURFACE,
      }}>
        {/* Canonical Dispatch sheet header */}
        <SheetHeader
          eyebrow="YOUR COURSES"
          title={<span id="add-course-title">Personal Top 10</span>}
          onClose={onClose}
          borderBottom={false}
        />

        {/* 10 / 10 status line */}
        {topTen.length === 10 && (
          <div style={{
            padding: '4px 16px 10px',
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            color: INK_SUBTLE,
          }}>
            <span style={{ color: INK, fontWeight: 700 }}>10 / 10 list complete</span>
            <span style={{ color: INK_SUBTLE }}>·</span>
            <span>Remove one to add another</span>
          </div>
        )}

        {/* Tab strip */}
        <div style={{
          display: 'flex',
          gap: 24,
          padding: '0 16px',
          borderBottom: `1px solid ${BORDER}`,
        }}>
          {(['manage', 'add'] as const).map(tab => {
            const isActive = activeTab === tab;
            const label = tab === 'manage' ? 'Manage' : 'Add Course';
            const count = tab === 'manage' ? topTen.length : null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: '8px 0',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  minHeight: 44,
                }}
              >
                <span style={{
                  fontSize: 14,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? INK : INK_SUBTLE,
                  letterSpacing: '-0.01em',
                  display: 'inline-block',
                  paddingBottom: 8,
                  marginBottom: -1,
                  borderBottom: isActive ? `2px solid ${INK}` : '2px solid transparent',
                }}>
                  {label}
                </span>
                {count !== null && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? INK_SOFT : INK_SUBTLE,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>


        {/* Search input — only on Add tab, natural height */}
        {activeTab === 'add' && (
          <div style={{ padding: '12px 16px 4px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: searchQuery ? INK : INK_SUBTLE,
                  transition: 'color 150ms',
                }}
              />
              <input
                ref={searchInputRef}
                placeholder="Search your played courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 44,
                  paddingLeft: 40,
                  paddingRight: 16,
                  fontSize: 14,
                  borderRadius: 12,
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                  color: INK,
                  caretColor: INK,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = INK;
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Scroll container — fills remaining vertical space */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
          willChange: 'transform',
        }}>
          {activeTab === 'manage' ? (
            topTen.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: INK_SUBTLE,
                fontSize: 14,
              }}>
                <p style={{ margin: 0, color: INK_SOFT, fontWeight: 600 }}>Your Top 10 is empty.</p>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}>Switch to "Add Course" to get started.</p>
              </div>
            ) : (
              <>
                {/* Reset feature — editorial styling, behavior preserved verbatim */}
                {topTen.some(c => c.is_pinned) && (
                  showResetConfirm ? (
                    <div style={{
                      margin: '12px 16px',
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${BORDER}`,
                      background: PANEL,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                      }}>
                        <div style={{ width: 3, height: 9, background: INK }} />
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.14em',
                          color: INK_SUBTLE,
                          textTransform: 'uppercase',
                        }}>
                          Reset Order
                        </span>
                      </div>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: INK,
                        lineHeight: 1.4,
                        margin: 0,
                        marginBottom: 12,
                      }}>
                        Replace your custom order with your highest-rated courses?
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleResetToAutoSort}
                          disabled={isResetting}
                          style={{
                            flex: 1,
                            minHeight: 44,
                            background: DANGER,
                            color: PANEL,
                            border: 0,
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: isResetting ? 'not-allowed' : 'pointer',
                            opacity: isResetting ? 0.5 : 1,
                          }}
                        >
                          {isResetting ? 'Resetting...' : 'Reset'}
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          style={{
                            flex: 1,
                            minHeight: 44,
                            background: PANEL,
                            color: INK,
                            border: `1px solid ${BORDER}`,
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : !sortTileDismissed ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      margin: '12px 16px',
                    }}>
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'transparent',
                          border: 0,
                          padding: 0,
                          minHeight: 44,
                          cursor: 'pointer',
                          color: INK,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <RotateCcw size={13} strokeWidth={2.25} />
                        Sort by highest rated
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSortTileDismissed(true); }}
                        aria-label="Dismiss"
                        style={{
                          width: 32,
                          height: 44,
                          flexShrink: 0,
                          border: 0,
                          background: 'transparent',
                          color: INK_SUBTLE,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <X size={16} strokeWidth={2.25} />
                      </button>
                    </div>
                  ) : null

                )}

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={topTen.map(c => c.course_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{ padding: '12px 16px' }}>

                      {topTen.map((course, index) => (
                        <SortableManageItem
                          key={course.course_id}
                          course={course}
                          index={index}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          onRemove={handleRemoveCourse}
                          isRemoving={isRemoving}
                          isReordering={isReordering}
                          totalItems={topTen.length}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )
          ) : (
            isLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: INK_SUBTLE,
                fontSize: 14,
              }}>
                Loading your courses...
              </div>
            ) : filteredCourses.length === 0 && !preSelectedCourse ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: INK_SUBTLE,
                fontSize: 14,
              }}>
                {isAtLimit && searchQuery
                  ? 'List complete · Remove a course before adding more'
                  : searchQuery
                    ? 'No matching courses found in your played courses'
                    : playedCourses.length === 0
                      ? "You haven't played any courses yet. Play and rate courses to add them to your Top 10."
                      : 'Start typing to search your played courses'}
              </div>
            ) : (
              <div>
                {/* Pre-selected course highlight */}
                {preSelectedCourse && !isPreSelectedInTop10 && (
                  <>
                    <div style={{ padding: '14px 16px 8px' }}><SectionHeader tier="standard" kicker="COURSE YOU'RE REVIEWING" /></div>
                    <CourseRow
                      course={{
                        id: preSelectedCourse.id,
                        name: preSelectedCourse.name,
                        country: preSelectedCourse.country,
                        sub_country: preSelectedCourse.sub_country,
                        thumbnail_image: preSelectedCourse.thumbnail_image,
                        rating_value: null,
                        has_rating: false,
                      }}
                      onAction={() => handleAddCourse(preSelectedCourse.id)}
                      actionIcon={<Plus size={16} strokeWidth={2.25} />}
                      actionLabel="Add to Top 10"
                      isAtLimit={isAtLimit}
                    />
                  </>
                )}

                {ratedCourses.length > 0 && (
                  <>
                    <div style={{ padding: '14px 16px 8px' }}><SectionHeader tier="standard" kicker="YOUR RATED COURSES" /></div>
                    {ratedCourses
                      .filter(c => c.id !== preSelectedCourseId)
                      .map((course) => (
                        <CourseRow
                          key={course.id}
                          course={course}
                          onAction={() => handleAddCourse(course.id)}
                          actionIcon={<Plus size={16} strokeWidth={2.25} />}
                          actionLabel="Add to Top 10"
                          isAtLimit={isAtLimit}
                        />
                      ))}
                  </>
                )}

                {unratedCourses.length > 0 && (
                  <>
                    <div style={{ padding: '14px 16px 8px' }}><SectionHeader tier="standard" kicker="RATE TO ADD" /></div>
                    {unratedCourses.map((course) => (
                      <CourseRow
                        key={course.id}
                        course={course}
                        onAction={() => handleRateFirst(course.id)}
                        actionIcon={<Star size={16} strokeWidth={2.25} />}
                        actionLabel="Rate first"
                        isSecondary
                        isAtLimit={isAtLimit}
                      />
                    ))}
                  </>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
