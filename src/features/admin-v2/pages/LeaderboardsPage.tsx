import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trophy, Calendar, Gift, Crown, Users, CheckCircle,
  Edit2, Save, X, RefreshCw, ChevronDown, ChevronUp,
  AlertCircle, Search,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader, AdminButton, AdminKpiCard } from '../components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Season {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'upcoming';
  start_date: string;
  end_date: string;
  sponsor_name: string | null;
  prize_description: string | null;
  season_winner_user_id: string | null;
  season_winner_courses: number | null;
  prize_claimed: boolean | null;
  color?: string | null;
}

interface UserSearchResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Season['status'] }) {
  const cfg = {
    active:    { bg: '#ECFDF5', color: '#059669', label: 'Active' },
    completed: { bg: '#F1F5F9', color: '#64748B', label: 'Completed' },
    upcoming:  { bg: '#EFF6FF', color: '#2563EB', label: 'Upcoming' },
  }[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

// ─── Inline text input ────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, multiline, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; disabled?: boolean;
}) {
  const shared: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1px solid #E2E8F0', fontSize: 13, color: '#0F172A',
    background: disabled ? '#F8FAFC' : '#FFFFFF',
    outline: 'none', resize: 'none' as const,
    fontFamily: 'inherit',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={shared}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={shared}
        />
      )}
    </div>
  );
}

// ─── User search for winner selection ─────────────────────────────────────────

