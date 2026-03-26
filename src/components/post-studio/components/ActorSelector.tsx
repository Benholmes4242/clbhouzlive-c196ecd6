// ActorSelector — Compact toolbar avatar + profile switcher, light mode

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, ICON_BG } from '../tokens';

interface BusinessAccount {
  id: string;
  name: string;
  logo_url: string | null;
}

interface ActorSelectorProps {
  compact?: boolean;
  header?: boolean;
}

export function ActorSelector({ compact = false, header = false }: ActorSelectorProps) {
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
        if (profile?.display_name) setUserName(profile.display_name);

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

  const activeAvatar = state.actorType === 'personal'
    ? userAvatar
    : businesses.find(b => b.id === state.actorId)?.logo_url ?? null;
  const activeName = state.actorType === 'personal'
    ? userName
    : businesses.find(b => b.id === state.actorId)?.name ?? 'Business';
  const hasMultiple = businesses.length > 0;

  if (compact) {
    return (
      <>
        <button
          onClick={() => setSheetOpen(true)}
          className="relative flex items-center justify-center"
          style={{ width: 40, height: 40 }}
        >
          <div
            className="overflow-hidden shrink-0"
            style={{
              width: header ? 34 : 32,
              height: header ? 34 : 32,
              background: ICON_BG,
              border: '1.5px solid rgba(0,0,0,0.10)',
              borderRadius: '34%',
            }}
          >
            {activeAvatar ? (
              <img src={activeAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] font-bold" style={{ color: TEXT_SECONDARY }}>
                {activeName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {(hasMultiple || header) && (
            <div
              className={`absolute w-4 h-4 rounded-full flex items-center justify-center ${header ? '-bottom-0.5 -right-0.5' : '-top-0.5 -right-0.5'}`}
              style={{ background: 'rgba(15,23,42,0.90)', boxShadow: '0 1px 4px rgba(0,0,0,0.20)' }}
            >
              {header
                ? <ChevronDown className="w-2.5 h-2.5" style={{ color: '#FFFFFF' }} strokeWidth={3} />
                : <ChevronUp className="w-2.5 h-2.5" style={{ color: '#FFFFFF' }} strokeWidth={3} />
              }
            </div>
          )}
        </button>

        {createPortal(
          <AnimatePresence>
            {sheetOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[10000]"
                  style={{ background: 'rgba(0,0,0,0.25)' }}
                  onClick={() => setSheetOpen(false)}
                />

                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 32, stiffness: 380 }}
                  className="fixed bottom-0 inset-x-0 z-[10001] w-full max-w-[480px] mx-auto rounded-t-[24px] flex flex-col"
                  style={{
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.08)',
                  }}
                >
                  <div className="flex justify-center pt-2.5 pb-1">
                    <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
                  </div>

                  <div className="px-5 pb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: TEXT_TERTIARY }}>
                      Posting as
                    </p>
                  </div>

                  <div className="px-5 pb-5 flex flex-col gap-2">
                    <button
                      onClick={() => { setActor('personal', null); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl active:scale-[0.97] transition-transform"
                      style={{
                        background: state.actorType === 'personal' ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.02)',
                        border: state.actorType === 'personal' ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <div className="w-10 h-10 overflow-hidden shrink-0" style={{ background: ICON_BG, borderRadius: '34%' }}>
                        {userAvatar
                          ? <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: TEXT_SECONDARY }}>{userName}</div>
                        }
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{userName}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: TEXT_TERTIARY }}>Personal profile</p>
                      </div>
                      {state.actorType === 'personal' && (
                        <Check className="w-5 h-5 shrink-0" style={{ color: TEXT_PRIMARY }} strokeWidth={2.5} />
                      )}
                    </button>

                    {businesses.map((biz) => {
                      const isActive = state.actorType === 'business' && state.actorId === biz.id;
                      return (
                        <button
                          key={biz.id}
                          onClick={() => { setActor('business', biz.id); setSheetOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl active:scale-[0.97] transition-transform"
                          style={{
                            background: isActive ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.02)',
                            border: isActive ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.05)',
                          }}
                        >
                          <div className="w-10 h-10 overflow-hidden shrink-0" style={{ background: ICON_BG, borderRadius: '34%' }}>
                            {biz.logo_url
                              ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: TEXT_SECONDARY }}>{biz.name}</div>
                            }
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{biz.name}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: TEXT_TERTIARY }}>Business profile</p>
                          </div>
                          {isActive && (
                            <Check className="w-5 h-5 shrink-0" style={{ color: TEXT_PRIMARY }} strokeWidth={2.5} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }

  // ── Legacy pill row mode ──────────────────────────────────────────
  if (businesses.length === 0) return null;

  const activeStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.05)',
    border: '1.5px solid rgba(15,23,42,0.50)',
    color: TEXT_PRIMARY,
  };

  const inactiveStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.02)',
    border: '1px solid rgba(0,0,0,0.06)',
    color: TEXT_SECONDARY,
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-4 scrollbar-hide">
      <button
        onClick={() => setActor('personal', null)}
        className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all min-h-[44px]"
        style={state.actorType === 'personal' ? activeStyle : inactiveStyle}
      >
        <div className="w-6 h-6 overflow-hidden shrink-0" style={{ background: ICON_BG, borderRadius: '34%' }}>
          {userAvatar ? (
            <img src={userAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: TEXT_SECONDARY }}>
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
            <div className="w-6 h-6 overflow-hidden shrink-0" style={{ background: ICON_BG, borderRadius: '34%' }}>
              {biz.logo_url ? (
                <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: TEXT_SECONDARY }}>
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
