/**
 * Re-export usePrefetch from AppPrefetchProvider
 * 
 * This file exists to avoid static/dynamic import conflicts.
 * AppPrefetchProvider.tsx is dynamically imported in App.tsx,
 * but components like GlobalBottomNavigation need to use the prefetch hook.
 * 
 * By using this re-export, we avoid Vite's chunk analysis confusion
 * while still providing access to the prefetch context.
 */

export { usePrefetch as useAppPrefetch } from '@/providers/AppPrefetchProvider';
