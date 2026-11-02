// Owner copy across surfaces uses this module to share grammar.
/** Reuses FullLeaderboardSheet's named-possessive / Their fallback shape. */
export const profileOwnerPossessive = (ownerFirstName?: string | null) =>
  ownerFirstName ? `${ownerFirstName}'s` : 'Their';