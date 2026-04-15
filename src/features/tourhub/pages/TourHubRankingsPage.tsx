import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Award } from 'lucide-react';
import { TourHubShell } from '../components';

export function TourHubRankingsPage() {
  return (
    <TourHubShell>
      {/* ── SLATE EDITORIAL MASTHEAD ── */}
      <div style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0' }}>
        {/* Amber eyebrow */}
        <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
          Tour Hub
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', margin: '0 0 4px', lineHeight: 1.1 }}>
          Rankings
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>
          Rankings update automatically as events complete.
        </p>
      </div>

      {/* ── STICKY NAV BAR ── */}
      <div
        className="-mx-5 sticky top-0 z-20"
        style={{
          background: 'rgba(248,250,252,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(15,23,42,0.08)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        }}
      >
        <div className="flex items-center px-5 pb-3">
          <Link
            to="/tourhub"
            className="text-[13px] font-semibold"
            style={{ color: '#F7931E' }}
          >
            ← Tour Hub
          </Link>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ background: '#F8FAFC', padding: '24px 0' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          <div className="bg-white border rounded-xl p-6" style={{ borderColor: 'rgba(15,23,42,0.07)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(15,23,42,0.04)' }}>
              <Trophy className="w-6 h-6" style={{ color: '#94A3B8' }} />
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
              OWGR
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 12px' }}>
              Official World Golf Ranking
            </p>
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'rgba(15,23,42,0.04)', fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
              Coming soon
            </span>
          </div>
          
          <div className="bg-white border rounded-xl p-6" style={{ borderColor: 'rgba(15,23,42,0.07)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(15,23,42,0.04)' }}>
              <TrendingUp className="w-6 h-6" style={{ color: '#94A3B8' }} />
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
              FedExCup
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 12px' }}>
              PGA Tour season standings
            </p>
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'rgba(15,23,42,0.04)', fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
              Coming soon
            </span>
          </div>
          
          <div className="bg-white border rounded-xl p-6" style={{ borderColor: 'rgba(15,23,42,0.07)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(15,23,42,0.04)' }}>
              <Award className="w-6 h-6" style={{ color: '#94A3B8' }} />
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
              Tour Standings
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 12px' }}>
              LPGA, DP World & more
            </p>
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'rgba(15,23,42,0.04)', fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </TourHubShell>
  );
}
