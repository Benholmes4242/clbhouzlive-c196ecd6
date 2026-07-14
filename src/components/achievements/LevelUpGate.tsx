/**
 * LevelUpGate -- app-level foreground detector for wall level-up events.
 *
 * On mount and on every visibilitychange->visible, query the oldest
 * unseen gam_user_level_events row (kind='up') for the current user and
 * present LevelUpSheet. The sheet marks the row seen_at on present, so
 * a second foreground never re-shows the same event; the next unseen
 * row (if any) surfaces on the following visibility change.
 */

import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUnseenLevelUps } from '@/hooks/gam/useUnseenLevelUps';
import { LevelUpSheet } from './LevelUpSheet';

export const LevelUpGate: React.FC = () => {
  const { user } = useSupabaseSession();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const { data: event, refetch } = useUnseenLevelUps(userId);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const onVis = () => {
      if (!document.hidden) refetch();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, [userId, refetch]);

  if (!event || event.id === dismissedId) return null;

  return (
    <LevelUpSheet
      eventId={event.id}
      label={event.label}
      medals={event.medals}
      onClose={() => {
        setDismissedId(event.id);
        qc.invalidateQueries({ queryKey: ['gam', 'unseen-level-ups', userId] });
      }}
    />
  );
};

export default LevelUpGate;
