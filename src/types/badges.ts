export interface Badge {
  id: string;
  name: string;
  display_name: string;
  description: string;
  emoji: string;
  category: 'top_100_courses' | 'engagement' | 'community' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  criteria_value: number;
  criteria_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress_value: number;
  is_notified: boolean;
  created_at: string;
  badge?: Badge;
}

export interface BadgeProgress {
  badge: Badge;
  current_progress: number;
  is_earned: boolean;
  earned_at?: string;
  progress_percentage: number;
}