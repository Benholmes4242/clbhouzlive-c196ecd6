import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useUserTopTenCourses, TopTenCourse } from "@/hooks/useUserTopTenCourses";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import CourseCard from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";
import { CourseSearchSheet } from "@/components/courses/CourseSearchSheet";
import { useSwipeable } from "react-swipeable";
import { ChevronLeft, ChevronRight, X, GripVertical } from 'lucide-react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  onOpenModal?: () => void;
  isOwnProfile?: boolean;
  userId?: string;
  userDisplayName?: string;
};

export default function TopTenCoursesRatedByYou({
  onOpenModal,
  isOwnProfile,
  userId,
  userDisplayName,
}: Props) {
  const { user } = useSupabaseSession();
  const { 
    topTen, 
    isLoading, 
    addCourse, 
    removeCourse, 
    reorderTopTen,
    isAdding,
    isRemoving,
    isReordering 
  } = useUserTopTenCourses(userId);
  
  // Check if current user can edit this Top 10 list
  const canEdit = user?.id === userId && isOwnProfile;
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [courseToRemove, setCourseToRemove] = useState<{ course: TopTenCourse; index: number } | null>(null);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [searchSlotIndex, setSearchSlotIndex] = useState<number | undefined>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Use carousel navigation for arrow controls
  const { carouselRef, canScrollLeft, canScrollRight, scroll } = useCarouselNavigation(10);
  const [localCanScrollLeft, setLocalCanScrollLeft] = useState(false);
  const [localCanScrollRight, setLocalCanScrollRight] = useState(true);
  
  // Combined ref callback that handles both swipe and carousel functionality
  const combinedRefCallback = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    carouselRef(node);
    
    // Check scroll state after component mounts
    if (node) {
      setTimeout(() => {
        setLocalCanScrollLeft(node.scrollLeft > 0);
        setLocalCanScrollRight(node.scrollLeft < node.scrollWidth - node.clientWidth - 1);
      }, 100);
    }
  }, [carouselRef]);

  // Custom scroll function that works with this specific carousel
  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    
    if (container) {
      const scrollDistance = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
      
      // Update local scroll states after scrolling
      setTimeout(() => {
        if (container) {
          setLocalCanScrollLeft(container.scrollLeft > 0);
          setLocalCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
        }
      }, 300);
    } else {
      // Fallback to direct element selection
      const directContainer = document.querySelector('[data-testid="top-ten-carousel"]') as HTMLElement;
      if (directContainer) {
        const scrollDistance = direction === 'left' ? -300 : 300;
        directContainer.scrollBy({ left: scrollDistance, behavior: 'smooth' });
        
        setTimeout(() => {
          setLocalCanScrollLeft(directContainer.scrollLeft > 0);
          setLocalCanScrollRight(directContainer.scrollLeft < directContainer.scrollWidth - directContainer.clientWidth - 1);
        }, 300);
      }
    }
  };
  
  // Dynamic title based on profile ownership
  const getTitle = () => {
    if (isOwnProfile) {
      return "Top 10 Courses Rated by You";
    } else {
      const firstName = userDisplayName?.split(' ')[0] || 'User';
      return `Top 10 Courses Rated by ${firstName}`;
    }
  };
  
  const title = getTitle();
  
  // Update scroll states when content changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && topTen.length > 0) {
      setTimeout(() => {
        setLocalCanScrollLeft(container.scrollLeft > 0);
        setLocalCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
      }, 100);
    }
  }, [topTen]);

  // Set up sensors for drag-and-drop
  const sensors = useSensors(
    // Desktop - use mouse sensor with immediate activation
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      }
    }),
    // Mobile - use touch sensor with long-press activation
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300, // 300ms long-press
        tolerance: 10, // 10px movement tolerance
      }
    })
  );

  // Create sortable items from actual courses (not fixed 10 slots)
  const items = useMemo(() => topTen.map(c => c.course_id), [topTen]);
  
  // Pad to 10 slots for display
  const displaySlots = useMemo(() => {
    const slots: (TopTenCourse | undefined)[] = [...topTen];
    while (slots.length < 10) {
      slots.push(undefined);
    }
    return slots;
  }, [topTen]);

  const onDragStart = (e: DragStartEvent) => {
    const courseId = String(e.active.id);
    const idx = topTen.findIndex(c => c.course_id === courseId);
    setActiveIndex(idx >= 0 ? idx : null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveIndex(null);
    
    if (!over || active.id === over.id) return;

    const oldIndex = topTen.findIndex(c => c.course_id === active.id);
    const newIndex = topTen.findIndex(c => c.course_id === over.id);
    
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    
    if (!canEdit) return;

    // Reorder array and call mutation
    const reordered = arrayMove(topTen, oldIndex, newIndex);
    const updates = reordered.map((course, idx) => ({
      course_id: course.course_id,
      position: idx + 1,
      is_pinned: course.is_pinned || (course.position !== idx + 1),
    }));
    
    reorderTopTen(updates);
  };

  // Handle remove course
  const handleRemoveCourse = useCallback((course: TopTenCourse, index: number) => {
    setCourseToRemove({ course, index });
    setRemoveModalOpen(true);
  }, []);

  const confirmRemoveCourse = useCallback(async () => {
    if (!courseToRemove) return;
    
    try {
      removeCourse(courseToRemove.course.course_id);
      toast.success('Removed from your Top 10');
    } catch (error) {
      toast.error('Could not remove course. Try again.');
    } finally {
      setRemoveModalOpen(false);
      setCourseToRemove(null);
    }
  }, [courseToRemove, removeCourse]);

  // Open search sheet for specific slot
  const openCourseSearch = useCallback((slotIndex: number) => {
    setSearchSlotIndex(slotIndex);
    setSearchSheetOpen(true);
  }, []);

  // Handle course selection from sheet
  const handleCourseSelected = useCallback((course: any) => {
    if (searchSlotIndex !== undefined) {
      addCourse(course.id);
      toast.success(`Added ${course.name} to your Top 10`);
    }
    setSearchSheetOpen(false);
    setSearchSlotIndex(undefined);
  }, [searchSlotIndex, addCourse]);

  const existingCourseIds = useMemo(() => 
    topTen.map(c => c.course_id), 
    [topTen]
  );

  // Swipe handlers for mobile carousel navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
      }
    },
    onSwipedRight: () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: false,
  });
  
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="space-y-1 mb-5">
          <h3 className="font-display text-heading-lg font-semibold leading-snug text-foreground">
            {title}
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-body-md text-muted-foreground">
            {userId ? `Loading ${isOwnProfile ? 'your' : userDisplayName?.split(' ')[0] + "'s"} top 10...` : 'Loading top 10...'}
          </div>
        </div>
      </div>
    );
  }

  const filled = topTen.length;
  const hasAnyCourses = filled > 0;

  return (
    <section className="w-full fullbleed md:mx-auto md:px-0 pt-0 pb-0" data-section="top-ten-rated">
      <div className="max-w-none md:max-w-6xl md:mx-auto">
        <div className="flex items-center justify-between mb-0 px-4 md:px-0">
          <h3 className="font-display text-heading-lg font-semibold leading-snug text-foreground">
            {title}
            {filled > 0 && (
              <span className="text-body-md text-muted-foreground ml-2">({filled}/10)</span>
            )}
          </h3>
          <div className="flex gap-2 relative z-10">
            {localCanScrollLeft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleScroll('left');
                }}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0 relative z-20 pointer-events-auto"
              >
                <ChevronLeft className="h-10 w-10 pointer-events-none" />
              </Button>
            )}
            {localCanScrollRight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleScroll('right');
                }}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0 relative z-20 pointer-events-auto"
              >
                <ChevronRight className="h-10 w-10 pointer-events-none" />
              </Button>
            )}
          </div>
        </div>


        <div className="relative mt-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={items} strategy={rectSortingStrategy}>
              {/* Edge-to-edge carousel with snap scrolling */}
              <div 
                ref={combinedRefCallback}
                {...swipeHandlers}
                data-testid="top-ten-carousel"
                className="
                  flex overflow-x-auto no-scrollbar
                  gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                  touch-pan-x
                "
              >
                {displaySlots.map((course, index) => (
                  <TopTenSlot 
                    key={course ? course.course_id : `empty-${index}`}
                    id={course?.course_id || `empty-${index}`}
                    index={index} 
                    course={course} 
                    userId={userId}
                    isOwnProfile={canEdit}
                    onOpenModal={onOpenModal}
                    onOpenSearch={() => openCourseSearch(index)}
                    onRemoveCourse={handleRemoveCourse}
                    activeIndex={activeIndex}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeIndex != null && topTen[activeIndex] ? (
                <GhostCard course={topTen[activeIndex]!} index={activeIndex} userId={userId} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Additional empty state message for non-owners */}
        {!hasAnyCourses && !isOwnProfile && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              This user hasn't created their Top 10 list yet
            </p>
          </div>
        )}
      </div>

      {/* Remove course confirmation modal */}
      <ConfirmModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={confirmRemoveCourse}
        title="Remove course?"
        message="Remove this course from your Top 10?"
        confirmText="Remove"
        confirmVariant="default"
      />

      {/* Course search sheet */}
      <CourseSearchSheet
        isOpen={searchSheetOpen}
        onClose={() => {
          setSearchSheetOpen(false);
          setSearchSlotIndex(undefined);
        }}
        onSelectCourse={handleCourseSelected}
        userId={userId}
        existingCourseIds={existingCourseIds}
        slotIndex={searchSlotIndex}
      />
    </section>
  );
}

