import React from 'react';
import { BellOff, Users, Star, AtSign } from 'lucide-react';

const INK = '#0F172A';
const INK_45 = '#64748B';
const AMBER = '#F7931E';
const AMBER_SOFT = 'rgba(247,147,30,0.10)';

type TabId = 'all' | 'friends' | 'reviews' | 'mentions' | string;

const STATES: Record<string, { icon: any; title: string; description: string }> = {
  all: {
    icon: BellOff,
    title: "You're all caught up",
    description: "New activity from friends, reviews and mentions will show up here.",
  },
  friends: {
    icon: Users,
    title: "Nothing from friends yet",
    description: "When your friends interact with you, their activity will appear here.",
  },
  reviews: {
    icon: Star,
    title: "No review activity",
    description: "Reviews on your courses and reviews from friends will land here.",
  },
  mentions: {
    icon: AtSign,
    title: "No mentions yet",
    description: "When someone mentions you in a comment or post, it will appear here.",
  },
};

interface Props {
  tab: TabId;
}

export const ActivityEmptyState: React.FC<Props> = ({ tab }) => {
  const state = STATES[tab] || STATES.all;
  const Icon = state.icon;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div
        style={{
          width: 64, height: 64, borderRadius: '34%',
          background: AMBER_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon size={26} color={AMBER} strokeWidth={2} />
      </div>
      <h3 style={{ fontSize: 15.5, fontWeight: 800, color: INK, letterSpacing: '-0.01em', margin: '0 0 4px', textAlign: 'center' }}>
        {state.title}
      </h3>
      <p style={{ fontSize: 13, color: INK_45, textAlign: 'center', maxWidth: 280, margin: 0, lineHeight: 1.5 }}>
        {state.description}
      </p>
    </div>
  );
};
