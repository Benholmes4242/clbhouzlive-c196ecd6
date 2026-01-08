import { useState, useMemo, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { useMyJoinRequests } from '../hooks/useMyJoinRequests';
import { SecondaryButton } from '@/features/hub/components/HubButtons';
import { cn } from '@/lib/utils';
import '../components/your-games/YourGames.css';

type TabValue = 'all' | 'pending' | 'approved' | 'declined';

function formatRequestedAgo(iso: string) {
  const created = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

interface JoinRequestsInboxSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewGame?: (gameId: string) => void;
  onFindGame?: () => void;
  focusGameId?: string;
}

export function JoinRequestsInboxSheet({
  open,
  onOpenChange,
  onViewGame,
  onFindGame,
  focusGameId,
}: JoinRequestsInboxSheetProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const { data: requests = [], isLoading } = useMyJoinRequests();
  const contentRef = useRef<HTMLDivElement>(null);

  // When focusGameId is passed, find the request and scroll/highlight it
  useEffect(() => {
    if (!focusGameId || !open || isLoading || !contentRef.current) return;

    const timer = setTimeout(() => {
      const el = contentRef.current?.querySelector<HTMLElement>(`[data-game-id="${focusGameId}"]`);
      if (!el) return;

      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.classList.add('sheet-focus-highlight');
      const highlightTimer = setTimeout(() => {
        el.classList.remove('sheet-focus-highlight');
      }, 1400);

      return () => clearTimeout(highlightTimer);
    }, 200);

    return () => clearTimeout(timer);
  }, [focusGameId, open, isLoading, requests]);

  // Filter requests based on active tab
  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'all') return true;
    return req.status === activeTab;
  });

  // Group by time for "All" tab
  const groupedByTime = useMemo(() => {
    if (activeTab !== 'all') return null;

    const today: typeof requests = [];
    const thisWeek: typeof requests = [];
    const earlier: typeof requests = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    // Assuming week starts Monday:
    const day = startOfWeek.getDay() || 7; // Sunday -> 7
    if (day > 1) startOfWeek.setDate(startOfWeek.getDate() - (day - 1));

    filteredRequests.forEach((req) => {
      const created = new Date(req.created_at);

      if (created >= startOfToday) {
        today.push(req);
      } else if (created >= startOfWeek) {
        thisWeek.push(req);
      } else {
        earlier.push(req);
      }
    });

    return { today, thisWeek, earlier };
  }, [filteredRequests, activeTab, requests]);

  // Format date/time like GameRow
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString(undefined, { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    return `${dateStr} • ${timeStr}`;
  };

  const getStatusPillClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 text-amber-200 border-amber-500/30';
      case 'approved':
        return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'declined':
        return 'bg-muted/40 text-muted-foreground border-muted/60';
      default:
        return 'bg-muted/40 text-muted-foreground border-muted/60';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'declined': return 'Declined';
      default: return status;
    }
  };

  const getMetaText = (status: string) => {
    switch (status) {
      case 'pending': 
        return 'Waiting for host to respond';
      case 'approved': 
        return "You're in. This game is in Your Games → Joined.";
      case 'declined': 
        return 'This game is no longer available.';
      default: 
        return '';
    }
  };

  const RequestCard = ({ 
    request, 
    formatDateTime, 
    getStatusPillClass, 
    getStatusLabel, 
    getMetaText, 
    onViewGame,
    onOpenChange
  }: { 
    request: any;
    formatDateTime: (iso: string) => string;
    getStatusPillClass: (status: string) => string;
    getStatusLabel: (status: string) => string;
    getMetaText: (status: string) => string;
    onViewGame?: (gameId: string) => void;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div
      className="rounded-xl p-4"
      data-game-id={request.game_id}
      style={{
        background: 'var(--hub-glass-bg-button)',
        border: '1px solid var(--hub-stroke-subtle)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium mb-1" style={{ color: 'var(--hub-text-bright)' }}>
            {request.games?.course_name || 'Golf game'}
          </div>
          <div className="text-sm" style={{ color: 'var(--hub-text-muted)' }}>
            {request.games ? formatDateTime(request.games.start_time) : 'Date TBD'}
          </div>
          <div className="text-[12px] text-[color:var(--hub-text-muted)] mt-1">
            Requested {formatRequestedAgo(request.created_at)}
          </div>
        </div>
        <div
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border shrink-0',
            getStatusPillClass(request.status)
          )}
        >
          {getStatusLabel(request.status)}
        </div>
      </div>

      {/* Meta text */}
      <div className="text-xs mb-3" style={{ color: 'var(--hub-text-sub)' }}>
        {getMetaText(request.status)}
      </div>

      {/* CTA for approved games */}
      {request.status === 'approved' && request.games && onViewGame && (
        <SecondaryButton
          onClick={() => {
            onViewGame(request.game_id);
            onOpenChange(false);
          }}
          label="View Game"
          className="w-full"
        />
      )}
    </div>
  );

  const EmptyState = ({ tab }: { tab: TabValue }) => {
    if (tab === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--hub-text-bright)' }}>
            No pending requests
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--hub-text-sub)' }}>
            When you request to join a game, you'll see it here.
          </p>
          {onFindGame && (
            <SecondaryButton onClick={onFindGame} label="Find a Game" />
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="text-5xl mb-4">⛳</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--hub-text-bright)' }}>
          No join requests yet
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--hub-text-sub)' }}>
          Browse games and tap "Request to Join" to get started.
        </p>
        {onFindGame && (
          <SecondaryButton onClick={onFindGame} label="Find a Game" />
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] flex flex-col p-0 border-0"
        style={{
          background: 'var(--hub-glass-bg-elevated)',
          backdropFilter: 'blur(80px)',
          WebkitBackdropFilter: 'blur(80px)',
        }}
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b" style={{ borderColor: 'var(--hub-stroke-subtle)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl font-semibold mb-1" style={{ color: 'var(--hub-text-bright)' }}>
                Join Requests
              </SheetTitle>
              <p className="text-sm" style={{ color: 'var(--hub-text-sub)' }}>
                See the status of all the games you've requested to join.
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="ml-4 p-2 rounded-full transition-colors"
              style={{
                background: 'var(--hub-glass-bg-button)',
                border: '1px solid var(--hub-stroke-subtle)',
              }}
              aria-label="Close"
            >
              <X className="w-5 h-5" style={{ color: 'var(--hub-text-body)' }} />
            </button>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div
            className="inline-flex rounded-xl p-1"
            style={{
              background: 'var(--hub-glass-bg-button)',
              border: '1px solid var(--hub-stroke-subtle)',
            }}
          >
            {(['all', 'pending', 'approved', 'declined'] as TabValue[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                  activeTab === tab
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white/80'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="space-y-3 mt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[color:var(--hub-stroke-subtle)] bg-[color:var(--hub-glass-bg-elevated)] p-3"
                >
                  <div className="h-4 w-1/2 rounded-md bg-white/10 animate-pulse mb-2" />
                  <div className="h-3 w-1/3 rounded-md bg-white/8 animate-pulse mb-1" />
                  <div className="h-3 w-2/3 rounded-md bg-white/8 animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : activeTab === 'all' && groupedByTime ? (
            <div className="space-y-6">
              {groupedByTime.today.length > 0 && (
                <section>
                  <div className="mb-2 text-[13px] font-semibold text-[color:var(--hub-text-muted)]">
                    Today
                  </div>
                  <div className="space-y-3">
                    {groupedByTime.today.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        formatDateTime={formatDateTime}
                        getStatusPillClass={getStatusPillClass}
                        getStatusLabel={getStatusLabel}
                        getMetaText={getMetaText}
                        onViewGame={onViewGame}
                        onOpenChange={onOpenChange}
                      />
                    ))}
                  </div>
                </section>
              )}

              {groupedByTime.thisWeek.length > 0 && (
                <section>
                  <div className="mb-2 text-[13px] font-semibold text-[color:var(--hub-text-muted)]">
                    This week
                  </div>
                  <div className="space-y-3">
                    {groupedByTime.thisWeek.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        formatDateTime={formatDateTime}
                        getStatusPillClass={getStatusPillClass}
                        getStatusLabel={getStatusLabel}
                        getMetaText={getMetaText}
                        onViewGame={onViewGame}
                        onOpenChange={onOpenChange}
                      />
                    ))}
                  </div>
                </section>
              )}

              {groupedByTime.earlier.length > 0 && (
                <section>
                  <div className="mb-2 text-[13px] font-semibold text-[color:var(--hub-text-muted)]">
                    Earlier
                  </div>
                  <div className="space-y-3">
                    {groupedByTime.earlier.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        formatDateTime={formatDateTime}
                        getStatusPillClass={getStatusPillClass}
                        getStatusLabel={getStatusLabel}
                        getMetaText={getMetaText}
                        onViewGame={onViewGame}
                        onOpenChange={onOpenChange}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  formatDateTime={formatDateTime}
                  getStatusPillClass={getStatusPillClass}
                  getStatusLabel={getStatusLabel}
                  getMetaText={getMetaText}
                  onViewGame={onViewGame}
                  onOpenChange={onOpenChange}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
