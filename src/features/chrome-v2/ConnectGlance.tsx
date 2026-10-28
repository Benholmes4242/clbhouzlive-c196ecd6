/** No-handicap variant has no read hooks; hide preference uses Settings' exact update and invalidations. */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { primaryCtaStyle, DeclineButton } from '@/components/profile/handicap/whs/connect/EmptyStateScreen';
import { GlanceShell, type GlanceShellProps } from './GlanceShell';

export function ConnectGlance({ onClose, anchorRef, userId }: Pick<GlanceShellProps, 'onClose' | 'anchorRef'> & { userId: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation('handicap');
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);
  const decline = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from('user_profiles').update({ hide_handicap_chip: true }).eq('id', userId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      onClose();
      toast.success('Hidden. You can turn it back on in Settings.');
    } catch {
      toast.error('Could not update. Please try again.');
      setUpdating(false);
    }
  };
  return <GlanceShell onClose={onClose} anchorRef={anchorRef} label="Connect your handicap">
    <div className="connect-glance-kicker">Official handicap index</div>
    <div className="connect-glance-headline">Connect your official handicap for stats, analytics and your circle.</div>
    <svg aria-hidden width="268" height="62" viewBox="0 0 268 62" className="connect-glance-chart">
      {[14, 31, 48].map(y => <line key={y} x1="0" x2="268" y1={y} y2={y} className="connect-glance-grid" />)}
      <path d="M0 20 L30 24 L60 18 L90 28 L120 26 L150 34 L180 31 L210 40 L240 37 L268 44" fill="none" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" className="connect-glance-path" />
    </svg>
    <div className="connect-glance-labels"><span>Your last rounds</span><span>Now</span></div>
    <div className="connect-glance-stats">
      {['Low index', 'Last round', 'vs par'].map((label, i) => <div key={label}>
        <div aria-hidden className="connect-glance-slot" style={{ width: [30, 26, 22][i] }} />
        <div className="connect-glance-stat-label">{label}</div>
      </div>)}
    </div>
    <Button aria-label="Connect your handicap" onClick={() => { onClose(); navigate('/manage/handicap'); }} style={{ ...primaryCtaStyle, marginTop: 14 }}>{t('whsConnect.intro.connectCta')}</Button>
    <DeclineButton disabled={updating} onClick={() => void decline()} style={{ marginTop: 12, height: 'auto', minHeight: 36, textAlign: 'center', lineHeight: 1.5 }} />
  </GlanceShell>;
}