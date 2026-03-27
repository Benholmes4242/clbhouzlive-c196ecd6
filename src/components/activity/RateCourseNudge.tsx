import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const DISMISSED_KEY = 'rate-nudge-dismissed-v1';

export function RateCourseNudge() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );

  const { data } = useQuery({
    queryKey: ['user-rating-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { count } = await supabase
        .from('course_ratings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_mock', false);
      return count ?? 0;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  // Only show if: logged in, not dismissed, and user has rated fewer than 3 courses
  if (!user || dismissed || data === null || data === undefined || data >= 3) return null;

  const countLabel = data === 0
    ? "You haven't rated any courses yet"
    : `You've only rated ${data} course${data === 1 ? '' : 's'} so far`;

  return (
    <div
      style={{
        position: 'relative',
        margin: '0 16px 12px',
        padding: '14px 16px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.06))',
        border: '1px solid rgba(245,158,11,0.18)',
      }}
    >
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={13} style={{ color: '#94a3b8' }} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #F59E0B, #F97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Star size={16} fill="white" color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>
            Rate your courses
          </p>
          <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: 0 }}>
            {countLabel}
          </p>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: 10 }}>
        Your ratings help the Clbhouz community — and let you see how your scores compare to other golfers.
      </p>

      <button
        onClick={() => navigate('/courses')}
        style={{
          width: '100%', padding: '10px', borderRadius: 10,
          background: '#F59E0B', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, color: 'white',
        }}
        className="active:opacity-90 transition-opacity"
      >
        Rate a course
      </button>
    </div>
  );
}
