/** One client gate for tournament picks and tour-scoped records. Unknown tours
 * retain their existing behaviour; disabled tours never mount pick sessions. */
export function picksEnabledForTour(tourCode: string | null | undefined): boolean {
  return !['euro', 'pgad'].includes((tourCode ?? '').toLowerCase());
}