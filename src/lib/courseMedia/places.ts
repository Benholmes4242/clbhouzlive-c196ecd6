/** One ordered place catalogue owns both tiles and tagger choices. */
import { Home, Utensils, Target, ShoppingBag, Mountain, Users, Sprout, BedDouble, MoreHorizontal } from 'lucide-react';

export const COURSE_PLACES = [
  { id: 'clubhouse', icon: Home },
  { id: 'food_drink', icon: Utensils },
  { id: 'practice', icon: Target },
  { id: 'pro_shop', icon: ShoppingBag },
  { id: 'views', icon: Mountain },
  { id: 'golfers', icon: Users },
  { id: 'conditions', icon: Sprout },
  { id: 'stay', icon: BedDouble },
  { id: 'other', icon: MoreHorizontal },
] as const;
export type CoursePlace = typeof COURSE_PLACES[number]['id'];