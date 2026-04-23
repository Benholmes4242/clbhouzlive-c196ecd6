import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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

import { compareOwnRatings } from '@/lib/sortCoursesByRating';
import { annotateTies } from '@/lib/breakdown';
import MyRatingsCourseCard, {
  type MyRatingsCourseCardData,
} from './MyRatingsCourseCard';
import EditRatingModal from './EditRatingModal';
import CourseSortModeToggle, {
  type CourseSortMode,
} from './CourseSortModeToggle';
import {
  useUserPersonalRank,
  useSessionSortMode,
} from '@/hooks/useUserPersonalRank';

interface RatedCourse {
  id: string;
  rating: number;
  review: string | null;
  review_date: string;
  course_id: string;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  golf_courses: {
    id: string;
    name: string;
    country: string | null;
    sub_country: string | null;
    region: string | null;
    continent: string | null;
    global_rank: number | null;
    regional_rank: number | null;
    usa_rank: number | null;
    thumbnail_image: string | null;
  };
}

// =====================================================================
// Sortable card wrapper (only used in personal/My Order mode)
// =====================================================================
interface SortableCardProps {
  course: MyRatingsCourseCardData;
  rank: number;
  onCourseClick: (id: string) => void;
  onAddBreakdown: (id: string) => void;
}

const SortableMyRatingsCard: React.FC<SortableCardProps> = ({
  course,
  rank,
  onCourseClick,
  onAddBreakdown,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.golf_courses.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <MyRatingsCourseCard
        course={course}
        rank={rank}
        onCourseClick={onCourseClick}
        onAddBreakdown={onAddBreakdown}
        dragHandle={{
          listeners: listeners as Record<string, unknown> | undefined,
          attributes: attributes as unknown as Record<string, unknown>,
          setActivatorNodeRef,
          isDragging,
        }}
      />
    </div>
  );
};

