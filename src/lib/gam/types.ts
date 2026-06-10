// Badge catalogue
export type BadgeCategory = 'scoring' | 'handicap' | 'consistency' | 'courses' | 'community' | 'seasonal';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type BadgeKind = 'binary' | 'counter' | 'tiered' | 'streak';

export interface BadgeDefinition {
  badge_id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon_name: string;
  color_token: string;
  kind: BadgeKind;
  counter_metric: string | null;
  counter_tiers: number[] | null;
}

export interface UserBadge extends BadgeDefinition {
  counter_value: number | null;
  counter_tier: number | null;
  earned_at: string | null;
  first_seen_at?: string | null;
  is_earned: boolean;
  display_order: number;
}

// Streaks
export type StreakType = 'round_played' | 'no_up' | 'cutting' | 'counter' | 'sub_par' | 'sub_80' | 'birdie_round';
export type StreakUnit = 'week' | 'round';

export interface StreakRow {
  streak_type: StreakType;
  unit: StreakUnit;
  current_count: number;
  best_count: number;
  is_active: boolean;
  freeze_credits: number;
  current_started_at: string | null;
  best_started_at: string | null;
  best_ended_at: string | null;
  freeze_refill_at: string | null;
  /**
   * Per-streak supplementary signal returned by `get_my_streaks`.
   * Currently populated ONLY for `streak_type = 'counter'`:
   *   length-7 int array, oldest -> newest (index 6 = today),
   *   each element = number of counter rounds posted that day.
   * Null for every other streak type.
   */
  recent_activity_days: number[] | null;
}


// Course legends — 14 categories (7 stats × 2 windows)
export type LegendCategory =
  | 'lowest_gross_90d'         | 'lowest_gross_all_time'
  | 'best_score_diff_90d'      | 'best_score_diff_all_time'
  | 'most_birdies_90d'         | 'most_birdies_all_time'
  | 'best_stableford_90d'      | 'best_stableford_all_time'
  | 'most_eagles_90d'          | 'most_eagles_all_time'
  | 'most_aces_90d'            | 'most_aces_all_time'
  | 'most_albatrosses_90d'     | 'most_albatrosses_all_time';

export type LegendWindow = '90d' | 'all_time';

export interface CourseLegendRow {
  category: LegendCategory;
  rank: number;
  user_id: string;
  user_display_name: string | null;
  user_photo_url: string | null;
  user_home_club: string | null;
  /** @deprecated use user_home_club */
  home_club?: string | null;
  value: number;
  attained_at: string;
  is_self: boolean;
}

export interface UserLegendStatus {
  legend_titles: number;
  podium_positions: number;
  top_10_positions: number;
  best_course_id: string | null;
  best_course_name: string | null;
  best_category: LegendCategory | null;
  best_rank: number | null;
  best_attained_at: string | null;
}

// Rivalry
export interface RivalryCourseBreakdown {
  course_id: string;
  course_name: string;
  rounds_played: number;
  user_wins: number;
  rival_wins: number;
  ties: number;
  last_played: string;
  leader_side: 'you' | 'them' | 'tied';
}

// Notifications
export type NotificationUrgency = 'low' | 'medium' | 'high';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'bundled' | 'suppressed';

export interface NotificationRow {
  id: string;
  notification_type: string;
  template_id: string;
  template_payload: Record<string, unknown>;
  urgency: NotificationUrgency;
  status: NotificationStatus;
  created_at: string;
  sent_at: string | null;
}

// Recent unlocks (synthesised in client)
export type UnlockKind = 'badge' | 'streak_tier' | 'course_legend';

export interface RecentUnlock {
  kind: UnlockKind;
  occurred_at: string;
  icon: string;
  title: string;
  description: string;
  rarity: BadgeRarity;
  badge?: UserBadge;
  streak?: StreakRow & { tier_just_hit: number };
  legend?: { course_id: string; course_name: string; category: LegendCategory };
}
