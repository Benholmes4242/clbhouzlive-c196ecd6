/**
 * The three stableford band colours, in the ring's own order.
 *
 * These are the values the DistributionRing in StablefordCard draws with.
 * They live here so the card and its detail sheet can never disagree - the
 * shipped defect was the sheet colouring OFF DAY red while the ring drew it
 * muted grey. Literals, not var(--hcp-*), because the sheet portals outside
 * the .hcp-dark scope.
 */
export const POINTS_BANDS = {
  /** 36+ points */
  ZONE: '#55BD8B',
  /** 33-35 points */
  SOLID: '#F7931E',
  /** under 33 points - muted, exactly as the ring draws it */
  OFF: 'rgba(242,244,247,0.22)',
} as const;
