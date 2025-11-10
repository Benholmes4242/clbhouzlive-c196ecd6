import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listTagsWithCounts, renameTag, deleteTagEverywhere, type TagRow } from '@/features/echo/api/tagsBrowser';
import { useNavigate } from 'react-router-dom';
import { echoHistoryAnalytics } from '@/features/echo/analytics/echoHistoryAnalytics';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Pencil, Merge, Trash2 } from 'lucide-react';
import '../home/hubTheme.css';

export default function HubEchoTagsPage() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null); // tag currently operating on

  // Apply hub-open class for glass theme
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['echo.tags.browser'],
    queryFn: listTagsWithCounts,
    staleTime: 30_000,
  });

  // Track page open on mount
  useEffect(() => {
    echoHistoryAnalytics.tagsBrowserOpened();
  }, []);

  const filtered = useMemo<TagRow[]>(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(t => t.name.includes(q));
  }, [data, search]);

  const doRename = async (oldName: string) => {
    const next = prompt(`Rename #${oldName} to:`, oldName);
    if (!next || next.trim() === '' || next === oldName) return;
    try {
      setBusy(oldName);
      const merged = data.some(d => d.name === next.trim());
      await renameTag(oldName, next.trim());
      toast({ description: `Renamed #${oldName} → #${next}` });
      echoHistoryAnalytics.tagRenamed({ old: oldName, next: next.trim(), merged });
      await refetch();
      // Invalidate history search to reflect tag changes
      queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
    } catch (e: any) {
      toast({ description: e?.message || 'Failed to rename tag', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async (row: TagRow) => {
    if (!confirm(`Delete #${row.name} from ${row.threads_count} conversation(s)? This cannot be undone.`)) return;
    try {
      setBusy(row.name);
      await deleteTagEverywhere(row.name);
      toast({ description: `Deleted #${row.name}` });
      echoHistoryAnalytics.tagDeleted({ name: row.name, threads_count: row.threads_count });
      await refetch();
      // Invalidate history search to reflect tag changes
      queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
    } catch (e: any) {
      toast({ description: e?.message || 'Failed to delete tag', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const goFilter = (row: TagRow) => {
    echoHistoryAnalytics.tagClicked({ name: row.name, threads_count: row.threads_count });
    nav('/hub/echo/history', { state: { applyTagFilter: row.name } });
  };

  return (
    <div className="hub-glass-page p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => nav(-1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 text-sm text-white/90 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={16}/> Back
          </button>
          <div className="text-lg font-semibold text-white/90">Tags</div>
          <div style={{ width: '80px' }} />
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/90 placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20 transition-all"
            placeholder="Search tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search tags"
          />
        </div>

        {/* List */}
        <div className="space-y-2">
          {isLoading && (
            <div className="h-16 rounded-lg bg-white/5 animate-pulse" />
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-8 text-white/50">
              {search ? 'No tags match your search.' : 'No tags yet. Add tags to your conversations to organize them.'}
            </div>
          )}
          {filtered.map((row) => (
            <div key={row.name}
              className="group flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              role="button"
              onClick={() => goFilter(row)}
              aria-label={`Filter by tag ${row.name}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium text-white/90 truncate">#{row.name}</div>
                  <span className="text-xs text-white/50">
                    {row.threads_count} convo{row.threads_count === 1 ? '' : 's'}
                  </span>
                </div>
                {row.last_used_at && (
                  <div className="text-xs text-white/40">
                    Last used: {new Date(row.last_used_at).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); doRename(row.name); }}
                  className="p-2 rounded-md hover:bg-white/10 text-white/70 hover:text-white/90 transition-colors"
                  aria-label={`Rename tag ${row.name}`}
                  disabled={busy === row.name}
                  title="Rename tag"
                >
                  <Pencil size={16}/>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); doRename(row.name); }}
                  className="p-2 rounded-md hover:bg-white/10 text-white/70 hover:text-white/90 transition-colors"
                  aria-label={`Merge tag ${row.name}`}
                  title="Merge into another tag (rename to an existing tag)"
                  disabled={busy === row.name}
                >
                  <Merge size={16}/>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); doDelete(row); }}
                  className="p-2 rounded-md hover:bg-white/10 text-white/70 hover:text-white/90 transition-colors"
                  aria-label={`Delete tag ${row.name}`}
                  disabled={busy === row.name}
                  title="Delete tag from all conversations"
                >
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
