/** Reuses FullLeaderboardSheet's named-possessive / Their fallback shape. */
export const profileOwnerPossessive = (ownerFirstName?: string | null) =>
  ownerFirstName ? `${ownerFirstName}'s` : 'Their';