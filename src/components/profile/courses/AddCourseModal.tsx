/**
 * AddCourseModal — Bottom sheet for managing the Personal Top 10.
 *
 * Two tabs:
 *  - Manage: drag-to-reorder + chevrons + remove (preserves dnd-kit behavior)
 *  - Add Course: search played courses, add rated, prompt to rate unrated
 *
 * Visual language: 'The Dispatch' editorial — serif titles, amber-bar eyebrows,
 * #F8FAFC sheet shell with #FFFFFF rows, hairline dividers, podium-coloured rank badges.
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Star, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Trophy, RotateCcw } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { toast } from 'sonner';
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

// ---- Locked Dispatch tokens ----
const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_SUBTLE = '#94A3B8';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97A10';
const AMBER_WASH = 'rgba(247,147,30,0.08)';
const AMBER_BORDER = 'rgba(247,147,30,0.30)';
const BORDER = 'rgba(15,23,42,0.07)';
const BG_SURFACE = '#F8FAFC';
const FONT_SERIF = 'Georgia, "Times New Roman", serif';

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

// Position badge colors — gold/silver/bronze podium, slate for 4-10
const getPositionBadgeStyle = (position: number): { bg: string; text: string; shadow?: string } => {
  switch (position) {
    case 1:
      return {
        bg: '#C1A84C',
        text: '#FFFFFF',
        shadow: '0 2px 8px rgba(193, 168, 76, 0.4)',
      };
    case 2:
      return {
        bg: 'linear-gradient(145deg, #94A3B8 0%, #64748B 100%)',
        text: '#FFFFFF',
        shadow: '0 2px 6px rgba(100, 116, 139, 0.35)',
      };
    case 3:
      return {
        bg: 'linear-gradient(145deg, #D97706 0%, #B45309 100%)',
        text: '#FFFFFF',
        shadow: '0 2px 6px rgba(217, 119, 6, 0.35)',
      };
    default:
      return {
        bg: '#F1F5F9',
        text: '#475569',
        shadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
      };
  }
};

// Serif rating score with reduced decimal — matches Courses tab editorial language
const SerifScore: React.FC<{ value: number; size?: number }> = ({ value, size = 13 }) => {
  const safe = Number.isFinite(value) ? value : 0;
  const int = Math.floor(safe);
  const dec = Math.round((safe * 10) % 10);
  return (
    <span style={{
      fontFamily: FONT_SERIF,
      color: INK,
      lineHeight: 1,
      letterSpacing: '-0.02em',
    }}>
      <span style={{ fontSize: size, fontWeight: 900 }}>{int}</span>
      <span style={{ fontSize: size * 0.65, fontWeight: 700 }}>.{dec}</span>
    </span>
  );
};

// ---- Sortable Manage row ----
interface SortableItemProps {
  course: any;
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
  const badgeStyle = getPositionBadgeStyle(position);
  const ratingNum = typeof course.rating === 'number'
    ? course.rating
    : course.rating != null ? parseFloat(course.rating) : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...dragStyle,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        background: '#FFFFFF',
        borderBottom: `1px solid ${BORDER}`,
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {/* Drag handle — 32×44 hit target */}
      <button
        {...attributes}
        {...listeners}
        style={{
          width: 32,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 0,
          cursor: 'grab',
          color: INK_SUBTLE,
          padding: 0,
          flexShrink: 0,
          touchAction: 'none',
        }}
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} strokeWidth={2} />
      </button>

      {/* Thumbnail with podium badge overlap */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            loading="lazy"
            decoding="async"
            style={{
              width: 56,
              height: 56,
              objectFit: 'cover',
              borderRadius: 12,
              background: '#F1F5F9',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trophy size={20} color={INK_SUBTLE} />
          </div>
        )}
        <div style={{
          position: 'absolute',
          top: -4,
          left: -4,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: badgeStyle.bg,
          color: badgeStyle.text,
          boxShadow: badgeStyle.shadow,
          border: '2px solid #FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '-0.02em',
        }}>
          {position}
        </div>
      </div>

      {/* Course info — serif name + dispatch caps + serif score */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONT_SERIF,
          fontSize: 15,
          fontWeight: 700,
          color: INK,
          lineHeight: 1.25,
          marginBottom: 3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {course.name}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: INK_SUBTLE,
          textTransform: 'uppercase',
          overflow: 'hidden',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {course.sub_country || course.country}
          </span>
          {ratingNum != null && (
            <>
              <span style={{ color: '#CBD5E1' }}>·</span>
              <SerifScore value={ratingNum} size={13} />
            </>
          )}
        </div>
      </div>

      {/* Reorder chevrons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        flexShrink: 0,
      }}>
        <button
          onClick={() => onMoveUp(index)}
          disabled={index === 0 || isReordering}
          style={{
            width: 32,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 0,
            cursor: index === 0 || isReordering ? 'not-allowed' : 'pointer',
            color: INK_SUBTLE,
            opacity: index === 0 || isReordering ? 0.3 : 1,
            padding: 0,
          }}
          aria-label="Move up"
        >
          <ChevronUp size={16} strokeWidth={2.25} />
        </button>
        <button
          onClick={() => onMoveDown(index)}
          disabled={index === totalItems - 1 || isReordering}
          style={{
            width: 32,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 0,
            cursor: index === totalItems - 1 || isReordering ? 'not-allowed' : 'pointer',
            color: INK_SUBTLE,
            opacity: index === totalItems - 1 || isReordering ? 0.3 : 1,
            padding: 0,
          }}
          aria-label="Move down"
        >
          <ChevronDown size={16} strokeWidth={2.25} />
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(course.course_id)}
        disabled={isRemoving}
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 0,
          cursor: isRemoving ? 'not-allowed' : 'pointer',
          color: '#EF4444',
          opacity: isRemoving ? 0.4 : 0.7,
          padding: 0,
          flexShrink: 0,
        }}
        aria-label={`Remove ${course.name} from Top 10`}
      >
        <Trash2 size={18} strokeWidth={2} />
      </button>
    </div>
  );
};

// ---- Add Course row ----
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
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
    background: '#FFFFFF',
    borderBottom: `1px solid ${BORDER}`,
    opacity: isAtLimit ? 0.4 : 1,
  }}>
    {course.thumbnail_image ? (
      <img
        src={course.thumbnail_image}
        alt={course.name}
        loading="lazy"
        decoding="async"
        style={{
          width: 56,
          height: 56,
          objectFit: 'cover',
          borderRadius: 12,
          background: '#F1F5F9',
          flexShrink: 0,
          display: 'block',
        }}
      />
    ) : (
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        background: '#F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Trophy size={20} color={INK_SUBTLE} />
      </div>
    )}

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: FONT_SERIF,
        fontSize: 15,
        fontWeight: 700,
        color: INK,
        lineHeight: 1.25,
        marginBottom: 3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {course.name}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        color: INK_SUBTLE,
        textTransform: 'uppercase',
        overflow: 'hidden',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {course.sub_country || course.country}
        </span>
        {course.has_rating && course.rating_value != null && (
          <>
            <span style={{ color: '#CBD5E1' }}>·</span>
            <SerifScore value={course.rating_value} size={13} />
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
          ? '#F1F5F9'
          : isSecondary
            ? 'rgba(15,23,42,0.04)'
            : AMBER_WASH,
        border: `1px solid ${isAtLimit ? BORDER : isSecondary ? BORDER : AMBER_BORDER}`,
        borderRadius: 10,
        cursor: isAtLimit ? 'not-allowed' : 'pointer',
        color: isAtLimit ? INK_SUBTLE : isSecondary ? INK_SOFT : AMBER_DEEP,
        padding: 0,
        flexShrink: 0,
      }}
      aria-label={actionLabel}
    >
      {actionIcon}
    </button>
  </div>
);

// Reusable section eyebrow with amber-bar prefix
const SectionEyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    padding: '12px 20px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}>
    <div style={{ width: 3, height: 9, background: AMBER }} />
    <span style={{
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.22em',
      color: INK_SUBTLE,
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  </div>
);

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
      className="max-h-[85vh]"
    >
      {/* Flex column shell — header/status/tabs/search are natural height; scroll fills rest */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: BG_SURFACE,
      }}>
        {/* Header — editorial */}
        <div style={{ padding: '0 20px 16px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 3, height: 10, background: AMBER }} />
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.25em',
              color: INK_SUBTLE,
              textTransform: 'uppercase',
            }}>
              The Very Best You've Played
            </span>
          </div>
          <h2
            id="add-course-title"
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 26,
              fontWeight: 900,
              color: INK,
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Your Personal Top 10
          </h2>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: -4,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(15,23,42,0.05)',
              border: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: INK_SOFT,
            }}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>

        {/* 10 / 10 status line */}
        {topTen.length === 10 && (
          <div style={{
            padding: '8px 20px 12px',
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            color: INK_SUBTLE,
          }}>
            <span style={{ color: AMBER_DEEP, fontWeight: 700 }}>10 / 10 list complete</span>
            <span style={{ color: '#CBD5E1' }}>·</span>
            <span style={{ fontStyle: 'italic' }}>Remove one to add another</span>
          </div>
        )}

        {/* Tab strip */}
        <div style={{
          display: 'flex',
          gap: 24,
          padding: '0 20px',
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
                  padding: '12px 0 14px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  minHeight: 44,
                }}
              >
                <span style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: isActive ? INK : INK_SUBTLE,
                  letterSpacing: '-0.01em',
                }}>
                  {label}
                </span>
                {count !== null && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isActive ? INK_SOFT : INK_SUBTLE,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    width: 24,
                    height: 2,
                    background: AMBER,
                    borderRadius: 1,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Search input — only on Add tab, natural height */}
        {activeTab === 'add' && (
          <div style={{ padding: '12px 20px 4px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: searchQuery ? AMBER : INK_SUBTLE,
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
                  background: '#FFFFFF',
                  border: `1px solid ${BORDER}`,
                  color: INK,
                  caretColor: AMBER,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = AMBER;
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(247,147,30,0.10)';
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
                padding: '40px 20px',
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
                      margin: '12px 20px',
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${AMBER_BORDER}`,
                      background: AMBER_WASH,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                      }}>
                        <div style={{ width: 3, height: 9, background: AMBER }} />
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '0.22em',
                          color: INK_SUBTLE,
                          textTransform: 'uppercase',
                        }}>
                          Reset Order
                        </span>
                      </div>
                      <p style={{
                        fontFamily: FONT_SERIF,
                        fontSize: 14,
                        fontWeight: 400,
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
                            background: AMBER,
                            color: '#FFFFFF',
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
                            background: '#FFFFFF',
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
                  ) : (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      style={{
                        margin: '12px 20px',
                        padding: '10px 16px',
                        background: '#FFFFFF',
                        border: `1px solid ${AMBER_BORDER}`,
                        borderRadius: 10,
                        color: AMBER_DEEP,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        minHeight: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        width: 'calc(100% - 40px)',
                      }}
                    >
                      <RotateCcw size={14} strokeWidth={2.25} />
                      Sort by highest rated
                    </button>
                  )
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
                    <div>
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
                padding: '40px 20px',
                color: INK_SUBTLE,
                fontSize: 14,
              }}>
                Loading your courses...
              </div>
            ) : filteredCourses.length === 0 && !preSelectedCourse ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: INK_SUBTLE,
                fontSize: 14,
              }}>
                {searchQuery
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
                    <SectionEyebrow label="Course You're Reviewing" />
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
                    <SectionEyebrow label="Your Rated Courses" />
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
                    <SectionEyebrow label="Rate to Add" />
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
