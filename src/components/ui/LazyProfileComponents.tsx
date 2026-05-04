// Lazy-loaded components for ProfilePage performance optimization
import { lazy } from 'react';

// Lazy load heavy profile components to improve initial page load
export const LazyPostsTabContent = lazy(() => import('@/components/posts-tab/PostsTabContent'));
export const LazyProfileCoursesTab = lazy(() => 
  import('@/components/profile/ProfileCoursesTab').then(m => ({ default: m.ProfileCoursesTab }))
);

// LazyHandicapSection removed — handicap is now a top-level page (/handicap).
export const LazyProfileSectionCarousel = lazy(() => import('@/components/profile/ProfileSectionCarousel'));
export const LazyLatestHighlights = lazy(() => import('@/components/courses/highlights/LatestHighlights'));
// Temporarily disabled due to type conflicts during media system migration
// TODO: Fix LocalMediaItem vs MediaItem type conflicts in these components
export const LazyImmersiveProfileModal = () => null;
export const LazyMediaManagerModal = () => null;
export const LazyCompareProgressModal = lazy(() => import('@/components/profile/CompareProgressModal'));

// Loading component for lazy components
export const ProfileComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);