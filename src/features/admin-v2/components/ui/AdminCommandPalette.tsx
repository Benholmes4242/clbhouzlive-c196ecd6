import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Users, MapPin, CheckCircle, Shield,
  Mail, Trophy, Building2, Image, ClipboardList,
  Settings, BarChart3, Map, FlaskConical, Upload,
  BookOpen, Flag, ArrowRight, User, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandItemData {
  id:          string;
  label:       string;
  description?: string;
  icon:        React.ElementType;
  href:        string;
  group:       string;
  keywords?:   string[];
}

// ─── Static page items ────────────────────────────────────────────────────────

const PAGES: CommandItemData[] = [
  { id: 'dashboard',       label: 'Dashboard',          icon: LayoutDashboard, href: '/admin-v2/dashboard',             group: 'Pages' },
  { id: 'users',           label: 'Users',              icon: Users,           href: '/admin-v2/users',                 group: 'Pages' },
  { id: 'verifications',   label: 'Verification Queue', icon: CheckCircle,     href: '/admin-v2/verifications',         group: 'Pages' },
  { id: 'team',            label: 'Team & Roles',       icon: Shield,          href: '/admin-v2/team',                  group: 'Pages' },
  { id: 'invites',         label: 'Invites',            icon: Mail,            href: '/admin-v2/invites',               group: 'Pages' },
  { id: 'courses',         label: 'Golf Courses',       icon: MapPin,          href: '/admin-v2/courses',               group: 'Pages' },
  { id: 'courses-import',  label: 'Import Courses',     icon: Upload,          href: '/admin-v2/courses/import',        group: 'Pages', keywords: ['csv', 'upload'] },
  { id: 'tour',            label: 'Tour Rankings',      icon: Trophy,          href: '/admin-v2/tour',                  group: 'Pages' },
  { id: 'tour-players',    label: 'Tour Players',       icon: Users,           href: '/admin-v2/tour/players',          group: 'Pages' },
  { id: 'businesses',      label: 'Business Directory', icon: Building2,       href: '/admin-v2/businesses',            group: 'Pages' },
  { id: 'assets',          label: 'Asset Manager',      icon: Image,           href: '/admin-v2/assets',                group: 'Pages' },
  { id: 'logos',           label: 'Logos',              icon: Image,           href: '/admin-v2/assets/logos',          group: 'Pages' },
  { id: 'college-logos',   label: 'College Logos',      icon: BookOpen,        href: '/admin-v2/assets/college-logos',  group: 'Pages' },
  { id: 'flags',           label: 'Country Flags',      icon: Flag,            href: '/admin-v2/assets/flags',          group: 'Pages' },
  { id: 'analytics',       label: 'Platform Analytics', icon: BarChart3,       href: '/admin-v2/analytics/platform',    group: 'Pages' },
  { id: 'analytics-auth',  label: 'Auth & Security',    icon: Shield,          href: '/admin-v2/analytics/auth',        group: 'Pages' },
  { id: 'audit',           label: 'Audit Log',          icon: ClipboardList,   href: '/admin-v2/audit',                 group: 'Pages' },
  { id: 'settings',        label: 'Settings',           icon: Settings,        href: '/admin-v2/settings',              group: 'Pages' },
  { id: 'geocoding',       label: 'Geocoding Tools',    icon: Map,             href: '/admin-v2/tools/geocoding',       group: 'Pages' },
  { id: 'testlab',         label: 'Test Lab',           icon: FlaskConical,    href: '/admin-v2/tools/testlab',         group: 'Pages' },
];

// ─── Recent nav storage ───────────────────────────────────────────────────────

const RECENT_KEY = 'admin-v2-cmd-recent';
const MAX_RECENT  = 5;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); }
  catch { return []; }
}

