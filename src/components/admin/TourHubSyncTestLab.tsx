import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Image, Download, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncResult {
  success: boolean;
  total_remaining?: number;
  processed?: number;
  updated?: number;
  already_stored?: number;
  skipped?: number;
  errors?: number;
  next_offset?: number;
  sample_updated?: string[];
  error?: string;
}

export function TourHubSyncTestLab() {
  const [isRunning, setIsRunning] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [offset, setOffset] = useState(0);
  const [delayMs, setDelayMs] = useState(3000);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [totalProcessed, setTotalProcessed] = useState(0);

  const runHeadshotSync = async () => {
    setIsRunning(true);
    try {
      toast.info(`Starting headshot sync (batch ${batchSize}, offset ${offset}, delay ${delayMs}ms)...`);
      
      const { data, error } = await supabase.functions.invoke('sync-golf-headshots', {
        body: {
          limit: batchSize,
          offset: offset,
          delayMs: delayMs,
          downloadToStorage: true,
          skipExisting: true,
        }
      });

      if (error) throw error;

      const result = data as SyncResult;
      setLastResult(result);
      
      if (result.success) {
        const newTotal = totalProcessed + (result.updated || 0);
        setTotalProcessed(newTotal);
        
        // Auto-advance offset for next batch
        if (result.next_offset) {
          setOffset(result.next_offset);
        }
        
        toast.success(
          `Synced ${result.updated || 0} headshots! (${result.already_stored || 0} already stored, ${result.skipped || 0} skipped)`
        );
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Headshot sync error:', err);
      toast.error(`Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLastResult({ success: false, error: String(err) });
    } finally {
      setIsRunning(false);
    }
  };

  const resetOffset = () => {
    setOffset(0);
    setTotalProcessed(0);
    setLastResult(null);
    toast.info('Offset reset to 0');
  };

  return (
    <div className="rounded-sq-md border-2 border-blue-500/20 bg-blue-500/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Image className="h-5 w-5 text-blue-600" />
        <h2 className="text-sm font-semibold tracking-wide uppercase">Tour Hub Headshot Sync</h2>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Download player headshots from SportRadar to Supabase Storage. 
        Run in batches to avoid rate limits. Images are cached permanently.
      </p>

      {/* Settings */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Batch Size</label>
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
            className="w-full px-3 py-2 rounded-sq-sm border border-border bg-background text-sm"
            min={1}
            max={50}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Offset</label>
          <input
            type="number"
            value={offset}
            onChange={(e) => setOffset(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-sq-sm border border-border bg-background text-sm"
            min={0}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Delay (ms)</label>
          <input
            type="number"
            value={delayMs}
            onChange={(e) => setDelayMs(Math.max(500, Math.min(10000, parseInt(e.target.value) || 3000)))}
            className="w-full px-3 py-2 rounded-sq-sm border border-border bg-background text-sm"
            min={500}
            max={10000}
            step={500}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={runHeadshotSync}
          disabled={isRunning}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-sq-sm px-4 py-3 text-sm font-medium transition-colors",
            "bg-blue-600 text-white hover:bg-blue-700",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Run Batch Sync
            </>
          )}
        </button>
        
        <button
          onClick={resetOffset}
          disabled={isRunning}
          className="px-4 py-3 rounded-sq-sm border border-border bg-muted text-sm font-medium hover:bg-muted/80 disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {/* Progress indicator */}
      {totalProcessed > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Total synced this session: <strong className="text-foreground">{totalProcessed}</strong></span>
        </div>
      )}

      {/* Last result */}
      {lastResult && (
        <div className={cn(
          "rounded-sq-sm p-3 text-xs space-y-1",
          lastResult.success ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"
        )}>
          <div className="flex items-center gap-2 font-medium">
            {lastResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{lastResult.success ? 'Last batch succeeded' : 'Last batch failed'}</span>
          </div>
          
          {lastResult.success && (
            <div className="text-muted-foreground space-y-0.5 ml-6">
              <div>Players with SportRadar URLs remaining: <strong className="text-foreground">{lastResult.total_remaining}</strong></div>
              <div>Processed this batch: {lastResult.processed}</div>
              <div>Migrated to storage: {lastResult.updated}</div>
              <div>Already in storage: {lastResult.already_stored}</div>
              <div>Skipped (no URL): {lastResult.skipped}</div>
              <div>Errors: {lastResult.errors}</div>
              <div className="text-blue-600">Next offset: {lastResult.next_offset}</div>
              {lastResult.sample_updated && lastResult.sample_updated.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <span className="font-medium text-foreground">Sample updated:</span>
                  <div className="mt-1">{lastResult.sample_updated.join(', ')}</div>
                </div>
              )}
            </div>
          )}
          
          {lastResult.error && (
            <div className="text-red-600 ml-6">{lastResult.error}</div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground border-t border-border/50 pt-3 space-y-1">
        <p><strong>How to use:</strong></p>
        <ol className="list-decimal list-inside space-y-0.5 ml-2">
          <li>Click "Run Batch Sync" to download {batchSize} images</li>
          <li>Offset auto-advances after each batch</li>
          <li>Repeat until all ~400 players are synced</li>
          <li>Images are stored permanently in Supabase Storage</li>
        </ol>
      </div>
    </div>
  );
}
