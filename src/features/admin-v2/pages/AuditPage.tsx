import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardList, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  AdminPageHeader, AdminSearchBar, AdminFilterBar,
  AdminButton, AdminKpiCard,
} from '../components/ui';

interface AuditEntry {
  id:           string;
  action:       string;
  adminUserId:  string;
  targetEmail:  string | null;
  targetUserId: string | null;
  ipAddress:    string | null;
  createdAt:    string;
  details:      Record<string, unknown> | null;
}

const ACTION_CATEGORIES = ['all', 'create', 'update', 'delete', 'system'] as const;

function getCategory(action: string): string {
  const a = action.toLowerCase();
  if (a.includes('creat') || a.includes('add') || a.includes('invit') || a.includes('approv')) return 'create';
  if (a.includes('updat') || a.includes('edit') || a.includes('chang') || a.includes('set'))   return 'update';
  if (a.includes('delet') || a.includes('remov') || a.includes('revok') || a.includes('ban') || a.includes('reject')) return 'delete';
  return 'system';
}

function getBorderColor(action: string): string {
  const cat = getCategory(action);
  if (cat === 'create') return '#17C964';
  if (cat === 'delete') return '#F31260';
  if (cat === 'update') return '#1D6FF5';
  return '#E2E8F0';
}

function ActionBadge({ action }: { action: string }) {
  const cat = getCategory(action);
  const styles: Record<string, string> = {
    create: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    update: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    delete: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    system: 'bg-muted text-muted-foreground',
  };
  const labels: Record<string, string> = { create: 'CREATE', update: 'UPDATE', delete: 'DELETE', system: 'SYS' };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase', styles[cat])}>
      {labels[cat] ?? 'SYS'}
    </span>
  );
}

function toTitleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = entry.details && Object.keys(entry.details).length > 0;

  return (
    <div className="border-b border-border/30 last:border-0">
      <div
        className="flex items-start gap-3 px-4 py-3"
        style={{
          borderLeft: `3px solid ${getBorderColor(entry.action)}`,
          minHeight: 52,
        }}
      >
        <div className="pt-0.5 flex-shrink-0">
          <ActionBadge action={entry.action} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">
            {entry.action.replace(/_/g, ' ')}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {entry.targetEmail && (
              <span className="text-[11px] text-muted-foreground">{entry.targetEmail}</span>
            )}
            {entry.ipAddress && (
              <span className="text-[11px] text-muted-foreground font-mono">{entry.ipAddress}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
          </span>
          {hasDetails && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
            >
              {expanded
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>
          )}
        </div>
      </div>

      {expanded && entry.details && (
        <div className="px-4 pb-3" style={{ marginLeft: 3 }}>
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 16px' }}>
            {Object.entries(entry.details).map(([key, val]) => (
              <div key={key} className="flex items-start gap-3 py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 12, color: '#64748B', minWidth: 120, fontWeight: 500 }}>
                  {toTitleCase(key)}
                </span>
                <span style={{ fontSize: 12, color: '#0F172A', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage]         = useState(1);
  const PAGE_SIZE = 50;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'audit', page],
    queryFn:  async () => {
      const { data, error, count } = await supabase
        .from('admin_audit_log')
        .select('id, action, admin_user_id, target_email, target_user_id, ip_address, created_at, details', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (error) throw error;
      return {
        entries: (data ?? []).map(e => ({
          id:           e.id,
          action:       e.action,
          adminUserId:  e.admin_user_id,
          targetEmail:  e.target_email,
          targetUserId: e.target_user_id,
          ipAddress:    e.ip_address,
          createdAt:    e.created_at,
          details:      e.details as Record<string, unknown> | null,
        })),
        total: count ?? 0,
      };
    },
    staleTime: 30_000,
  });

  const entries = data?.entries ?? [];
  const total   = data?.total ?? 0;

  const filtered = entries.filter(e => {
    const matchSearch = !search.trim() ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      (e.targetEmail ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || getCategory(e.action) === category;
    return matchSearch && matchCat;
  });

  const categoryCounts: Record<string, number> = {
    all:    entries.length,
    create: entries.filter(e => getCategory(e.action) === 'create').length,
    update: entries.filter(e => getCategory(e.action) === 'update').length,
    delete: entries.filter(e => getCategory(e.action) === 'delete').length,
    system: entries.filter(e => getCategory(e.action) === 'system').length,
  };

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-4xl mx-auto space-y-6">

      <AdminPageHeader
        title="Audit Log"
        description="All admin actions logged for accountability"
        action={
          <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
            Refresh
          </AdminButton>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['create', 'update', 'delete', 'system'] as const).map(cat => (
          <AdminKpiCard
            key={cat}
            title={cat.charAt(0).toUpperCase() + cat.slice(1)}
            value={categoryCounts[cat]}
            icon={ClipboardList}
            isLoading={isLoading}
          />
        ))}
      </div>

      <div className="space-y-3">
        <AdminSearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search actions or emails…" resultCount={filtered.length} />
        <AdminFilterBar
          filters={ACTION_CATEGORIES.map(c => ({
            id: c,
            label: c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1),
            count: categoryCounts[c],
            variant: c === 'delete' ? 'danger' as const : c === 'create' ? 'success' as const : 'default' as const,
          }))}
          active={category}
          onChange={v => { setCategory(v); setPage(1); }}
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border/30">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-14 h-5 bg-muted rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 bg-muted rounded-md" />
                  <div className="h-3 w-24 bg-muted rounded-md" />
                </div>
                <div className="w-16 h-3 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No audit entries found</p>
          </div>
        ) : (
          <div>
            {filtered.map(entry => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          Page {page} of {Math.ceil(total / PAGE_SIZE)}
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-40 transition-colors">
              Previous
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= total} className="px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-40 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
