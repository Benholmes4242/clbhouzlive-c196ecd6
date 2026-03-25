import React, { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader } from '../components/ui';
import { useAnomalyAlerts } from '../hooks/useAdminV2Analytics';
import { RefreshCw, AlertTriangle, AlertCircle, CheckCircle2, ArrowDown, ArrowUp } from 'lucide-react';
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

  const cardBg = {
    critical: '#FFF1F2',
    warning:  '#FFFBEB',
    info:     '#F0FDF4',
  };

  const iconBg = {
    critical: '#FEE2E2',
    warning:  '#FEF3C7',
    info:     '#DCFCE7',
  };

  const pillStyles = {
    critical: { background: '#FEE2E2', color: '#DC2626' },
    warning:  { background: '#FEF3C7', color: '#D97706' },
    info:     { background: '#DCFCE7', color: '#16A34A' },
  };

  const severityIcon = {
    critical: <AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />,
    warning:  <AlertCircle className="w-5 h-5" style={{ color: '#D97706' }} />,
    info:     <CheckCircle2 className="w-5 h-5" style={{ color: '#16A34A' }} />,
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
            const isAllClear = alert.id === 'all-clear';
            const isNegative = alert.changePct < 0;

            return (
              <div
                key={alert.id}
                style={{
                  background: cardBg[alert.severity],
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-3">
                    {/* Severity icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: iconBg[alert.severity],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {severityIcon[alert.severity]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full"
                          style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', ...pillStyles[alert.severity] }}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{alert.title}</h3>
                      <p style={{ fontSize: 13, color: '#475569' }}>{alert.description}</p>
                    </div>

                    {/* Change indicator */}
                    {!isAllClear && (
                      <div className="flex flex-col items-center flex-shrink-0">
                        {isNegative ? (
                          <ArrowDown className="w-5 h-5 text-red-500" />
                        ) : (
                          <ArrowUp className="w-5 h-5 text-green-500" />
                        )}
                        <span style={{
                          fontSize: 20, fontWeight: 900,
                          color: isNegative ? '#EF4444' : '#16A34A',
                          lineHeight: 1,
                        }}>
                          {alert.changePct >= 0 ? '+' : ''}{alert.changePct}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metrics pills */}
                  {!isAllClear && (
                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      <span style={{
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20,
                        padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#334155',
                      }}>
                        Current: {alert.currentValue.toLocaleString()}
                      </span>
                      <span style={{
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20,
                        padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#334155',
                      }}>
                        Baseline: {alert.baselineValue.toLocaleString()}
                      </span>
                      <span style={{
                        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20,
                        padding: '4px 12px', fontSize: 12, fontWeight: 600,
                        color: isNegative ? '#DC2626' : '#16A34A',
                      }}>
                        {alert.changePct >= 0 ? '+' : ''}{alert.changePct}% change
                      </span>
                    </div>
                  )}

                  {/* Last checked + detected */}
                  <div className="mt-3 flex items-center justify-between">
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      Last checked: {dataUpdatedAt ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true }) : '—'}
                    </span>
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