// =====================================================================
// MAIN
// =====================================================================
const MyRatingsContent = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const viewingUsername = searchParams.get('user');
  const viewingUserId = searchParams.get('userId');
  const isViewingOwnRatings = !viewingUsername && !viewingUserId;

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useSessionSortMode(
    'my-ratings:sort-mode',
    'rating'
  );
  // Local working order for drag-and-drop in personal mode. Allows
  // optimistic updates between drop and persistence.
  const [personalOrderOverride, setPersonalOrderOverride] = useState<
    string[] | null
  >(null);
  // Track whether we've shown the "newly rated added at end" toast for
  // this session, to avoid spamming.
  const newCountToastShownFor = useRef<number | null>(null);

  const { data: viewedUserProfile } = useQuery({
    queryKey: ['user-profile', viewingUsername, viewingUserId],
    queryFn: async () => {
      if (isViewingOwnRatings) return null;

      let query = supabase
        .from('user_profiles')
        .select('id, display_name, username');

      if (viewingUsername) {
        query = query.eq('username', viewingUsername);
      } else if (viewingUserId) {
        query = query.eq('id', viewingUserId);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !isViewingOwnRatings,
  });

  const targetUserId = isViewingOwnRatings ? user?.id : viewedUserProfile?.id;
  const displayName = isViewingOwnRatings
    ? 'My'
    : viewedUserProfile?.display_name || viewedUserProfile?.username || 'User';

  // Personal-mode is only available on your OWN profile
  const personalEnabled = isViewingOwnRatings;
  const effectiveSortMode: CourseSortMode = personalEnabled ? sortMode : 'rating';

  const personalRank = useUserPersonalRank(
    personalEnabled ? targetUserId : undefined
  );

  const { data: ratedCourses = [], isLoading } = useQuery({
    queryKey: ['user-rated-courses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          id,
          rating,
          review,
          review_date,
          course_id,
          design_score,
          condition_score,
          clubhouse_score,
          facilities_score,
          golf_courses (
            id,
            name,
            country,
            sub_country,
            region,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            thumbnail_image
          )
        `)
        .eq('user_id', targetUserId)
        .order('rating', { ascending: false });

      if (error) throw error;

      const rows = (data as unknown as RatedCourse[]) || [];
      return [...rows].sort((a, b) =>
        compareOwnRatings(
          {
            course_id: a.course_id,
            rating: a.rating,
            design_score: a.design_score,
            condition_score: a.condition_score,
            clubhouse_score: a.clubhouse_score,
            facilities_score: a.facilities_score,
            review_date: a.review_date,
          },
          {
            course_id: b.course_id,
            rating: b.rating,
            design_score: b.design_score,
            condition_score: b.condition_score,
            clubhouse_score: b.clubhouse_score,
            facilities_score: b.facilities_score,
            review_date: b.review_date,
          },
          'desc'
        )
      );
    },
    enabled: !!targetUserId,
  });

  // Seed the personal-rank table the first time the user enters My Order
  // (no-op on the server if rows already exist).
  useEffect(() => {
    if (
      personalEnabled &&
      effectiveSortMode === 'personal' &&
      targetUserId &&
      !personalRank.isLoading &&
      personalRank.personalRanks.length === 0 &&
      ratedCourses.length > 0
    ) {
      personalRank.seedIfEmpty().catch((e) =>
        console.error('Failed to seed personal ranks:', e)
      );
    }
  }, [
    personalEnabled,
    effectiveSortMode,
    targetUserId,
    personalRank,
    ratedCourses.length,
  ]);

  // Build the ordered list for the current view mode.
  const orderedCourses = useMemo(() => {
    if (effectiveSortMode === 'personal' && personalEnabled) {
      // If we have a local override (post-drag, pre-refetch), respect it.
      if (personalOrderOverride) {
        const byId = new Map(
          ratedCourses.map((r) => [r.golf_courses.id, r])
        );
        const arr: RatedCourse[] = [];
        for (const id of personalOrderOverride) {
          const row = byId.get(id);
          if (row) arr.push(row);
        }
        // Append anything not in override (newly rated, unlikely)
        for (const r of ratedCourses) {
          if (!personalOrderOverride.includes(r.golf_courses.id)) arr.push(r);
        }
        return arr;
      }

      // Otherwise apply server personal_rank, mapping by golf_courses.id
      const rowsKeyedByCourseId = ratedCourses.map((r) => ({
        ...r,
        course_id: r.golf_courses.id,
      })) as Array<RatedCourse & { course_id: string }>;
      const { ordered, newCount } =
        personalRank.applyPersonalOrder(rowsKeyedByCourseId);

      if (
        newCount > 0 &&
        personalRank.personalRanks.length > 0 &&
        newCountToastShownFor.current !== newCount
      ) {
        newCountToastShownFor.current = newCount;
        toast(
          `${newCount} newly rated ${
            newCount === 1 ? 'course' : 'courses'
          } added to the end of My Order. Drag to position.`
        );
      }

      return ordered as RatedCourse[];
    }
    // Rating mode — already sorted
    return ratedCourses;
  }, [
    effectiveSortMode,
    personalEnabled,
    personalOrderOverride,
    personalRank,
    ratedCourses,
  ]);

  // Tied-above annotations only matter in rating mode. In personal mode
  // the user has chosen the order so the explanation is moot.
  const annotatedCourses = useMemo(() => {
    if (effectiveSortMode === 'personal') return orderedCourses;
    return annotateTies(orderedCourses as RatedCourse[]);
  }, [effectiveSortMode, orderedCourses]);

  const editingCourse = useMemo(
    () =>
      annotatedCourses.find(
        (c) => c.golf_courses.id === editingCourseId
      ),
    [annotatedCourses, editingCourseId]
  );

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleAddBreakdown = (courseId: string) => {
    setEditingCourseId(courseId);
  };

  // dnd-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = annotatedCourses.map((c) => c.golf_courses.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(ids, oldIndex, newIndex);
    setPersonalOrderOverride(next);

    personalRank
      .persistOrder(next)
      .then(() => {
        // Once the server confirms and refetches, drop the override.
        setPersonalOrderOverride(null);
      })
      .catch(() => {
        toast.error('Could not save your new order. Reverting.');
        setPersonalOrderOverride(null);
      });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isViewingOwnRatings ? 'My Ratings' : `${displayName} Ratings`}
          </h1>
        </div>
        <div className="text-center py-8 text-muted-foreground">Loading ratings...</div>
      </div>
    );
  }

  const inPersonalMode = effectiveSortMode === 'personal';
  const sortableIds = annotatedCourses.map((c) => c.golf_courses.id);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isViewingOwnRatings ? 'My Ratings' : `${displayName} Ratings`}
          </h1>
          <Badge variant="secondary" className="ml-auto">
            {annotatedCourses.length} courses rated
          </Badge>
        </div>

        {personalEnabled && annotatedCourses.length > 0 && (
          <div style={{ maxWidth: 320 }}>
            <CourseSortModeToggle
              mode={sortMode}
              onChange={(m) => {
                setSortMode(m);
                // Reset any in-flight override when switching modes
                setPersonalOrderOverride(null);
              }}
            />
          </div>
        )}

        {annotatedCourses.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: '#FFFFFF',
              border: '0.5px solid #E2E8F0',
              borderRadius: 8,
            }}
          >
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No ratings yet</h3>
            <p className="text-muted-foreground">
              {isViewingOwnRatings
                ? "Start rating courses you've played to see them here"
                : `${displayName} hasn't rated any courses yet`}
            </p>
          </div>
        ) : inPersonalMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {annotatedCourses.map((course, index) => (
                  <SortableMyRatingsCard
                    key={course.id}
                    course={course as MyRatingsCourseCardData}
                    rank={index + 1}
                    onCourseClick={handleCourseClick}
                    onAddBreakdown={handleAddBreakdown}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-3">
            {annotatedCourses.map((course, index) => (
              <MyRatingsCourseCard
                key={course.id}
                course={course as MyRatingsCourseCardData}
                rank={index + 1}
                onCourseClick={handleCourseClick}
                onAddBreakdown={handleAddBreakdown}
              />
            ))}
          </div>
        )}
      </div>

      {editingCourse && (
        <EditRatingModal
          courseId={editingCourse.golf_courses.id}
          courseName={editingCourse.golf_courses.name}
          currentRating={editingCourse.rating}
          currentReview={editingCourse.review}
          currentDesignScore={editingCourse.design_score}
          currentConditionScore={editingCourse.condition_score}
          currentClubhouseScore={editingCourse.clubhouse_score}
          currentFacilitiesScore={editingCourse.facilities_score}
          isOpen={!!editingCourseId}
          onClose={() => setEditingCourseId(null)}
        />
      )}
    </>
  );
};

export default MyRatingsContent;
