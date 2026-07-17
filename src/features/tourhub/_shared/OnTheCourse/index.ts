/**
 * Shared On-the-Course rail. Single source of truth for both the overview
 * hub and the tournament page. Hosts pass an explicit tournamentId; the
 * component fetches featured groups + lazy full-field tee times and joins
 * live scores off the shared leaderboard react-query cache.
 */
export { OnTheCourse } from '@/features/tourhub/overview/sections/OnTheCourse';
