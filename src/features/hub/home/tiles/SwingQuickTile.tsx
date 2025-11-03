/**
 * Swing Coach Quick Upload Tile
 * Shows last uploaded swing thumbnail or fallback
 */

import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tile } from '../components/Tile';

export function SwingQuickTile() {
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const { data: lastSwing } = useQuery({
    queryKey: ['lastSwing'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('pro_ai_analyses')
        .select('id, video_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data ?? null;
    }
  });

  const pick = () => inputRef.current?.click();

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    nav('/hub/echo/swing', { state: { preselectedFileName: file.name } });
  };

  const thumbnail = lastSwing?.video_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=225&fit=crop';

  return (
    <Tile 
      title="Swing Coach" 
      subtitle="Upload for instant analysis"
      onViewAll={() => nav('/hub/echo/history?tab=swing')}
    >
      <div className="flex items-center gap-3">
        <div className="h-20 w-32 rounded-2xl overflow-hidden border border-white/12 bg-black/30 shrink-0">
          {lastSwing?.video_url ? (
            <video src={thumbnail} className="h-full w-full object-cover" muted playsInline />
          ) : (
            <img src={thumbnail} alt="Golf swing" className="h-full w-full object-cover" />
          )}
        </div>
        <button 
          type="button" 
          className="rounded-2xl px-4 h-11 border border-white/15 bg-white/08 hover:bg-white/12 text-[14px] text-white transition"
          onClick={pick}
        >
          Upload Video
        </button>
        <input ref={inputRef} type="file" accept="video/*" hidden onChange={onPick} />
      </div>
    </Tile>
  );
}
