import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Users, FileText, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusinessActivityLog, getActivityDescription, BusinessActivityLogEntry } from '@/hooks/useBusinessActivityLog';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';

const iconMap = {
  verification: CheckCircle2,
  team: Users,
  profile: FileText,
  settings: Settings,
};

function groupByDate(entries: BusinessActivityLogEntry[]) {
  const groups: Record<string, BusinessActivityLogEntry[]> = {};

  entries.forEach((entry) => {
    const date = startOfDay(new Date(entry.created_at)).toISOString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
  });

  return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
}

function formatDateHeader(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

export default function BusinessActivityPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { data: activities, isLoading } = useBusinessActivityLog(businessId);

  if (!businessId) return null;

  const groupedActivities = activities ? groupByDate(activities) : [];

  return (
    <div
      className="min-h-screen bg-background md:max-w-[620px] md:mx-auto"
      style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}
    >
      {/* Title block — CompactHeader provides the back arrow */}
      <div className="px-4 pt-3 pb-3">
        <h1 className="text-lg font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground">Audit log</p>
      </div>


      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading activity...</div>
        ) : groupedActivities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground/70">Actions will appear here</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedActivities.map(([date, entries]) => (
              <section key={date}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  {formatDateHeader(date)}
                </h2>
                <div className="space-y-1">
                  {entries.map((entry) => {
                    const { title, description, icon } = getActivityDescription(entry);
                    const Icon = iconMap[icon];

                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 rounded-sq-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-9 w-9 rounded-sq-sm bg-muted flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{title}</p>
                          <p className="text-sm text-muted-foreground truncate">{description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(entry.created_at), 'h:mm a')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
