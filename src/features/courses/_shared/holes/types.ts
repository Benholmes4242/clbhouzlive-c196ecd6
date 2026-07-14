/**
 * Source-agnostic hole model consumed by SharedHoleCard.
 * Both course RPC (rounds) and tournament RPC (players) flatten into this
 * shape; the surface supplies countLabel to label the count honestly.
 */
export interface SharedHoleDistribution {
  ace: number;
  albatross: number;
  eagle: number;
  birdie: number;
  par: number;
  bogey: number;
  double: number;
}

export interface SharedHole {
  hole_no: number;
  par: number;
  yards: number | null;
  stroke_index: number | null;
  rounds: number;
  avg_to_par: number;
  avg_gross: number;
  dist: SharedHoleDistribution;
}
