// ActorSelector — Compact toolbar avatar + profile switcher
// Single profile: avatar only. Multiple profiles: avatar + chevron, taps to switch.

import React, { useEffect, useState } from 'react';
import { ChevronUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';

interface BusinessAccount {
  id: string;
  name: string;
  logo_url: string | null;
}

interface ActorSelectorProps {
  /** When true renders the compact toolbar avatar button */
  compact?: boolean;
}

export function ActorSelector({ compact = false }: ActorSelectorProps) {
  const { state, setActor } = usePostStudioContext();
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('You');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const [profileResult, membershipsResult] = await Promise.all([
          supabase.from('user_profiles').select('profile_photo_url, display_name').eq('id', user.id).maybeSingle(),
          supabase.from('business_members').select('business_id, business_accounts(id, name, logo_url)').eq('user_profile_id', user.id),
        ]);

        if (cancelled) return;

        const profile = profileResult.data;
        if (profile?.profile_photo_url) setUserAvatar(profile.profile_photo_url);
        if (profile?.display_name) setUserName(profile.display_name.slice(0, 10));

        if (membershipsResult.data) {
          const biz = membershipsResult.data
            .map((m) => {
              const ba = m.business_accounts as unknown as BusinessAccount | null;
              return ba ? { id: ba.id, name: ba.name, logo_url: ba.logo_url } : null;
            })
            .filter((b): b is BusinessAccount => b !== null);
          setBusinesses(biz);
        }
      } catch (err) {
        console.warn('[ActorSelector]', err);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Active profile data
  const activeAvatar = state.actorType === 'personal'
    ? userAvatar
    : businesses.find(b => b.id === state.actorId)?.logo_url ?? null;
  const activeName = state.actorType === 'personal'
    ? userName
    : businesses.find(b => b.id === state.actorId)?.name ?? 'Business';
  const hasMultiple = businesses.length > 0;

  // ── Compact toolbar mode ──────────────────────────────────────────────────
  if (compact) {
    return (
      <>
        <button
          onClick={() => hasMultiple && setSheetOpen(true)}
          disabled={!hasMultiple}
          className="relative flex items-center justify-center"
          style={{ width: 40, height: 40 }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 overflow-hidden shrink-0"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: '34%' }}
          >
            {activeAvatar ? (
              <img src={activeAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-[11px] font-bold"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {activeName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Chevron badge — only when multiple profiles exist */}
          {hasMultiple && (
            <div
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.90)', boxShadow: '0 1px 4px rgba(0,0,0,0.40)' }}
            >
              <ChevronUp className="w-2.5 h-2.5" style={{ color: '#0D0D0D' }} strokeWidth={3} />
            </div>
          )}
        </button>

        {/* Profile switcher sheet */}
        <AnimatePresence>
          {sheetOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50"
                style={{ background: 'rgba(0,0,0,0.50)' }}
                onClick={() => setSheetOpen(false)}
              />

              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 380 }}
                className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] flex flex-col"
                style={{
                  background: 'rgba(13,13,13,0.99)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-2.5 pb-1">
                  <div
                    className="w-10 h-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.20)' }}
                  />
                </div>

                {/* Header */}
                <div className="px-5 pb-3">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[1.5px]"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    Posting as
                  </p>
                </div>

                {/* Options */}
                <div className="px-5 pb-5 flex flex-col gap-2">
                  {/* Personal */}
                  <button
                    onClick={() => { setActor('personal', null); setSheetOpen(false); }}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl active:scale-[0.97] transition-transform"
                    style={{
                      background: state.actorType === 'personal' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                      border: state.actorType === 'personal' ? '1px solid rgba(255,255,255,0.20)' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div
                      className="w-10 h-10 overflow-hidden shrink-0"
                      style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '34%' }}
                    >
                      {userAvatar
                        ? <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.50)' }}>{userName}</div>
                      }
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>{userName}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>Personal profile</p>
                    </div>
                    {state.actorType === 'personal' && (
                      <Check className="w-5 h-5 shrink-0" style={{ color: 'rgba(255,255,255,0.70)' }} strokeWidth={2.5} />
                    )}
                  </button>

                  {/* Business accounts */}
                  {businesses.map((biz) => {
                    const isActive = state.actorType === 'business' && state.actorId === biz.id;
                    return (
                      <button
                        key={biz.id}
                        onClick={() => { setActor('business', biz.id); setSheetOpen(false); }}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl active:scale-[0.97] transition-transform"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                          border: isActive ? '1px solid rgba(255,255,255,0.20)' : '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <div
                          className="w-10 h-10 overflow-hidden shrink-0"
                          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '34%' }}
                        >
                          {biz.logo_url
                            ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.50)' }}>{biz.name}</div>
                          }
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>{biz.name}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>Business profile</p>
                        </div>
                        {isActive && (
                          <Check className="w-5 h-5 shrink-0" style={{ color: 'rgba(255,255,255,0.70)' }} strokeWidth={2.5} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Legacy pill row mode (existing behaviour, unchanged) ──────────────────
  if (businesses.length === 0) return null;

  const activeStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.60)',
    color: 'rgba(255,255,255,0.92)',
  };

  const inactiveStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: 'rgba(255,255,255,0.55)',
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-4 scrollbar-hide">
      <button
        onClick={() => setActor('personal', null)}
        className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all min-h-[44px]"
        style={state.actorType === 'personal' ? activeStyle : inactiveStyle}
      >
        <div className="w-6 h-6 overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '34%' }}>
          {userAvatar ? (
            <img src={userAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.50)' }}>
              {userName.charAt(0)}
            </div>
          )}
        </div>
        <span className="text-[13px] font-medium">{userName}</span>
      </button>
      {businesses.map((biz) => {
        const isActive = state.actorType === 'business' && state.actorId === biz.id;
        return (
          <button
            key={biz.id}
            onClick={() => setActor('business', biz.id)}
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all min-h-[44px]"
            style={isActive ? activeStyle : inactiveStyle}
          >
            <div className="w-6 h-6 overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '34%' }}>
              {biz.logo_url ? (
                <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  {biz.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-[13px] font-medium truncate max-w-[80px]">{biz.name}</span>
          </button>
        );
      })}
    </div>
  );
}
