import React, { useEffect, useState } from 'react';
import { X, Sparkles, Trophy, Flame, Users } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { GAM } from './tokens';

const KEY = 'gam_launch_seen_v1';

interface Props { userId: string }

const LaunchSheet: React.FC<Props> = ({ userId }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    try {
      const seen = localStorage.getItem(`${KEY}:${userId}`);
      if (!seen) setOpen(true);
    } catch {}
  }, [userId]);

  const dismiss = () => {
    try { localStorage.setItem(`${KEY}:${userId}`, '1'); } catch {}
    setOpen(false);
  };

  const Feature: React.FC<{ Icon: any; title: string; sub: string }> = ({ Icon, title, sub }) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 0' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, background: GAM.AMBER_14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={GAM.AMBER} strokeWidth={2.2} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK }}>{title}</div>
        <div style={{ fontSize: 12, color: GAM.INK_55, marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 max-h-[85dvh] rounded-t-2xl"
        style={{ background: '#FFFFFF', color: GAM.INK, fontFamily: GAM.FONT_GEIST }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: GAM.INK_10 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 12px' }}>
          <button type="button" onClick={dismiss} aria-label="Close" style={{ background: 'transparent', padding: 6 }}>
            <X size={20} color={GAM.INK_70} />
          </button>
        </div>

        <div style={{ padding: '0 24px 8px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: GAM.AMBER_14, color: GAM.AMBER,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
          }}>
            <Sparkles size={11} /> NEW
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: GAM.INK, marginTop: 14, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Your handicap, gamified.
          </h2>
          <p style={{ fontSize: 13, color: GAM.INK_55, marginTop: 8, lineHeight: 1.5 }}>
            Earn badges, climb leagues, and chase course records as you post rounds.
          </p>
        </div>

        <div style={{ padding: '8px 24px 24px' }}>
          <Feature Icon={Trophy} title="Course Legends" sub="Top 10 on every course you play. Claim titles and defend them." />
          <Feature Icon={Flame} title="Streaks & Records" sub="Seven golf streaks tracked. Freeze credits keep them alive." />
          <Feature Icon={Users} title="Pods & Leagues" sub="Weekly competition with 29 others at your level. Promote or relegate." />
        </div>

        <div style={{ padding: '0 20px 28px' }}>
          <button
            type="button"
            onClick={dismiss}
            style={{
              width: '100%', padding: '14px 16px',
              background: GAM.INK, color: '#FFFFFF',
              borderRadius: 12, fontSize: 15, fontWeight: 700,
              fontFamily: GAM.FONT_GEIST,
            }}
          >
            Let's go
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LaunchSheet;
