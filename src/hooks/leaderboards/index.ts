// Exploration Leaderboards
export { useExplorationLeaderboard } from './useExplorationLeaderboard';
export { useUserExplorationStatus } from './useUserExplorationStatus';
export { useClubSearch } from './useClubSearch';

// Legacy countries leaderboard (separate useQuery-based hook)
export { useCountriesLeaderboard } from './useCountriesLeaderboard';
export { useCountriesByMemberCount } from './useCountriesByMemberCount';
export type { CountryByMemberCountRow } from './useCountriesByMemberCount';

// Handicap Leaderboards
export { useHandicapImprovementLeaderboard } from './useHandicapImprovementLeaderboard';
export { useLowestHandicapLeaderboard } from './useLowestHandicapLeaderboard';
export { useSeasonImprovementLeaderboard } from './useSeasonImprovementLeaderboard';
export { useUserHandicapStatus } from './useUserHandicapStatus';
export { useUserHandicapTrajectory } from './useUserHandicapTrajectory';
export type { HandicapTrajectoryPoint, UserHandicapTrajectory } from './useUserHandicapTrajectory';
export { useSimilarHandicapLeaderboard } from './useSimilarHandicapLeaderboard';