function pushRecent(id: string) {
  try {
    const prev = getRecent().filter(r => r !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}

// ─── Live search hook ─────────────────────────────────────────────────────────

function useLiveSearch(query: string) {
  const trimmed = query.trim();

  const usersQuery = useQuery({
    queryKey:  ['admin-v2', 'cmd', 'users', trimmed],
    queryFn:   async () => {
      if (trimmed.length < 2) return [];
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, username')
        .or(`display_name.ilike.%${trimmed}%,username.ilike.%${trimmed}%`)
        .is('deleted_at', null)
        .limit(5);
      return (data ?? []).map(u => ({
        id:    `user-${u.id}`,
        label: u.display_name ?? u.username ?? u.id.slice(0, 8),
        description: u.username ? `@${u.username}` : undefined,
        icon:  User,
        href:  `/admin-v2/users`,
        group: 'Users',
      })) as CommandItemData[];
    },
    enabled:   trimmed.length >= 2,
    staleTime: 30_000,
  });

  const coursesQuery = useQuery({
    queryKey:  ['admin-v2', 'cmd', 'courses', trimmed],
    queryFn:   async () => {
      if (trimmed.length < 2) return [];
      const { data } = await supabase
        .from('golf_courses')
        .select('id, name, country')
        .ilike('name', `%${trimmed}%`)
        .limit(5);
      return (data ?? []).map(c => ({
        id:          `course-${c.id}`,
        label:       c.name,
        description: c.country,
        icon:        MapPin,
        href:        `/admin-v2/courses`,
        group:       'Courses',
      })) as CommandItemData[];
    },
    enabled:   trimmed.length >= 2,
    staleTime: 30_000,
  });

  return {
    users:     usersQuery.data ?? [],
    courses:   coursesQuery.data ?? [],
    isLoading: usersQuery.isFetching || coursesQuery.isFetching,
  };
}

// ─── Command item renderer ────────────────────────────────────────────────────

function CmdRow({
  item,
  onSelect,
}: {
  item: CommandItemData;
  onSelect: (item: CommandItemData) => void;
}) {
  const Icon = item.icon;
  return (
    <CommandItem
      value={item.label + (item.description ?? '') + (item.keywords?.join(' ') ?? '')}
      onSelect={() => onSelect(item)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
        'text-[13px] text-foreground',
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block truncate">{item.label}</span>
        {item.description && (
          <span className="block text-[11px] text-muted-foreground truncate">{item.description}</span>
        )}
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
    </CommandItem>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AdminCommandPaletteProps {
  open:    boolean;
  onClose: () => void;
}

export function AdminCommandPalette({ open, onClose }: AdminCommandPaletteProps) {
  const navigate  = useNavigate();
  const [query, setQuery] = useState('');

  // Reset on open
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const { users, courses, isLoading } = useLiveSearch(query);

  const recent  = getRecent();
  const recentItems = recent
    .map(id => PAGES.find(p => p.id === id))
    .filter((p): p is CommandItemData => !!p);

  // Filter static pages by query
  const filteredPages = query.trim()
    ? PAGES.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.keywords?.some(k => k.includes(query.toLowerCase()))
      )
    : [];

  const handleSelect = useCallback((item: CommandItemData) => {
    pushRecent(item.id);
    navigate(item.href);
    onClose();
    setQuery('');
  }, [navigate, onClose]);

  if (!open) return null;

  const showRecent  = !query.trim() && recentItems.length > 0;
  const showLive    = query.trim().length >= 2;
  const isEmpty     = !!query.trim() && filteredPages.length === 0 && users.length === 0 && courses.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 pointer-events-none">
        <Command
          className="w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl pointer-events-auto overflow-hidden"
          shouldFilter={false}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-1 border-b border-border/40">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search pages, users, courses…"
              className="text-[14px]"
            />
            {isLoading && (
              <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin flex-shrink-0 mr-2" />
            )}
            <button
              onClick={onClose}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground mr-2 flex-shrink-0"
              style={{ background: 'hsl(var(--muted) / 0.6)', border: '1px solid hsl(var(--border) / 0.4)' }}
            >
              esc
            </button>
          </div>

          {/* Results */}
          <CommandList className="max-h-[320px] overflow-y-auto p-2">
            {/* Empty state */}
            {isEmpty && !isLoading && (
              <CommandEmpty>
                No results for &ldquo;{query}&rdquo;
              </CommandEmpty>
            )}

            {/* Recent — shown when no query */}
            {showRecent && (
              <CommandGroup heading="Recent">
                {recentItems.map(item => (
                  <CmdRow key={item.id} item={item} onSelect={handleSelect} />
                ))}
              </CommandGroup>
            )}

            {/* All pages — shown when no query */}
            {!query.trim() && (
              <CommandGroup heading="Pages">
                {PAGES.map(item => (
                  <CmdRow key={item.id} item={item} onSelect={handleSelect} />
                ))}
              </CommandGroup>
            )}

            {/* Filtered pages — shown with query */}
            {query.trim() && filteredPages.length > 0 && (
              <CommandGroup heading="Pages">
                {filteredPages.map(item => (
                  <CmdRow key={item.id} item={item} onSelect={handleSelect} />
                ))}
              </CommandGroup>
            )}

            {/* Live users */}
            {showLive && users.length > 0 && (
              <CommandGroup heading="Users">
                {users.map(item => (
                  <CmdRow key={item.id} item={item} onSelect={handleSelect} />
                ))}
              </CommandGroup>
            )}

            {/* Live courses */}
            {showLive && courses.length > 0 && (
              <CommandGroup heading="Courses">
                {courses.map(item => (
                  <CmdRow key={item.id} item={item} onSelect={handleSelect} />
                ))}
              </CommandGroup>
            )}
          </CommandList>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border/40 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono text-[10px] bg-muted/60">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono text-[10px] bg-muted/60">↵</kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono text-[10px] bg-muted/60">esc</kbd>
              Close
            </span>
          </div>
        </Command>
      </div>
    </>
  );
}
