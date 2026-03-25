import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ChevronRight, Search, ExternalLink, PanelLeft, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';

// Route → readable breadcrumb label map
const ROUTE_LABELS: Record<string, string> = {
  'dashboard':        'Dashboard',
  'analytics':        'Analytics',
  'platform':         'Platform',
  'content':          'Content',
  'auth':             'Auth & Security',
  'users':            'Users',
  'verifications':    'Verification Queue',
  'team':             'Team & Roles',
  'invites':          'Invites',
  'courses':          'Golf Courses',
  'import':           'Import',
  'tour':             'Tour Data',
  'players':          'Players',
  'businesses':       'Business Directory',
  'assets':           'Assets',
  'logos':            'Logos',
  'college-logos':    'College Logos',
  'flags':            'Country Flags',
  'audit':            'Audit Log',
  'settings':         'Settings',
  'tools':            'Dev Tools',
  'geocoding':        'Geocoding',
  'testlab':          'Test Lab',
};

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname
    .replace(/^\/admin-v2\/?/, '')
    .split('/')
    .filter(Boolean);

  return segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] ?? seg,
    href: '/admin-v2/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));
}

interface AdminV2HeaderProps {
  onOpenPalette: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function AdminV2Header({ onOpenPalette, onToggleSidebar, sidebarOpen }: AdminV2HeaderProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const breadcrumbs = useBreadcrumbs();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'Admin';
  const avatarUrl = profile?.profile_photo_url ?? null;

  return (
    <div
      className="h-full flex items-center justify-between px-4"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        height: 'calc(52px + max(env(safe-area-inset-top, 0px), 47px))',
        background: '#FFFFFF',
      }}
    >
      {/* Left: Toggle + Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] flex-shrink-0 cursor-pointer transition-colors"
          style={{
            border: '1px solid #E2E8F0',
            color: '#64748B',
            background: 'transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          {sidebarOpen
            ? <PanelLeftClose className="w-4 h-4" />
            : <PanelLeft className="w-4 h-4" />
          }
        </button>
      <nav className="flex items-center gap-1 text-sm">
        <Link to="/admin-v2/dashboard" style={{ color: '#64748B', fontWeight: 500 }} className="hover:opacity-80 transition-opacity">
          Admin
        </Link>
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.href}>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: '#CBD5E1' }} />
            {crumb.isLast ? (
              <span style={{ color: '#0F172A', fontWeight: 600 }}>
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.href} style={{ color: '#64748B' }} className="hover:opacity-80 transition-opacity">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
      </div>

      {/* Right: Command bar trigger + Avatar */}
      <div className="flex items-center gap-2">
        {/* ⌘K trigger */}
        <button
          onClick={onOpenPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[12px] transition-all"
          style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#64748B' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.boxShadow = 'none'; }}
          onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)'; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          aria-label="Open command palette"
        >
          <Search className="w-3.5 h-3.5" />
          {(() => {
            const path = window.location.pathname;
            if (path.includes('/users')) return 'Search in Users…';
            if (path.includes('/courses')) return 'Search in Courses…';
            if (path.includes('/businesses')) return 'Search in Businesses…';
            return 'Search anything…';
          })()}
          <kbd className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B' }}>
            ⌘K
          </kbd>
        </button>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-[10px] transition-colors active:scale-[0.98]"
            style={{ color: '#334155' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            aria-label="Admin menu"
          >
            <SquircleAvatar src={avatarUrl} size="xs" />
            <span className="text-[13px] font-medium hidden sm:inline" style={{ color: '#0F172A' }}>
              {displayName}
            </span>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              {/* Dropdown */}
              <div
                className="absolute right-0 top-full mt-1 w-56 z-50 py-1"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
              >
                <div className="px-3 py-2.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{displayName}</p>
                  <p className="text-[11px] truncate" style={{ color: '#64748B' }}>{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors"
                  style={{ color: '#334155' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
                  View Profile
                </button>
                <button
                  onClick={() => { navigate('/clubhouse'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors"
                  style={{ color: '#334155' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
                  Back to App
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
