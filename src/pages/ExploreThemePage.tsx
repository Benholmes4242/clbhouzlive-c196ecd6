import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wind, Trees, Waves, Mountain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExploreThemeDetail } from '@/hooks/useExploreData';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';

const THEME_ICONS: Record<string, React.ReactNode> = {
  Wind: <Wind className="w-6 h-6" />,
  Trees: <Trees className="w-6 h-6" />,
  Waves: <Waves className="w-6 h-6" />,
  Mountain: <Mountain className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
};

const THEME_GRADIENTS: Record<string, string> = {
  links: 'from-blue-800 via-slate-700 to-slate-900',
  parkland: 'from-emerald-800 via-slate-700 to-slate-900',
  coastal: 'from-cyan-800 via-slate-700 to-slate-900',
  mountain: 'from-stone-700 via-slate-700 to-slate-900',
  'hidden-gems': 'from-purple-800 via-slate-700 to-slate-900',
};

const ExploreThemePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useExploreThemeDetail(slug || '');

  if (isLoading) {
    return <GenericPageSkeleton />;
  }

  if (error || !data?.theme) {
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
          <h2 className="text-lg font-serif text-foreground">Theme not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This theme doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const { theme, courses } = data;
  const gradient = THEME_GRADIENTS[theme.slug] || THEME_GRADIENTS.links;
  const icon = theme.icon ? THEME_ICONS[theme.icon] : <Sparkles className="w-6 h-6" />;

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
            <h1 className="text-lg font-serif text-foreground truncate">{theme.title}</h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className={cn("relative h-48 bg-gradient-to-br", gradient)}>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
              {icon}
            </div>
            <div>
              <h2 className="text-2xl font-serif text-foreground">{theme.title}</h2>
              {theme.subtitle && (
                <p className="text-sm text-muted-foreground">{theme.subtitle}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {courses.length} courses
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="py-6">
        <div className="px-5 mb-4">
          <h3 className="text-lg font-serif text-foreground">Courses</h3>
        </div>
        
        {courses.length > 0 ? (
          <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {courses.map((course: any) => (
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
                    <div className={cn("w-full h-full bg-gradient-to-br", gradient, "opacity-50")} />
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
        ) : (
          <div className="px-5 py-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-surface-alt/60 flex items-center justify-center mb-4">
              {icon}
            </div>
            <h4 className="text-base font-medium text-foreground">No courses yet</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              We're adding {theme.title.toLowerCase()} courses soon.
            </p>
            <button
              onClick={() => navigate('/discover?main=explore')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              Browse all courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreThemePage;