function UserSearch({
  currentWinnerId,
  onSelect,
}: {
  currentWinnerId: string | null;
  onSelect: (user: UserSearchResult | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['admin-user-search', query],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return [];
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .ilike('display_name', `%${query}%`)
        .limit(8);
      return (data ?? []).map((d: any) => ({ id: d.id, display_name: d.display_name, avatar_url: d.profile_photo_url })) as UserSearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 10_000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['admin-user-name', currentWinnerId],
    queryFn: async () => {
      if (!currentWinnerId) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url')
        .eq('id', currentWinnerId)
        .single();
      return data as UserSearchResult | null;
    },
    enabled: !!currentWinnerId,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Season Winner
      </label>

      {/* Current winner display */}
      {currentWinnerId && currentUser && !open && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px', borderRadius: 8, border: '1px solid #F5A62355',
          background: '#FFFBF0', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#F5A62322', border: '1.5px solid #F5A623',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#F5A623', flexShrink: 0,
            }}>
              {currentUser.display_name.charAt(0)}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{currentUser.display_name}</span>
            <Crown style={{ width: 14, height: 14, color: '#F5A623' }} />
          </div>
          <button
            onClick={() => { onSelect(null); setQuery(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* Search input */}
      {(!currentWinnerId || open) && (
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94A3B8' }} />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name..."
            style={{
              width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8,
              border: '1px solid #E2E8F0', fontSize: 13, color: '#0F172A',
              background: '#FFFFFF', outline: 'none', fontFamily: 'inherit',
            }}
          />
          {isFetching && (
            <RefreshCw style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#94A3B8', animation: 'spin 1s linear infinite' }} />
          )}
        </div>
      )}

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', marginTop: 4, overflow: 'hidden',
        }}>
          {results.map(user => (
            <button
              key={user.id}
              onClick={() => { onSelect(user); setOpen(false); setQuery(''); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F1F5F9',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#F5A62322', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700,
                color: '#F5A623', flexShrink: 0,
              }}>
                {user.display_name.charAt(0)}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{user.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Season card ──────────────────────────────────────────────────────────────

function SeasonCard({ season, onSaved }: { season: Season; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(season.status === 'active');
  const [editing, setEditing] = useState(false);

  // Form state
  const [sponsorName, setSponsorName]       = useState(season.sponsor_name ?? '');
  const [prizeDesc, setPrizeDesc]           = useState(season.prize_description ?? '');
  const [winnerId, setWinnerId]             = useState(season.season_winner_user_id ?? '');
  const [winnerCourses, setWinnerCourses]   = useState(String(season.season_winner_courses ?? ''));
  const [prizeClaimed, setPrizeClaimed]     = useState(!!season.prize_claimed);
  const [markCompleted, setMarkCompleted]   = useState(false);

  const resetForm = () => {
    setSponsorName(season.sponsor_name ?? '');
    setPrizeDesc(season.prize_description ?? '');
    setWinnerId(season.season_winner_user_id ?? '');
    setWinnerCourses(String(season.season_winner_courses ?? ''));
    setPrizeClaimed(!!season.prize_claimed);
    setMarkCompleted(false);
    setEditing(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const patch: Record<string, unknown> = {
        sponsor_name:      sponsorName.trim() || null,
        prize_description: prizeDesc.trim() || null,
        season_winner_user_id:   winnerId || null,
        season_winner_courses:   winnerCourses ? parseInt(winnerCourses) : null,
        prize_claimed:     prizeClaimed,
      };
      if (markCompleted && season.status !== 'completed') {
        patch.status = 'completed';
      }
      const { error } = await supabase
        .from('championship_seasons')
        .update(patch)
        .eq('id', season.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-v2', 'seasons'] });
      setEditing(false);
      onSaved();
    },
  });

  const daysLeft = season.status === 'active'
    ? Math.max(0, Math.ceil((new Date(season.end_date).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16,
      overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: expanded ? '1px solid #F1F5F9' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: season.status === 'active' ? '#FFF7ED' : '#F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy style={{ width: 16, height: 16, color: season.status === 'active' ? '#F5A623' : '#94A3B8' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{season.name}</span>
              <StatusPill status={season.status} />
            </div>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>
              {format(parseISO(season.start_date), 'MMM d, yyyy')} – {format(parseISO(season.end_date), 'MMM d, yyyy')}
              {daysLeft !== null && ` · ${daysLeft}d remaining`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {season.sponsor_name && (
            <span style={{ fontSize: 11, color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '2px 8px' }}>
              {season.sponsor_name}
            </span>
          )}
          {season.season_winner_user_id && (
            <Crown style={{ width: 14, height: 14, color: '#F5A623' }} />
          )}
          {expanded
            ? <ChevronUp style={{ width: 16, height: 16, color: '#94A3B8' }} />
            : <ChevronDown style={{ width: 16, height: 16, color: '#94A3B8' }} />
          }
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Current values (view mode) */}
          {!editing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoBlock
                icon={<Gift style={{ width: 14, height: 14 }} />}
                label="Sponsor"
                value={season.sponsor_name ?? '—'}
              />
              <InfoBlock
                icon={<Trophy style={{ width: 14, height: 14 }} />}
                label="Prize"
                value={season.prize_description ?? '—'}
              />
              <InfoBlock
                icon={<Crown style={{ width: 14, height: 14 }} />}
                label="Winner"
                value={season.season_winner_user_id ? `${season.season_winner_courses ?? '?'} courses played` : '—'}
              />
              <InfoBlock
                icon={<CheckCircle style={{ width: 14, height: 14 }} />}
                label="Prize Claimed"
                value={season.prize_claimed ? 'Yes ✓' : season.season_winner_user_id ? 'Not yet' : '—'}
              />
            </div>
          )}

          {/* Edit form */}
          {editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field
                  label="Sponsor Name"
                  value={sponsorName}
                  onChange={setSponsorName}
                  placeholder="e.g. golftrips.co.uk"
                />
                <Field
                  label="Prize Description"
                  value={prizeDesc}
                  onChange={setPrizeDesc}
                  placeholder="e.g. 5-night golf trip to Portugal"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <UserSearch
                    currentWinnerId={winnerId || null}
                    onSelect={user => setWinnerId(user?.id ?? '')}
                  />
                </div>
                <Field
                  label="Winner Course Count"
                  value={winnerCourses}
                  onChange={setWinnerCourses}
                  placeholder="e.g. 24"
                  disabled={!winnerId}
                />
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Toggle
                  label="Prize Claimed"
                  checked={prizeClaimed}
                  onChange={setPrizeClaimed}
                  disabled={!winnerId}
                />
                {season.status !== 'completed' && (
                  <Toggle
                    label="Mark Season as Completed"
                    checked={markCompleted}
                    onChange={setMarkCompleted}
                    danger
                  />
                )}
              </div>

              {markCompleted && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', background: '#FFF7ED', border: '1px solid #F5A62333',
                  borderRadius: 10, fontSize: 12, color: '#92400E',
                }}>
                  <AlertCircle style={{ width: 14, height: 14, color: '#F5A623', flexShrink: 0 }} />
                  This will set the season status to "completed" and trigger the Season Winner Reveal card in the app.
                </div>
              )}
            </div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            {editing ? (
              <>
                <AdminButton variant="ghost" size="sm" onClick={resetForm} icon={X}>
                  Cancel
                </AdminButton>
                <AdminButton
                  variant="primary" size="sm"
                  icon={Save}
                  loading={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  Save Changes
                </AdminButton>
              </>
            ) : (
              <AdminButton variant="outline" size="sm" icon={Edit2} onClick={() => setEditing(true)}>
                Edit Season
              </AdminButton>
            )}
          </div>

          {saveMutation.isError && (
            <p style={{ fontSize: 12, color: '#F31260', textAlign: 'right' }}>
              Failed to save — {String(saveMutation.error)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94A3B8' }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, color: value === '—' ? '#CBD5E1' : '#0F172A', fontWeight: value === '—' ? 400 : 500 }}>
        {value}
      </span>
    </div>
  );
}

function Toggle({
  label, checked, onChange, disabled, danger,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
  disabled?: boolean; danger?: boolean;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10, position: 'relative',
          background: checked ? (danger ? '#F31260' : '#F5A623') : '#E2E8F0',
          transition: 'background 0.2s', flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: danger && checked ? '#F31260' : '#334155' }}>
        {label}
      </span>
    </label>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LeaderboardsPage() {
  const [savedMsg, setSavedMsg] = useState(false);

  const { data: seasons = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('championship_seasons')
        .select('id, name, status, start_date, end_date, sponsor_name, prize_description, season_winner_user_id, season_winner_courses, prize_claimed')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Season[];
    },
    staleTime: 30_000,
  });

  const activeSeason  = seasons.find(s => s.status === 'active');
  const sponsored     = seasons.filter(s => s.sponsor_name);
  const withWinner    = seasons.filter(s => s.season_winner_user_id);

  const handleSaved = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div style={{ padding: '24px 24px 48px', maxWidth: 900 }}>
      <AdminPageHeader
        title="Leaderboards"
        description="Manage championship seasons, sponsors, prizes, and crown season winners."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {savedMsg && (
              <span style={{ fontSize: 12, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle style={{ width: 13, height: 13 }} /> Saved
              </span>
            )}
            <AdminButton variant="secondary" size="sm" icon={RefreshCw} onClick={() => refetch()}>
              Refresh
            </AdminButton>
          </div>
        }
      />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <AdminKpiCard
          title="Active Season"
          value={activeSeason?.name ?? 'None'}
          icon={Calendar}
          iconColor="#F5A623"
          isLoading={isLoading}
        />
        <AdminKpiCard
          title="Sponsored Seasons"
          value={sponsored.length}
          icon={Gift}
          iconColor="#8B5CF6"
          isLoading={isLoading}
        />
        <AdminKpiCard
          title="Seasons with Winner"
          value={withWinner.length}
          icon={Crown}
          iconColor="#F59E0B"
          isLoading={isLoading}
        />
      </div>

      {/* Quick reference */}
      <div style={{
        background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
        padding: '14px 16px', marginBottom: 24,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <AlertCircle style={{ width: 15, height: 15, color: '#94A3B8', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
          <strong style={{ color: '#334155' }}>How it works:</strong>{' '}
          Set a <strong>Sponsor</strong> + <strong>Prize</strong> on any season to show the Sponsor Hero card in the app.
          When a season ends, search for the winner, enter their course count, and optionally mark as Completed —
          this triggers the Season Winner Reveal card above the Hall of Fame.
        </div>
      </div>

      {/* Season cards */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 16, background: '#F1F5F9', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
          <Trophy style={{ width: 32, height: 32, margin: '0 auto 12px', color: '#CBD5E1' }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No seasons found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Active first */}
          {seasons
            .sort((a, b) => {
              const order = { active: 0, upcoming: 1, completed: 2 };
              return order[a.status] - order[b.status];
            })
            .map(season => (
              <SeasonCard key={season.id} season={season} onSaved={handleSaved} />
            ))}
        </div>
      )}
    </div>
  );
}
