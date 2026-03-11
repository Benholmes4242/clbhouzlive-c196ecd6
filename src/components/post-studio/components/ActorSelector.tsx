// ActorSelector — Personal / business avatar pill selector
// Horizontal scroll row, amber ring on active

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';

interface BusinessAccount {
  id: string;
  name: string;
  logo_url: string | null;
}

export function ActorSelector() {
  const { state, setActor } = usePostStudioContext();
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Fetch businesses the user is a member of
  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user avatar
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.avatar_url) setUserAvatar(profile.avatar_url);

      // Get business memberships
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

  // Only show if user has businesses
  if (businesses.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-4 scrollbar-hide">
      {/* Personal */}
      <button
        onClick={() => setActor('personal', null)}
        className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border transition-all min-h-[44px] ${
          state.actorType === 'personal'
            ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
            : 'border-border/50 bg-muted/50'
        }`}
      >
        <div className="w-7 h-7 rounded-full bg-muted overflow-hidden shrink-0 relative">
          {userAvatar ? (
            <img src={userAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-bold">
              Y
            </div>
          )}
          {state.actorType === 'personal' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-2 h-2 text-primary-foreground" />
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-foreground">You</span>
      </button>

      {/* Business accounts */}
      {businesses.map((biz) => {
        const isActive = state.actorType === 'business' && state.actorId === biz.id;
        return (
          <button
            key={biz.id}
            onClick={() => setActor('business', biz.id)}
            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border transition-all min-h-[44px] ${
              isActive
                ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                : 'border-border/50 bg-muted/50'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-muted overflow-hidden shrink-0 relative">
              {biz.logo_url ? (
                <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-bold">
                  {biz.name.charAt(0)}
                </div>
              )}
              {isActive && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2 h-2 text-primary-foreground" />
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
              {biz.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
