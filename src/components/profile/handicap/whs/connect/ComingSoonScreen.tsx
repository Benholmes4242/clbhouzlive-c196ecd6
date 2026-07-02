import React, { useEffect, useState } from 'react';
import { Check, Sparkles, Users } from 'lucide-react';
import { MiniFlag } from './MiniFlag';
import type { WhsCountry } from '@/lib/whs/whsCountries';
import { supabase } from '@/integrations/supabase/client';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const GREEN = '#059669';
const GREEN_TINT = 'rgba(5,150,105,0.10)';
const GREEN_BORDER = 'rgba(5,150,105,0.24)';
const FIELD_FILL = '#F8FAFC';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  country: WhsCountry;
  /** @deprecated kept for backwards compat, no longer invoked */
  onNotifyMe?: (country: WhsCountry) => void;
  onChangeCountry: () => void;
}

interface WaitlistDisplay {
  total: number;
  show_count: boolean;
  already_joined: boolean;
}

export const ComingSoonScreen: React.FC<Props> = ({ country, onChangeCountry }) => {
  const [state, setState] = useState<WaitlistDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error } = await supabase.rpc('get_waitlist_display', {
        _country_id: country.id,
      });
      if (cancelled) return;
      if (error) {
        setError('Could not load waitlist.');
        setLoading(false);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      setState(
        row ?? { total: 0, show_count: false, already_joined: false },
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [country.id]);

  const handleJoin = async () => {
    setSubmitting(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setError('Please sign in first.');
      setSubmitting(false);
      return;
    }
    const { error: insertErr } = await supabase
      .from('handicap_authority_waitlist')
      .insert({ user_id: uid, country_id: country.id, body_name: country.body });

    if (insertErr && insertErr.code !== '23505') {
      setError('Could not join the list. Please try again.');
      setSubmitting(false);
      return;
    }

    setState((prev) => {
      const wasJoined = prev?.already_joined ?? false;
      const total = (prev?.total ?? 0) + (wasJoined ? 0 : 1);
      return {
        total,
        show_count: total >= 25,
        already_joined: true,
      };
    });
    setSubmitting(false);
  };

  const shell: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${HAIR}`,
    borderRadius: 16,
    padding: '32px 22px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    fontFamily: FONT,
  };

  const secondaryBtn = (
    <button
      type="button"
      onClick={onChangeCountry}
      style={{
        fontSize: 13,
        color: INK_45,
        fontWeight: 600,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 12px',
        fontFamily: FONT,
      }}
    >
      Choose a different country
    </button>
  );

  if (loading) {
    return (
      <div style={shell}>
        <div style={{ height: 240 }} />
      </div>
    );
  }

  const showCount = state?.show_count ?? false;
  const total = state?.total ?? 0;
  const joined = state?.already_joined ?? false;

  // Social proof line
  const socialProof = showCount ? (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: GREEN_TINT,
        border: `1px solid ${GREEN_BORDER}`,
        color: GREEN,
        borderRadius: 999,
        padding: '6px 12px',
        fontSize: 12.5,
        fontWeight: 700,
        marginBottom: 20,
      }}
    >
      <Users size={13} strokeWidth={2.4} />
      {total} {total === 1 ? 'golfer' : 'golfers'} {joined ? 'waiting' : 'already waiting'}
    </div>
  ) : (
    <div
      style={{
        fontSize: 13,
        color: INK_45,
        marginBottom: 20,
        maxWidth: 290,
        lineHeight: 1.5,
      }}
    >
      Your request counts - we prioritise the most-requested authorities.
    </div>
  );

  if (joined) {
    return (
      <div style={shell}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: GREEN,
            boxShadow: '0 8px 22px rgba(5,150,105,0.30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <Check size={32} color="#fff" strokeWidth={3} />
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: '0 0 12px',
          }}
        >
          You're on the list
        </h2>

        <p
          style={{
            fontSize: 14,
            color: INK_45,
            lineHeight: 1.55,
            margin: '0 0 20px',
            maxWidth: 320,
          }}
        >
          Your request counts - we prioritise the most-requested authorities. We'll notify you in-app when <strong style={{ color: INK, fontWeight: 700 }}>{country.body}</strong> is live.
        </p>

        {socialProof}

        {secondaryBtn}
      </div>
    );
  }

  return (
    <div style={shell}>
      <div style={{ marginBottom: 18, transform: 'scale(1.4)' }}>
        <MiniFlag iso={country.iso} />
      </div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          margin: '0 0 10px',
          maxWidth: 290,
        }}
      >
        {country.name} isn't live yet
      </h2>

      <p
        style={{
          fontSize: 14,
          color: INK_45,
          lineHeight: 1.5,
          margin: '0 0 18px',
          maxWidth: 320,
        }}
      >
        We're not yet partnered with <strong style={{ color: INK, fontWeight: 700 }}>{country.body}</strong>. Add your name to the list and we'll push to make it happen.
      </p>

      {socialProof}

      <button
        type="button"
        onClick={handleJoin}
        disabled={submitting}
        style={{
          width: '100%',
          maxWidth: 360,
          minHeight: 52,
          padding: '14px',
          borderRadius: 14,
          background: INK,
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          border: 'none',
          cursor: submitting ? 'default' : 'pointer',
          fontFamily: FONT,
          marginBottom: 10,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: submitting ? 0.7 : 1,
        }}
      >
        <Sparkles size={16} strokeWidth={2.2} />
        {submitting ? 'Joining...' : 'Join the list'}
      </button>

      <div
        style={{
          fontSize: 12.5,
          color: INK_45,
          marginBottom: 8,
          maxWidth: 300,
          lineHeight: 1.45,
        }}
      >
        We'll notify you in-app the moment it's live.
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>{error}</div>
      )}

      <div style={{ marginTop: 6, background: FIELD_FILL, borderRadius: 8, padding: 0 }} />

      {secondaryBtn}
    </div>
  );
};

export default ComingSoonScreen;
