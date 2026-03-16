// ActorSelector — Personal / business avatar pill selector
// Dark-mode explicit styling for Post Studio context

import React, { useEffect, useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { AMBER, AMBER_GHOST } from '../tokens';

interface BusinessAccount {
  id: string;
  name: string;
  logo_url: string | null;
}

export function ActorSelector() {
  const { state, setActor } = usePostStudioContext();
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('You');

  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('profile_photo_url, display_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.profile_photo_url) setUserAvatar(profile.profile_photo_url);
      if (profile?.display_name) setUserName(profile.display_name.slice(0, 10));

      const { data: memberships } = await supabase
        .from('business_members')
        .select('business_id, business_accounts(id, name, logo_url)')
        .eq('user_profile_id', user.id);

      if (memberships) {
        const biz = memberships
          .map((m) => {
            const ba = m.business_accounts as unknown as BusinessAccount | null;
            return ba ? { id: ba.id, name: ba.name, logo_url: ba.logo_url } : null;
          })
          .filter((b): b is BusinessAccount => b !== null);
        setBusinesses(biz);
      }
    };
    fetchBusinesses();
  }, []);

  if (businesses.length === 0) return null;

  const activeStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: `1.5px solid ${AMBER}`,
    color: 'rgba(255,255,255,0.92)',
  };

  const inactiveStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: 'rgba(255,255,255,0.55)',
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-4 scrollbar-hide">
      {/* Personal */}
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

      {/* Business accounts */}
      {businesses.map((biz) => {
        const isActive = state.actorType === 'business' && state.actorId === biz.id;
        return (
          <button
            key={biz.id}
            onClick={() => setActor('business', biz.id)}
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all min-h-[44px]"
            style={isActive ? activeStyle : inactiveStyle}
          >
            <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
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
