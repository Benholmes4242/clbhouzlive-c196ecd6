// ActorSelector — Dark identity pill + dark bottom sheet with account + visibility sections

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, ICON_BG, DARK_TEXT, DARK_TEXT2, DARK_TEXT3 } from '../tokens';

interface BusinessAccount {
  id: string;
  name: string;
  logo_url: string | null;
}

interface ActorSelectorProps {
  compact?: boolean;
  header?: boolean;
  visibilityIcon?: string;
  visibilityLabel?: string;
  onOpenVisibility?: () => void;
}

export function ActorSelector({ compact = false, header = false, visibilityIcon, visibilityLabel, onOpenVisibility }: ActorSelectorProps) {
  const { state, setActor, setVisibility } = usePostStudioContext();
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

  // ── Compact header mode: dark identity pill ──
  if (compact) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSheetOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheetOpen(true); } }}
          className="relative flex items-center"
          style={{
            gap: 8,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24,
            padding: '6px 11px 6px 6px',
            cursor: 'pointer',
            flex: 1,
            maxWidth: 210,
          }}
        >
          <div
            className="overflow-hidden shrink-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: '34%',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {activeAvatar ? (
              <img src={activeAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {activeName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start min-w-0">
            <span className="text-[13px] font-semibold truncate" style={{ color: DARK_TEXT, maxWidth: 120 }}>
              {activeName}
            </span>
            {visibilityLabel && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenVisibility?.(); }}
                className="flex items-center gap-1"
                style={{ marginTop: 1 }}
              >
                {visibilityIcon && <span style={{ fontSize: 10 }}>{visibilityIcon}</span>}
                <span className="text-[10px]" style={{ color: DARK_TEXT3 }}>{visibilityLabel}</span>
              </button>
            )}
          </div>

          <ChevronDown className="w-[10px] h-[10px] shrink-0 ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }} />
        </div>

        {createPortal(
          <AnimatePresence>
            {sheetOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[10000]"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                  onClick={() => setSheetOpen(false)}
                />

                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 32, stiffness: 380 }}
                  className="fixed bottom-0 left-0 right-0 z-[10001] w-full flex flex-col"
                  style={{
                    background: 'rgba(16,16,16,0.99)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    borderRadius: '20px 20px 0 0',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
                    boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
                  }}
                >
                  {/* Drag handle */}
                  <div className="flex justify-center" style={{ padding: '10px 0 6px' }}>
                    <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
                  </div>

                  {/* Title + close */}
                  <div className="flex items-center justify-between px-5 pb-3">
                    <span className="text-[15px] font-bold" style={{ color: DARK_TEXT }}>Post settings</span>
                    <button
                      onClick={() => setSheetOpen(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.08)', border: 'none' }}
                    >
                      <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Posting as section */}
                  <div className="px-5 pb-2">
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.28)' }}>
                      Posting as
                    </p>
                  </div>

                  <div className="px-5 pb-4 flex flex-col gap-2">
                    <button
                      onClick={() => { setActor('personal', null); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 active:scale-[0.97] transition-transform"
                      style={{
                        borderRadius: 14,
                        background: state.actorType === 'personal' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                        border: state.actorType === 'personal' ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="w-10 h-10 overflow-hidden shrink-0" style={{ borderRadius: '34%', background: 'rgba(255,255,255,0.08)' }}>
                        {userAvatar
                          ? <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: DARK_TEXT2 }}>{userName.charAt(0)}</div>
                        }
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold" style={{ color: DARK_TEXT }}>{userName}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: DARK_TEXT3 }}>Personal profile</p>
                      </div>
                      {state.actorType === 'personal' && (
                        <Check className="w-5 h-5 shrink-0" style={{ color: 'rgba(255,255,255,0.90)' }} strokeWidth={2.5} />
                      )}
                    </button>

                    {businesses.map((biz) => {
                      const isActive = state.actorType === 'business' && state.actorId === biz.id;
                      return (
                        <button
                          key={biz.id}
                          onClick={() => { setActor('business', biz.id); setSheetOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-4 py-3.5 active:scale-[0.97] transition-transform"
                          style={{
                            borderRadius: 14,
                            background: isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                            border: isActive ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <div className="w-10 h-10 overflow-hidden shrink-0" style={{ borderRadius: '34%', background: 'rgba(255,255,255,0.08)' }}>
                            {biz.logo_url
                              ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: DARK_TEXT2 }}>{biz.name.charAt(0)}</div>
                            }
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold" style={{ color: DARK_TEXT }}>{biz.name}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: DARK_TEXT3 }}>Business profile</p>
                          </div>
                          {isActive && (
                            <Check className="w-5 h-5 shrink-0" style={{ color: 'rgba(255,255,255,0.90)' }} strokeWidth={2.5} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div className="mx-5 mb-3" style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

                  {/* Who can see this section */}
                  <div className="px-5 pb-2">
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.28)' }}>
                      Who can see this
                    </p>
                  </div>

                  <div className="px-5 pb-3 flex flex-col gap-2">
                    {([
                      { value: 'anyone' as const, label: 'Everyone', desc: 'Visible to all Clbhouz users', icon: '🌍',
                        activeBg: 'rgba(255,255,255,0.06)', activeBorder: '1px solid rgba(255,255,255,0.14)', checkColor: 'rgba(255,255,255,0.90)' },
                      { value: 'followers' as const, label: 'Friends only', desc: 'Only people who follow you', icon: '👥',
                        activeBg: 'rgba(34,197,94,0.08)', activeBorder: '1px solid rgba(34,197,94,0.25)', checkColor: '#22c55e' },
                      { value: 'private' as const, label: 'Only me', desc: 'Private — only you can see this', icon: '🔒',
                        activeBg: 'rgba(255,255,255,0.07)', activeBorder: '1px solid rgba(255,255,255,0.15)', checkColor: 'rgba(255,255,255,0.55)' },
                    ]).map((opt) => {
                      const isActive = state.visibility === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setVisibility(opt.value); }}
                          className="w-full flex items-center gap-3.5 px-4 py-3.5 active:scale-[0.97] transition-transform"
                          style={{
                            borderRadius: 14,
                            background: isActive ? opt.activeBg : 'rgba(255,255,255,0.04)',
                            border: isActive ? opt.activeBorder : '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', fontSize: 16 }}>
                            {opt.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold" style={{ color: DARK_TEXT }}>{opt.label}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: DARK_TEXT3 }}>{opt.desc}</p>
                          </div>
                          {isActive && (
                            <Check className="w-5 h-5 shrink-0" style={{ color: opt.checkColor }} strokeWidth={2.5} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary card */}
                  <div className="mx-5 mb-4" style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '11px 14px',
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
                      Posting as <span style={{ color: DARK_TEXT, fontWeight: 600 }}>{activeName}</span>
                      {' · visible to '}
                      <span style={{ color: DARK_TEXT, fontWeight: 600 }}>
                        {state.visibility === 'anyone' ? 'Everyone' : state.visibility === 'followers' ? 'Friends only' : 'Only me'}
                      </span>
                    </p>
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
