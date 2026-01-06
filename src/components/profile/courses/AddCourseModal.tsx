/**
 * AddCourseModal - Bottom sheet for adding courses to Top 10
 * 
 * Features:
 * - Proper bottom sheet with rounded corners, drag handle, slide-up animation
 * - Fixed search: searches user's played courses directly (not all courses)
 * - Two-path flow:
 *   A) Rated courses → Add immediately
 *   B) Unrated courses → Prompt to rate first
 */
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Star, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/hooks/use-toast';

interface AddCourseModalProps {
  userId: string;
  onClose: () => void;
  existingCourseIds: string[];
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

// Position badge colors - matches Top10CourseCard carousel
const getPositionBadgeStyle = (position: number): { bg: string; text: string; shadow?: string } => {
  switch (position) {
    case 1:
      // Gold
      return { 
        bg: 'linear-gradient(145deg, #D4B35A 0%, #C9A94A 50%, #B8963C 100%)', 
        text: '#422006',
        shadow: '0 2px 8px rgba(201, 169, 74, 0.4)'
      };
    case 2:
      // Silver
      return { 
        bg: 'linear-gradient(145deg, #B8B8B8 0%, #9CA3AF 50%, #8B9299 100%)', 
        text: '#1f2937',
        shadow: '0 2px 6px rgba(156, 163, 175, 0.35)'
      };
    case 3:
      // Bronze
      return { 
        bg: 'linear-gradient(145deg, #C9956A 0%, #B8845A 50%, #A67348 100%)', 
        text: '#fff',
        shadow: '0 2px 6px rgba(184, 132, 90, 0.35)'
      };
    default:
      // Slate grey (matches Fair rating pill style)
      return { 
        bg: '#f1f5f9', 
        text: '#475569',
        shadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
      };
  }
};

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  userId,
  onClose,
  existingCourseIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'manage' | 'add'>('manage');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: userActivity = [] } = useUserCourseActivity(userId);
  const { addCourse, removeCourse, reorderTopTen, topTen, isRemoving, isReordering } = useUserTopTenCourses(userId);

  // Get all played course IDs (not already in Top 10)
  const playedCourseIds = useMemo(() => {
    return userActivity
      .filter(a => !existingCourseIds.includes(a.course_id))
      .map(a => a.course_id);
  }, [userActivity, existingCourseIds]);

  // Fetch course details for ALL played courses
  const { data: playedCourses = [], isLoading } = useQuery({
    queryKey: ['user-played-courses-for-top10', userId, playedCourseIds],
    enabled: playedCourseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .in('id', playedCourseIds);

      if (error) throw error;

      // Merge with activity data to get ratings
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

  // Filter courses by search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return playedCourses;
    
    const query = searchQuery.toLowerCase().trim();
    return playedCourses.filter(course => 
      course.name.toLowerCase().includes(query) ||
      course.country?.toLowerCase().includes(query) ||
      course.sub_country?.toLowerCase().includes(query)
    );
  }, [playedCourses, searchQuery]);

  // Separate rated and unrated courses
  const ratedCourses = useMemo(() => 
    filteredCourses.filter(c => c.has_rating).sort((a, b) => 
      (b.rating_value || 0) - (a.rating_value || 0)
    ), [filteredCourses]);
  
  const unratedCourses = useMemo(() => 
    filteredCourses.filter(c => !c.has_rating), [filteredCourses]);

  const handleAddCourse = (courseId: string) => {
    if (topTen.length >= 10) {
      toast({
        title: 'Top 10 is full',
        description: 'Remove a course to add another',
        variant: 'destructive',
      });
      return;
    }

    addCourse(courseId);
    toast({
      title: 'Course added',
      description: 'Successfully added to your Top 10',
    });
    onClose();
  };

  const handleRateFirst = (courseId: string) => {
    onClose();
    navigate(`/courses/${courseId}?action=rate`);
  };

  const handleRemoveCourse = (courseId: string) => {
    removeCourse(courseId);
    toast({
      title: 'Course removed',
      description: 'Successfully removed from your Top 10',
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...topTen];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderTopTen(newOrder.map((c, i) => ({ course_id: c.course_id, position: i + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index === topTen.length - 1) return;
    const newOrder = [...topTen];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderTopTen(newOrder.map((c, i) => ({ course_id: c.course_id, position: i + 1 })));
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      zIndexBase={1400}
      ariaLabelledBy="add-course-title"
      className="max-h-[85vh]"
    >
      {/* Header with close button */}
      <div className="flex justify-between px-5 pb-3">
        <div>
          <h2 id="add-course-title" className="text-lg font-semibold text-foreground">
            Your Personal Top 10
          </h2>
          <p className="text-sm text-muted-foreground">The very best you've played</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Tab buttons - slate styling to match ActivityFiltersSheet */}
      <div className="flex gap-2 px-5 pb-4">
        <button
          onClick={() => setActiveTab('manage')}
          className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors"
          style={{
            background: activeTab === 'manage' ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
            color: activeTab === 'manage' ? 'white' : 'var(--cm-text-secondary)',
            border: activeTab === 'manage' ? 'none' : '1px solid var(--cm-border-subtle)',
          }}
        >
          Manage ({topTen.length}/10)
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors"
          style={{
            background: activeTab === 'add' ? 'var(--cm-surface-slate)' : 'var(--cm-surface-alt)',
            color: activeTab === 'add' ? 'white' : 'var(--cm-text-secondary)',
            border: activeTab === 'add' ? 'none' : '1px solid var(--cm-border-subtle)',
          }}
        >
          Add Course
        </button>
      </div>

      {/* Search input - only show in add tab */}
      {activeTab === 'add' && (
        <div className="px-5 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              placeholder="Search your played courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              ref={searchInputRef}
            />
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-28" style={{ maxHeight: 'calc(85vh - 180px)' }}>
        {activeTab === 'manage' ? (
          /* Manage existing Top 10 */
          topTen.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your Top 10 is empty.</p>
              <p className="text-sm mt-1">Switch to "Add Course" to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topTen.map((course, index) => {
                const position = index + 1;
                const badgeStyle = getPositionBadgeStyle(position);
                
                return (
                  <div
                    key={course.course_id}
                    className="flex items-center gap-3 p-3 bg-card/50 rounded-xl border border-border/50"
                  >
                    {/* Position badge - gold/silver/bronze/slate */}
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: badgeStyle.bg,
                        boxShadow: badgeStyle.shadow,
                      }}
                    >
                      <span 
                        className="text-xs font-bold"
                        style={{ color: badgeStyle.text }}
                      >
                        #{position}
                      </span>
                    </div>

                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{course.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {course.sub_country || course.country}
                      </div>
                    </div>

                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || isReordering}
                        className="p-1 rounded hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === topTen.length - 1 || isReordering}
                        className="p-1 rounded hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveCourse(course.course_id)}
                      disabled={isRemoving}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors disabled:opacity-50"
                      aria-label="Remove from Top 10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Add courses tab */
          isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading your courses...
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? 'No matching courses found in your played courses'
                : playedCourses.length === 0
                  ? "You haven't played any courses yet. Play and rate courses to add them to your Top 10."
                  : 'Start typing to search your played courses'}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Rated courses section */}
              {ratedCourses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Your rated courses
                  </h3>
                  <div className="space-y-2">
                    {ratedCourses.map((course) => (
                      <CourseRow
                        key={course.id}
                        course={course}
                        onAction={() => handleAddCourse(course.id)}
                        actionLabel="Add to Top 10"
                        actionIcon={<Plus className="w-4 h-4" />}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Unrated courses section */}
              {unratedCourses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Rate to add
                  </h3>
                  <div className="space-y-2">
                    {unratedCourses.map((course) => (
                      <CourseRow
                        key={course.id}
                        course={course}
                        onAction={() => handleRateFirst(course.id)}
                        actionLabel="Rate first"
                        actionIcon={<Star className="w-4 h-4" />}
                        isSecondary
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </BottomSheet>
  );
};

// Course row component
interface CourseRowProps {
  course: CourseWithRating;
  onAction: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  isSecondary?: boolean;
}

const CourseRow: React.FC<CourseRowProps> = ({
  course,
  onAction,
  actionLabel,
  actionIcon,
  isSecondary = false,
}) => (
  <div className="flex items-center gap-3 p-3 bg-card/50 rounded-xl border border-border/50">
    {course.thumbnail_image && (
      <img
        src={course.thumbnail_image}
        alt={course.name}
        className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
      />
    )}
    <div className="flex-1 min-w-0">
      <div className="font-medium truncate text-sm">{course.name}</div>
      <div className="text-xs text-muted-foreground truncate">
        {course.sub_country || course.country}
      </div>
      {course.has_rating && course.rating_value && (
        <div className="flex items-center gap-1 mt-0.5">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-xs text-foreground font-medium">
            {course.rating_value.toFixed(1)}
          </span>
        </div>
      )}
    </div>
    <Button
      size="sm"
      variant={isSecondary ? "outline" : "default"}
      onClick={onAction}
      className="flex-shrink-0 gap-1.5"
    >
      {actionIcon}
      <span className="hidden sm:inline">{actionLabel}</span>
    </Button>
  </div>
);
