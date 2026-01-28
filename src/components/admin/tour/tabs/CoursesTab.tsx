import React from 'react';
import { Globe, LayoutGrid } from 'lucide-react';
import { SyncCard } from '../SyncCard';

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface CoursesTabProps {
  courses: any[] | undefined;
  counts: Record<string, number> | undefined;
  syncLogs: SyncLog[] | undefined;
  selectedTournament: any | null;
  onSync: (action: string, tournamentId?: string) => void;
  syncing: string | null;
}

export const CoursesTab: React.FC<CoursesTabProps> = ({
  courses,
  counts,
  syncLogs,
  selectedTournament,
  onSync,
  syncing,
}) => {
  const getLatestSync = (action: string) => syncLogs?.find(log => log.sync_type === action);

  return (
    <div className="space-y-6">
      {/* Course Info */}
      <SyncCard
        title="Course Info"
        description="Latitude/longitude, layouts, hole details"
        icon={<Globe className="h-4 w-4" />}
        action="summary"
        latestSync={getLatestSync('summary')}
        recordsCount={counts?.courses || 0}
        onSync={() => onSync('summary', selectedTournament?.sr_id)}
        isSyncing={syncing === 'summary'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {courses?.map((course: any) => (
            <div key={course.id} className="p-4 rounded-lg border border-border bg-card">
              <div className="font-medium">{course.name}</div>
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                {(course.city || course.state) && <div>📍 {[course.city, course.state, course.country].filter(Boolean).join(', ')}</div>}
                {course.par && <div>⛳ Par {course.par}</div>}
                {course.yardage && <div>📏 {course.yardage.toLocaleString()} yards</div>}
                {(course.latitude && course.longitude) && (
                  <div>🌍 {course.latitude.toFixed(4)}, {course.longitude.toFixed(4)}</div>
                )}
              </div>
            </div>
          ))}
          {(!courses || courses.length === 0) && (
            <div className="col-span-full text-center py-8 text-muted-foreground">No courses synced yet</div>
          )}
        </div>
      </SyncCard>

      {/* Tournament Summaries (Course layouts per tournament) */}
      <SyncCard
        title="Tournament Summaries"
        description="Location, course layout, full tournament field"
        icon={<LayoutGrid className="h-4 w-4" />}
        action="summary"
        latestSync={getLatestSync('summary')}
        recordsCount={counts?.summaries || 0}
        onSync={() => onSync('summary', selectedTournament?.sr_id)}
        isSyncing={syncing === 'summary'}
        disabled={!selectedTournament}
        disabledReason="Select a tournament in the Tournaments tab first"
      >
        {selectedTournament ? (
          <div className="p-4 bg-muted/50 rounded">
            <p className="text-sm">Syncing summary for: <span className="font-medium">{selectedTournament.name}</span></p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Select a tournament from the Tournaments tab to sync course layouts</p>
          </div>
        )}
      </SyncCard>
    </div>
  );
};
