/**
 * JourneyListPage - Dedicated page for user's golf journey
 * Tabs: Played / Want to Play (Wishlist removed)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Bookmark, Trash2, Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserJourneyCourses, JourneyCourse, JourneyTab } from '@/hooks/useUserJourneyCourses';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const tabTriggerClass = cn(
  "min-h-[36px] px-4 rounded-full text-sm font-semibold transition-all active:scale-[0.97] border-0 shadow-none",
  "data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:bg-[hsl(215,16%,35%)]",
  "data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground"
);

interface JourneyCourseCardProps {
  course: JourneyCourse;
  onRemove?: () => void;
  onMarkPlayed?: () => void;
  isRemoving?: boolean;
}

const JourneyCourseCard: React.FC<JourneyCourseCardProps> = ({
  course,
  onRemove,
  onMarkPlayed,
  isRemoving,
}) => {
  const navigate = useNavigate();

  const getTop100Label = () => {
    if (!course.top100_rank) return null;
    const listLabels: Record<string, string> = {
      global: 'Global',
      'gb-i': 'GB&I',
      usa: 'USA',
      europe: 'Europe',
    };
    return `#${course.top100_rank} ${listLabels[course.top100_list || 'global'] || ''}`;
  };

  return (
    <div 
      className="flex gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      {/* Course image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
        {course.thumbnail_image ? (
          <img 
            src={course.thumbnail_image} 
            alt={course.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Flag className="h-6 w-6 text-slate-300" />
          </div>
        )}
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 truncate">{course.name}</h3>
          <p className="text-xs text-slate-500 truncate">
            {course.sub_country && `${course.sub_country}, `}
            {course.country}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Top 100 badge */}
          {course.top100_rank && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-medium">
              {getTop100Label()}
            </span>
          )}
          
          {/* Rating (for played) */}
          {course.rating && (
            <span className="text-xs text-amber-600 font-medium">
              {course.rating.toFixed(1)} ★
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
        {onMarkPlayed && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={onMarkPlayed}
          >
            <Check className="h-3 w-3 mr-1" />
            Played
          </Button>
        )}
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50"
            onClick={onRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

const JourneyListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<JourneyTab>('played');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: journeyCourses, isLoading } = useUserJourneyCourses(user?.id);

  // Remove from shortlist mutation
  const removeMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      setRemovingId(courseId);
      await supabase.from('course_shortlists').delete()
        .eq('course_id', courseId)
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      toast.success('Removed from list');
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'user-journey-courses' 
      });
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'course-personal-status' 
      });
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'top100-map-courses' 
      });
      setRemovingId(null);
    },
    onError: () => {
      toast.error('Failed to remove');
      setRemovingId(null);
    },
  });

  const courses = journeyCourses?.[activeTab] || [];

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'played':
        return 'No courses played yet. Rate a course to add it here.';
      case 'want_to_play':
        return 'Courses you want to play will appear here.';
    }
  };

  const getTabIcon = (tab: JourneyTab) => {
    switch (tab) {
      case 'played':
        return <Check className="h-4 w-4" />;
      case 'want_to_play':
        return <Bookmark className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 compact-header-offset">
        <div className="p-4 text-center">
          <p className="text-slate-600">Sign in to view your journey</p>
          <Button className="mt-4" onClick={() => navigate('/auth')}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 compact-header-offset">
      {/* Header */}
      <div className="sticky top-[calc(40px+var(--sat))] z-30 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Your Golf Journey</h1>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as JourneyTab)}>
          <TabsList className="w-full justify-start bg-transparent border-b border-slate-100 rounded-none h-auto p-0 px-4">
            <TabsTrigger value="played" className={tabTriggerClass}>
              <span className="flex items-center gap-1.5">
                {getTabIcon('played')}
                Played
                {journeyCourses?.played?.length ? (
                  <span className="text-xs text-slate-400">({journeyCourses.played.length})</span>
                ) : null}
              </span>
            </TabsTrigger>
            <TabsTrigger value="want_to_play" className={tabTriggerClass}>
              <span className="flex items-center gap-1.5">
                {getTabIcon('want_to_play')}
                Want to Play
                {journeyCourses?.want_to_play?.length ? (
                  <span className="text-xs text-slate-400">({journeyCourses.want_to_play.length})</span>
                ) : null}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">{getEmptyMessage()}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/courses')}
            >
              Explore Courses
            </Button>
          </div>
        ) : (
          courses.map((course) => (
            <JourneyCourseCard
              key={course.id}
              course={course}
              onRemove={
                activeTab !== 'played'
                  ? () => removeMutation.mutate(course.id)
                  : undefined
              }
              onMarkPlayed={
                activeTab !== 'played'
                  ? () => navigate(`/courses/${course.id}/rate`)
                  : undefined
              }
              isRemoving={removingId === course.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default JourneyListPage;
