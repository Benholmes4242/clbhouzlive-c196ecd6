import React, { Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExploreRegionDetail } from '@/hooks/useExploreData';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';

interface CourseCardProps {
  course: any;
  onClick?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-40 text-left group"
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-alt">
        {course.thumbnail_image ? (
          <img 
            src={course.thumbnail_image} 
            alt={course.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-800 via-slate-700 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        {course.global_rank && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded-full text-xs text-white font-medium">
            #{course.global_rank}
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="text-sm font-medium text-white line-clamp-2">{course.name}</h4>
          <p className="text-xs text-white/60 mt-0.5 line-clamp-1">{course.sub_country || course.country}</p>
        </div>
      </div>
    </button>
  );
};

const ExploreRegionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useExploreRegionDetail(slug || '');

  if (isLoading) {
    return <GenericPageSkeleton />;
  }

  if (error || !data?.region) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)]">
        <div className="px-5 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <div className="px-5 py-16 text-center">
          <h2 className="text-lg font-serif text-foreground">Region not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This region doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const { region, courses } = data;
  const topCourses = courses.filter(c => c.global_rank).slice(0, 10);
  const allCourses = courses.slice(0, 30);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-page)]/95 backdrop-blur-sm border-b border-border/40">
        <div className="px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-alt transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-serif text-foreground truncate">{region.title}</h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-48 bg-gradient-to-br from-emerald-800 via-slate-700 to-slate-900">
        {region.hero_image_url && (
          <img 
            src={region.hero_image_url} 
            alt={region.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-2xl font-serif text-foreground">{region.title}</h2>
          {region.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{region.subtitle}</p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{courses.length} courses</span>
          </div>
        </div>
      </div>

      {/* Top Courses Section */}
      {topCourses.length > 0 && (
        <div className="py-6">
          <div className="px-5 mb-4">
            <h3 className="text-lg font-serif text-foreground">Top Ranked Courses</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The most acclaimed courses in {region.title}
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {topCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onClick={() => navigate(`/courses/${course.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Courses Grid */}
      <div className="py-6">
        <div className="px-5 mb-4 flex items-center justify-between">
          <h3 className="text-lg font-serif text-foreground">All Courses</h3>
          <button className="flex items-center gap-1 text-sm text-primary">
            <span>View all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allCourses.map(course => (
            <button
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="text-left group"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-alt">
                {course.thumbnail_image ? (
                  <img 
                    src={course.thumbnail_image} 
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-800/50 via-slate-700/50 to-slate-900/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {course.global_rank && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded-full text-xs text-white font-medium">
                    #{course.global_rank}
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="text-sm font-medium text-white line-clamp-2">{course.name}</h4>
                  <p className="text-xs text-white/60 mt-0.5 line-clamp-1">
                    {course.sub_country || course.country}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {allCourses.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No courses found in this region yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreRegionPage;
