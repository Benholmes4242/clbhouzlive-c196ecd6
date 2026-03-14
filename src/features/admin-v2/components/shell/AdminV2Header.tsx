import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ChevronRight, Search, ExternalLink } from 'lucide-react';
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
}

export default function AdminV2Header({ onOpenPalette }: AdminV2HeaderProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const breadcrumbs = useBreadcrumbs();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'Admin';
  const avatarUrl = profile?.profile_photo_url ?? null;

  return (
    <div className="h-full flex items-center justify-between px-4">
      {/* Left: Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        <Link to="/admin-v2/dashboard" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
          Admin
        </Link>
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.href}>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
            {crumb.isLast ? (
              <span className="text-foreground font-semibold">
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right: Command bar trigger + Avatar */}
      <div className="flex items-center gap-2">
        {/* ⌘K trigger */}
        <button
          onClick={onOpenPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] text-muted-foreground hover:text-foreground transition-all"
          style={{ borderColor: 'hsl(var(--border) / 0.6)', background: 'hsl(var(--muted) / 0.3)' }}
          aria-label="Open command palette"
        >
          <Search className="w-3.5 h-3.5" />
          Search...
          <kbd className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'hsl(var(--muted) / 0.6)', border: '1px solid hsl(var(--border) / 0.4)' }}>
            ⌘K
          </kbd>
        </button>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted/60 transition-colors active:scale-[0.98]"
            aria-label="Admin menu"
          >
            <SquircleAvatar src={avatarUrl} size="xs" />
            <span className="text-[13px] font-medium text-foreground hidden sm:inline">
              {displayName}
            </span>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border bg-card shadow-lg z-50 py-1" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                <div className="px-3 py-2.5 border-b" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
                  <p className="text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted/60 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  View Profile
                </button>
                <button
                  onClick={() => { navigate('/clubhouse'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted/60 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
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
