/**
 * /profile-sheet-v2-test — dev harness for ProfileSheetV2.
 *
 * Mounts ProfileSheetV2 with real session-derived props, mirroring how
 * PostingAsMenu (src/components/header/PostingAsMenu.tsx) constructs
 * currentActor / profiles / onSwitchProfile / onNavigate.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import ProfileSheetV2 from './ProfileSheetV2';

export default function ProfileSheetV2TestPage() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: userProfile, isLoading } = useUserProfile(user?.id);
  const { activeActor, setActiveActor, availableActors } = useActiveActor();

  const email = user?.email || '';
  const displayName = userProfile?.display_name || user?.user_metadata?.full_name || 'User';

  const profiles = availableActors.map((a) => ({
    id: a.id,
    type: a.type as 'personal' | 'business',
    name: a.name,
    avatarUrl: a.avatarUrl,
    subtitle: a.type === 'personal' ? email : 'Business',
    username: a.type === 'personal' ? (userProfile?.username ?? null) : null,
  }));

  const currentActor = {
    type: (activeActor?.type || 'personal') as 'personal' | 'business',
    id: activeActor?.id || user?.id || '',
    name: activeActor?.name || displayName,
    avatarUrl: activeActor?.avatarUrl,
    subtitle: email,
  };

  const handleSwitchProfile = async (id: string) => {
    const actor = availableActors.find((a) => a.id === id);
    if (actor && activeActor?.id !== actor.id) {
      setActiveActor(actor);
      toast.success(`Now acting as ${actor.name}`);
    }
  };

  return (
    <div style={{ padding: 24, minHeight: '100dvh', background: '#F8FAFC' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
        ProfileSheetV2 — test harness
      </h1>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '12px 20px',
          background: '#0F172A',
          color: '#fff',
          border: 0,
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Open sheet
      </button>
      <ProfileSheetV2
        open={open}
        onClose={() => setOpen(false)}
        currentActor={currentActor}
        profiles={profiles}
        onSwitchProfile={handleSwitchProfile}
        onNavigate={(route) => { setOpen(false); navigate(route); }}
        isAdmin={false}
        isLoading={isLoading}
      />
    </div>
  );
}