// Individual slot component with drag functionality
const TopTenSlot: React.FC<{
  id: string;
  index: number;
  course?: TopTenCourse;
  userId?: string;
  isOwnProfile?: boolean;
  onOpenModal?: () => void;
  onOpenSearch?: () => void;
  onRemoveCourse?: (course: TopTenCourse, index: number) => void;
  activeIndex?: number | null;
}> = ({ id, index, course, userId, isOwnProfile, onOpenModal, onOpenSearch, onRemoveCourse, activeIndex }) => {
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id,
    disabled: !isOwnProfile || !course // Only allow dragging filled slots
  });

  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (course && onRemoveCourse) {
      onRemoveCourse(course, index);
    }
  }, [course, index, onRemoveCourse]);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const rank = index + 1;
  const isTopThree = index < 3;

  // Helper functions from Top 10 Rated by You section
  const getTopAccentGradient = (position: number) => {
    switch (position) {
      case 0: return 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent'; // Gold
      case 1: return 'bg-gradient-to-r from-transparent via-gray-400 to-transparent'; // Silver
      case 2: return 'bg-gradient-to-r from-transparent via-amber-700 to-transparent'; // Bronze
      default: return '';
    }
  };

  const getRankBadgeGradient = (position: number, hasCourse: boolean = false) => {
    switch (position) {
      case 0: return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600'; // Gold metallic
      case 1: return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500'; // Silver metallic
      case 2: return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800'; // Bronze metallic
      default: 
        // For positions 4-10, use liquid glass when filled, white background when empty
        return hasCourse 
          ? 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30' // Liquid glass for filled slots
          : 'bg-white border border-gray-200'; // White background for empty slots
    }
  };

  const getCardShadow = (position: number) => {
    return position < 3 ? 'shadow-xl shadow-black/20' : 'shadow-lg';
  };

  if (!course) {
    // Empty slot with inline search
    return (
      <div 
        className="shrink-0 basis-[calc(100vw/2.6)] md:basis-[calc((100%-((var(--g,1rem)*(var(--cards,4)-1))))/var(--cards,4))] relative"
      >
        <div className={`w-[calc(100vw/2.6)] md:w-full aspect-[4/5] relative overflow-hidden ${getCardShadow(index)} bg-card border border-border`}>
          {/* Top Edge Gradient Accent for Top 3 placeholders */}
          {isTopThree && (
            <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
          )}
          
          {/* Rank badge */}
          <div className="absolute top-3 left-3 z-20">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${getRankBadgeGradient(index, false)}
              ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
              ${isTopThree ? 'ring-1 ring-white/20' : ''}
            `}>
              <span className={`
                ${isTopThree ? 'text-white' : 'text-foreground'} font-medium text-body-md leading-none
                ${isTopThree ? 'drop-shadow-sm' : ''}
              `}>
                {rank}
              </span>
            </div>
          </div>

          {/* Search button or placeholder */}
          {isOwnProfile ? (
            <button
              onClick={onOpenSearch}
              className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-motion-fast ease-standard pt-12"
              aria-label={`Add course to position ${rank}`}
            >
              <svg 
                className="w-8 h-8 mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              <span className="text-xs text-center px-4">Search for a golf course</span>
            </button>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground pt-12">
              <div className="text-2xl font-bold mb-2">
                {rank}
              </div>
              <div className="text-xs text-center px-4">
                No course selected
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`shrink-0 basis-[calc(100vw/2.6)] md:basis-[calc((100%-((var(--g,1rem)*(var(--cards,4)-1))))/var(--cards,4))] relative ${
        isOwnProfile ? 'touch-manipulation' : ''
      }`}
    >
      <div className={`w-[calc(100vw/2.6)] md:w-full aspect-[4/5] relative overflow-hidden ${getCardShadow(index)} ${
        isDragging ? 'scale-[1.02] shadow-lg' : ''
      }`}>
        {/* Top Edge Gradient Accent for Top 3 */}
        {isTopThree && (
          <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
        )}
        
        {/* Remove ribbon - only show when not dragging and can edit */}
        {isOwnProfile && !isDragging && (
          <div className="absolute top-0 right-0 z-30">
            <div className="relative w-11 h-11">
              {/* Liquid glass rounded corner banner */}
              <div className="absolute top-0 right-0 w-9 h-9 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30 rounded-bl-2xl" />
              {/* X icon */}
              <button
                onClick={handleRemoveClick}
                className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center text-white hover:scale-110 transition-transform z-10"
                aria-label="Remove course from Top 10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        <CourseCard
          course={{
            id: course.course_id,
            name: course.name,
            country: course.country,
            sub_country: course.sub_country,
            region: course.region,
            thumbnail_image: course.thumbnail_image,
            global_rank: course.global_rank,
            regional_rank: course.regional_rank,
            usa_rank: course.usa_rank,
          }}
          viewContext="global"
          viewingUserId={userId}
          isReadOnly={!isOwnProfile}
          showUserRating={false}
          showAverageRating={false}
          isFromUserCoursesPage={true}
          customHeight="h-full"
          showCountryWithFlag={true}
          hideRankingBadges={true}
          mobileTextScale="small"
          mobileFlagSize="md"
          disableClick={isOwnProfile && isDragging} // Disable course click when dragging
        />
        
        {/* Drag Handle - only show for own profile, positioned inside card on left */}
        {isOwnProfile && (
          <div 
            {...listeners}
            className="absolute top-3 left-3 z-30 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
              <GripVertical className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        
        {/* Premium Rank Badge - positioned after drag handle when editing, or left when viewing */}
        <div className={`absolute top-3 z-20 ${isOwnProfile ? 'left-12' : 'left-3'}`}>
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${getRankBadgeGradient(index, true)}
            ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
            ${isTopThree ? 'ring-1 ring-white/20' : ''}
          `}>
            <span className={`
              text-white font-medium text-body-md leading-none
              ${isTopThree ? 'drop-shadow-sm' : ''}
            `}>
              {rank}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ghost card for drag overlay
const GhostCard: React.FC<{ course: TopTenCourse; index: number; userId?: string }> = ({ course, index, userId }) => {
  const isTopThree = index < 3;
  
  const getTopAccentGradient = (position: number) => {
    switch (position) {
      case 0: return 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent';
      case 1: return 'bg-gradient-to-r from-transparent via-gray-400 to-transparent';
      case 2: return 'bg-gradient-to-r from-transparent via-amber-700 to-transparent';
      default: return '';
    }
  };

  const getRankBadgeGradient = (position: number, hasCourse: boolean = false) => {
    switch (position) {
      case 0: return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600';
      case 1: return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500';
      case 2: return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800';
      default: 
        return hasCourse 
          ? 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30'
          : 'bg-white border border-gray-200';
    }
  };

  return (
    <div className="w-64 aspect-[4/5] relative overflow-hidden rounded-none shadow-xl bg-card border border-border opacity-90">
      {/* Top Edge Gradient Accent for Top 3 */}
      {isTopThree && (
        <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
      )}
      
      <CourseCard
        course={{
          id: course.course_id,
          name: course.name,
          country: course.country,
          sub_country: course.sub_country,
          region: course.region,
          thumbnail_image: course.thumbnail_image,
          global_rank: course.global_rank,
          regional_rank: course.regional_rank,
          usa_rank: course.usa_rank,
        }}
        viewContext="global"
        viewingUserId={userId}
        isReadOnly={true}
        showUserRating={false}
        showAverageRating={false}
        isFromUserCoursesPage={true}
        customHeight="h-full"
        showCountryWithFlag={true}
        hideRankingBadges={true}
        mobileTextScale="small"
        mobileFlagSize="md"
        disableClick={true}
      />
      
      {/* Premium Rank Badge */}
      <div className="absolute top-3 left-3 z-20">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${getRankBadgeGradient(index, true)}
          ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
          ${isTopThree ? 'ring-1 ring-white/20' : ''}
        `}>
          <span className={`
            text-white font-medium text-body-md leading-none
            ${isTopThree ? 'drop-shadow-sm' : ''}
          `}>
            {index + 1}
          </span>
        </div>
      </div>
    </div>
  );
};
