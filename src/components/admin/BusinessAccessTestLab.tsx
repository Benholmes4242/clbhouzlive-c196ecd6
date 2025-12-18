import React from 'react';
import { Building2, AlertTriangle } from 'lucide-react';

/**
 * BusinessAccessTestLab - DEPRECATED / INERT
 * 
 * This component is kept visible for reference but is completely non-functional.
 * All database writes, notifications, and edge function calls have been removed
 * to prevent any impact on production data.
 * 
 * Safety guarantees:
 * - No writes to business_access_requests table
 * - No writes to notifications table
 * - No writes to business_members or business_team_members
 * - No edge function calls
 * - No query invalidations
 * - No realtime broadcasts
 */
export function BusinessAccessTestLab() {
  return (
    <div className="rounded-sq-md border-2 border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-amber-600" />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-amber-700">
          Business Access Requests
        </h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-sq-pill bg-amber-100 text-amber-700 border border-amber-200">
          Disabled
        </span>
      </div>
      
      <div className="flex items-start gap-3 p-3 rounded-sq-sm bg-amber-50 border border-amber-200">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-800">
            Test Lab Access Requests is disabled
          </p>
          <p className="text-xs text-amber-700">
            This feature has been deactivated to prevent any impact on production data.
            All actions are non-functional. No database writes, notifications, or 
            realtime events will occur.
          </p>
        </div>
      </div>
      
      <div className="space-y-3 opacity-50 pointer-events-none select-none">
        {/* Disabled form preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Business</label>
          <div className="w-full rounded-sq-sm border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Select a business...
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Requester</label>
          <div className="w-full rounded-sq-sm border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Select a test user...
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Role</label>
          <div className="flex gap-2">
            <div className="flex-1 rounded-sq-sm px-3 py-2 text-sm font-medium bg-muted border border-border text-muted-foreground text-center">
              Team member
            </div>
            <div className="flex-1 rounded-sq-sm px-3 py-2 text-sm font-medium bg-muted border border-border text-muted-foreground text-center">
              Manager
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <div className="flex-1 rounded-sq-sm px-4 py-2.5 text-sm font-medium bg-muted border border-border text-muted-foreground text-center">
            Create access request
          </div>
          <div className="rounded-sq-sm px-4 py-2.5 text-sm font-medium bg-muted border border-border text-muted-foreground text-center">
            Reset
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
        To test access request flows, use the production UI directly with real user accounts.
      </p>
    </div>
  );
}
