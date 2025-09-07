import React, { useState, useMemo } from "react";
import { useTopTen } from "@/context/TopTenContext";
import CourseCard from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";
import { InlineTypeahead } from "@/components/InlineTypeahead";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  onOpenModal?: () => void; // optional CTA to edit
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
  const { topTen, loading, moveCourse, addCourseAtIndex } = useTopTen();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
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

  // Set up sensors for drag-and-drop (desktop and mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 8, // Start dragging after moving 8px
      }
    })
  );

  // Create sortable items
  const items = useMemo(() => topTen.map((_, i) => `slot-${i}`), [topTen]);

  const onDragStart = (e: DragStartEvent) => {
    if (String(e.active.id).startsWith("slot-")) {
      const idx = parseInt(String(e.active.id).replace("slot-", ""), 10);
      setActiveIndex(Number.isFinite(idx) ? idx : null);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveIndex(null);
    
    if (!over) return;

    // Only handle reordering within the TopTen bar
    if (String(active.id).startsWith("slot-") && String(over.id).startsWith("slot-")) {
      const from = parseInt(String(active.id).replace("slot-", ""), 10);
      const to = parseInt(String(over.id).replace("slot-", ""), 10);
      if (Number.isFinite(from) && Number.isFinite(to) && from !== to) {
        moveCourse(from, to);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            {title}
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading your top 10...</div>
        </div>
      </div>
    );
  }

  const filled = topTen.filter(Boolean).length;
  const hasAnyCourses = filled > 0;

  return (
    <section className="w-full px-4 pt-0 pb-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            {title}
            {filled > 0 && (
              <span className="text-sm text-muted-foreground ml-2">({filled}/10)</span>
            )}
          </h3>
          <div className="flex gap-2">
            {/* Edit button removed */}
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
              {/* Match exact row styling from Top 10 Rated by You section */}
              <div className="
                flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
              ">
                {topTen.map((course, index) => (
                  <TopTenSlot 
                    key={`slot-${index}`}
                    id={`slot-${index}`}
                    index={index} 
                    course={course} 
                    userId={userId}
                    isOwnProfile={isOwnProfile}
                    onOpenModal={onOpenModal}
                    onAddCourse={(selectedCourse, slotIndex) => {
                      addCourseAtIndex(selectedCourse, slotIndex);
                    }}
                    existingCourses={topTen}
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
    </section>
  );
}

// Individual slot component with drag functionality
const TopTenSlot: React.FC<{
  id: string;
  index: number;
  course?: any;
  userId?: string;
  isOwnProfile?: boolean;
  onOpenModal?: () => void;
  onAddCourse?: (course: any, index: number) => void;
  existingCourses?: any[];
}> = ({ id, index, course, userId, isOwnProfile, onOpenModal, onAddCourse, existingCourses = [] }) => {
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id,
    disabled: !isOwnProfile || isSearchMode // Disable dragging when in search mode
  });
  
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

  const getRankBadgeGradient = (position: number) => {
    switch (position) {
      case 0: return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600'; // Gold metallic
      case 1: return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500'; // Silver metallic
      case 2: return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800'; // Bronze metallic
      default: return 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30'; // Liquid glass for 4-10
    }
  };

  const getCardShadow = (position: number) => {
    return position < 3 ? 'shadow-xl shadow-black/20' : 'shadow-lg';
  };

  const handleAddCourse = (course: any) => {
    if (onAddCourse) {
      onAddCourse(course, index);
      setIsSearchMode(false);
    }
  };

  const existingCourseIds = existingCourses.filter(Boolean).map(c => c.id);

  if (!course) {
    // Empty slot with inline search
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] relative"
      >
        <div className={`w-full aspect-[4/5] relative overflow-hidden rounded-lg ${getCardShadow(index)} bg-card border border-border`}>
          {/* Top Edge Gradient Accent for Top 3 placeholders */}
          {isTopThree && (
            <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
          )}
          
          {/* Rank badge */}
          <div className="absolute top-3 left-3 z-20">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${getRankBadgeGradient(index)}
              ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
              ${isTopThree ? 'ring-1 ring-white/20' : ''}
            `}>
              <span className={`
                text-white font-medium text-sm leading-none
                ${isTopThree ? 'drop-shadow-sm' : ''}
              `}>
                {rank}
              </span>
            </div>
          </div>

          {/* Inline search or placeholder */}
          {isOwnProfile ? (
            <div className="w-full h-full pt-12">
              <InlineTypeahead
                placeholder="Search courses…"
                onPick={handleAddCourse}
                onClose={() => setIsSearchMode(false)}
                onOpenSearch={() => setIsSearchMode(true)}
                isSearchMode={isSearchMode}
                userId={userId}
                existingCourseIds={existingCourseIds}
              />
            </div>
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
      {...listeners}
      className={`shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] relative ${
        isOwnProfile ? 'cursor-grab active:cursor-grabbing touch-manipulation' : ''
      }`}
    >
      <div className={`w-full aspect-[4/5] relative overflow-hidden rounded-lg ${getCardShadow(index)}`}>
        {/* Top Edge Gradient Accent for Top 3 */}
        {isTopThree && (
          <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
        )}
        
        <CourseCard
          course={{
            id: course.id,
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
        
        {/* Premium Rank Badge - Top Left (matching Top 10 Rated position) */}
        <div className="absolute top-3 left-3 z-20">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${getRankBadgeGradient(index)}
            ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
            ${isTopThree ? 'ring-1 ring-white/20' : ''}
          `}>
            <span className={`
              text-white font-medium text-sm leading-none
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
const GhostCard: React.FC<{ course: any; index: number; userId?: string }> = ({ course, index, userId }) => {
  const isTopThree = index < 3;
  
  const getTopAccentGradient = (position: number) => {
    switch (position) {
      case 0: return 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent';
      case 1: return 'bg-gradient-to-r from-transparent via-gray-400 to-transparent';
      case 2: return 'bg-gradient-to-r from-transparent via-amber-700 to-transparent';
      default: return '';
    }
  };

  const getRankBadgeGradient = (position: number) => {
    switch (position) {
      case 0: return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600';
      case 1: return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500';
      case 2: return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800';
      default: return 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30';
    }
  };

  return (
    <div className="w-64 aspect-[4/5] relative overflow-hidden rounded-lg shadow-xl bg-card border border-border opacity-90">
      {/* Top Edge Gradient Accent for Top 3 */}
      {isTopThree && (
        <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
      )}
      
      <CourseCard
        course={{
          id: course.id,
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
          ${getRankBadgeGradient(index)}
          ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
          ${isTopThree ? 'ring-1 ring-white/20' : ''}
        `}>
          <span className={`
            text-white font-medium text-sm leading-none
            ${isTopThree ? 'drop-shadow-sm' : ''}
          `}>
            {index + 1}
          </span>
        </div>
      </div>
    </div>
  );
};