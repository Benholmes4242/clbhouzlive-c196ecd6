import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader } from '../components/ui';
import { Activity, Users, FileText, Star, MessageCircle, UserPlus, Radio, Pause, Play, Trash2 } from 'lucide-react';

interface LiveEvent {
  id: string;
  type: 'signup' | 'post' | 'review' | 'message' | 'follow' | 'echo' | 'other';
  label: string;
  detail: string | null;
  userId: string | null;
  username: string | null;
  timestamp: string;
  isNew?: boolean;
}

const EVENT_TYPE_MAP: Record<string, LiveEvent['type']> = {
  signup_success:             'signup',
  post_published:             'post',
  review_submitted:           'review',
  message_sent:               'message',
  social_follow_toggled:      'follow',
  social_friend_request_sent: 'follow',
  echo_query:                 'echo',
};

const EVENT_LABEL_MAP: Record<string, string> = {
  signup_success:             'New user signed up',
  post_published:             'Post published',
  review_submitted:           'Course review submitted',
  message_sent:               'Message sent',
  social_follow_toggled:      'User followed someone',
  social_friend_request_sent: 'Friend request sent',
  echo_query:                 'Echo AI query',
};

const TYPE_ICON: Record<LiveEvent['type'], React.ElementType> = {
  signup:  UserPlus,
  post:    FileText,
  review:  Star,
  message: MessageCircle,
  follow:  Users,
  echo:    Activity,
  other:   Activity,
};

const TYPE_COLOR: Record<LiveEvent['type'], string> = {
  signup:  '#17C964',
  post:    '#1D6FF5',
  review:  '#F5A623',
  message: '#7C3AED',
  follow:  '#0891B2',
  echo:    '#F31260',
  other:   '#94A3B8',
};

const MAX_EVENTS = 100;

export default function LiveActivityPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const usernameCache = useRef(new Map<string, string>());
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const lookupUsername = useCallback(async (userId: string | null): Promise<string | null> => {
    if (!userId) return null;
    if (usernameCache.current.has(userId)) return usernameCache.current.get(userId)!;
    const { data } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();
    const name = data?.username ?? null;
    if (name) usernameCache.current.set(userId, name);
    return name;
  }, []);

  const mapRow = useCallback(async (row: any): Promise<LiveEvent> => {
    const username = await lookupUsername(row.user_id);
    return {
      id: row.id,
      type: EVENT_TYPE_MAP[row.name] ?? 'other',
      label: EVENT_LABEL_MAP[row.name] ?? row.name,
      detail: null,
      userId: row.user_id,
      username,
      timestamp: row.created_at,
    };
  }, [lookupUsername]);

  // Initial fetch
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('analytics_events')
        .select('id, name, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) {
        const mapped = await Promise.all(data.map(mapRow));
        setEvents(mapped);
      }
      setLoading(false);
    })();
  }, [mapRow]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-live-events')
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'analytics_events' },
        async (payload: any) => {
          if (pausedRef.current) return;
          const row = payload.new;
          const evt = await mapRow(row);
          evt.isNew = true;
          setEvents(prev => [evt, ...prev].slice(0, MAX_EVENTS));
          // Clear flash after 1.5s
          setTimeout(() => {
            setEvents(prev => prev.map(e => e.id === evt.id ? { ...e, isNew: false } : e));
          }, 1500);
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [mapRow]);

  const lastHourCount = events.filter(e => {
    return new Date(e.timestamp).getTime() > Date.now() - 3600_000;
  }).length;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <AdminPageHeader
        title={
          <span className="flex items-center gap-2">
            Live Activity
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: '#F0FDF4', fontSize: 11, fontWeight: 600, color: '#16A34A' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16A34A' }} />
              Live
            </span>
          </span>
        }
        description={`${lastHourCount} events in last hour`}
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPaused(p => !p)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
          style={{ fontSize: 12, fontWeight: 600, background: paused ? '#FEF2F2' : '#F0FDF4', color: paused ? '#DC2626' : '#16A34A', border: '1px solid', borderColor: paused ? '#FECACA' : '#BBF7D0' }}
        >
          {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => setEvents([])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
          style={{ fontSize: 12, fontWeight: 600, background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Event list */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="w-48 h-3.5 rounded bg-slate-100 animate-pulse" />
                    <div className="w-24 h-3 rounded bg-slate-100 animate-pulse" />
                  </div>
                  <div className="w-16 h-3 rounded bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <Radio className="w-8 h-8 mx-auto mb-2" style={{ color: '#CBD5E1' }} />
              <p style={{ fontSize: 13, color: '#94A3B8' }}>No events yet — activity will appear here in real time</p>
            </div>
          ) : (
            events.map(evt => {
              const Icon = TYPE_ICON[evt.type];
              const color = TYPE_COLOR[evt.type];
              return (
                <div
                  key={evt.id}
                  onClick={() => evt.userId && navigate('/admin-v2/users')}
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    borderBottom: '1px solid #F8FAFC',
                    cursor: evt.userId ? 'pointer' : 'default',
                    background: evt.isNew ? 'rgba(245,158,11,0.08)' : 'transparent',
                    transition: 'background 0.5s ease',
                  }}
                  onMouseEnter={e => { if (evt.userId) (e.currentTarget.style.background = '#F8FAFC'); }}
                  onMouseLeave={e => { e.currentTarget.style.background = evt.isNew ? 'rgba(245,158,11,0.08)' : 'transparent'; }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{ width: 32, height: 32, borderRadius: 8, background: `${color}14` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{evt.label}</span>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>
                      {evt.username ? `@${evt.username}` : 'Anonymous'}
                    </p>
                  </div>
                  <span className="flex-shrink-0" style={{ fontSize: 11, color: '#94A3B8' }}>
                    {formatDistanceToNow(new Date(evt.timestamp), { addSuffix: true })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
