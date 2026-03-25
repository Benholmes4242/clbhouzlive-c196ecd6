import React, { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader } from '../components/ui';
import { useAnomalyAlerts } from '../hooks/useAdminV2Analytics';
import { RefreshCw, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

const REFETCH_INTERVAL = 10 * 60; // 10 minutes in seconds

export default function AnomalyAlertsPage() {
  const { data: alerts = [], isLoading, dataUpdatedAt } = useAnomalyAlerts();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(REFETCH_INTERVAL);

  // Countdown timer
  useEffect(() => {
    setCountdown(REFETCH_INTERVAL);
    const interval = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? REFETCH_INTERVAL : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const runCheck = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-v2', 'anomaly-alerts'] });
  }, [queryClient]);

  const countdownMin = Math.floor(countdown / 60);
  const countdownSec = countdown % 60;

  const severityStyles = {
    critical: { border: 'border-l-4 border-red-500', bg: 'bg-red-50', pill: { background: '#FEE2E2', color: '#DC2626' } },
    warning:  { border: 'border-l-4 border-amber-400', bg: 'bg-amber-50', pill: { background: '#FEF3C7', color: '#D97706' } },
    info:     { border: 'border-l-4 border-green-500', bg: 'bg-green-50', pill: { background: '#DCFCE7', color: '#16A34A' } },
  };

  const severityIcon = {
    critical: <AlertTriangle className="w-4 h-4" style={{ color: '#DC2626' }} />,
    warning:  <AlertCircle className="w-4 h-4" style={{ color: '#D97706' }} />,
    info:     <CheckCircle2 className="w-4 h-4" style={{ color: '#16A34A' }} />,
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <AdminPageHeader
        title="Anomaly Alerts"
        description="Automated anomaly detection — refreshes every 10 minutes"
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 12, color: '#94A3B8' }}>
          Next check in {countdownMin}m {String(countdownSec).padStart(2, '0')}s
        </span>
        <button
          onClick={runCheck}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
          style={{ fontSize: 12, fontWeight: 600, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Run Check Now
        </button>
      </div>

      {/* Alert cards */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 space-y-3" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14 }}>
              <div className="flex items-center gap-3">
                <div className="w-20 h-5 rounded-full bg-slate-100 animate-pulse" />
                <div className="w-48 h-5 rounded bg-slate-100 animate-pulse" />
              </div>
              <div className="w-full h-4 rounded bg-slate-100 animate-pulse" />
              <div className="w-64 h-3 rounded bg-slate-100 animate-pulse" />
            </div>
          ))
        ) : (
          alerts.map(alert => {
            const styles = severityStyles[alert.severity];
            return (
              <div
                key={alert.id}
                className={`${styles.border} ${styles.bg} rounded-xl overflow-hidden`}
                style={{ borderRadius: 14 }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      {severityIcon[alert.severity]}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full"
                        style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', ...styles.pill }}
                      >
                        {alert.severity}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>{alert.title}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>{alert.description}</p>

                  {alert.id !== 'all-clear' && (
                    <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: 12, color: '#64748B' }}>
                      <span>Current: <strong style={{ color: '#1E293B' }}>{alert.currentValue.toLocaleString()}</strong></span>
                      <span style={{ color: '#CBD5E1' }}>|</span>
                      <span>Baseline: <strong style={{ color: '#1E293B' }}>{alert.baselineValue.toLocaleString()}</strong></span>
                      <span style={{ color: '#CBD5E1' }}>|</span>
                      <span>Change: <strong style={{ color: alert.changePct >= 0 ? '#16A34A' : '#DC2626' }}>{alert.changePct >= 0 ? '+' : ''}{alert.changePct}%</strong></span>
                    </div>
                  )}

                  <div className="mt-3 text-right">
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      Detected {formatDistanceToNow(new Date(alert.detectedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
