import React, { useState } from 'react';
import { AdminPageHeader, AdminSectionHeader } from '../../components/ui';
import { AdminPeriodPicker } from '../../components/ui/AdminPeriodPicker';
import type { AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import { useSignupFunnel, useGeoBreakdown } from '../../hooks/useAdminV2Analytics';

export default function GrowthPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data: funnel, isLoading: funnelLoading, isError: funnelError } = useSignupFunnel(period);
  const { data: geo = [], isLoading: geoLoading, isError: geoError } = useGeoBreakdown(period);

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <AdminPageHeader
        title="Growth Intelligence"
        description="Signup funnel and geographic breakdown"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* Signup Funnel */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20 }}>
        <AdminSectionHeader title="Signup Funnel" />
        <div className="mt-4 space-y-1">
          {funnelLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-48 h-4 rounded bg-slate-100 animate-pulse" />
                <div className="flex-1 h-9 rounded bg-slate-100 animate-pulse" />
                <div className="w-16 h-4 rounded bg-slate-100 animate-pulse" />
              </div>
            ))
          ) : funnelError ? (
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Failed to load funnel data</p>
          ) : !funnel?.steps.length ? (
            <p style={{ fontSize: 13, color: '#94A3B8' }}>No signup data for this period</p>
          ) : (
            funnel.steps.map((step, i) => (
              <div key={step.label}>
                {i > 0 && step.dropPct > 0 && (
                  <div className="flex items-center gap-3 py-0.5">
                    <div className="w-48" />
                    <span style={{ fontSize: 11, color: '#F87171' }}>▼ {step.dropPct}% drop</span>
                  </div>
                )}
                <div className="flex items-center gap-3 py-1">
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#475569', width: 192, flexShrink: 0 }}>
                    {step.label}
                  </span>
                  <div className="flex-1 relative" style={{ height: 36, background: '#F8FAFC', borderRadius: 6 }}>
                    <div
                      style={{
                        height: 36,
                        borderRadius: 6,
                        background: 'linear-gradient(90deg, #F5A623, #E8980A)',
                        width: `${Math.max(step.pct, 2)}%`,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <div className="flex-shrink-0 text-right" style={{ minWidth: 80 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{step.count.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>{step.pct}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Geographic Breakdown */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20 }}>
        <AdminSectionHeader title="Users by Country" />
        <div className="mt-4">
          {geoLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-24 h-4 rounded bg-slate-100 animate-pulse" />
                  <div className="flex-1 h-4 rounded bg-slate-100 animate-pulse" />
                  <div className="w-16 h-4 rounded bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : geoError ? (
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Failed to load geographic data</p>
          ) : !geo.length ? (
            <p style={{ fontSize: 13, color: '#94A3B8' }}>No country data available</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Country</th>
                  <th style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</th>
                  <th style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'right', padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New This Period</th>
                  <th style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'right', padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {geo.map((row) => {
                  const maxPct = geo[0]?.pctOfTotal || 1;
                  return (
                    <tr key={row.country} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', padding: '10px 0' }}>{row.country}</td>
                      <td style={{ padding: '10px 0' }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', minWidth: 40 }}>{row.userCount.toLocaleString()}</span>
                          <div style={{ width: 120, height: 6, borderRadius: 3, background: '#F1F5F9' }}>
                            <div
                              style={{
                                height: 6,
                                borderRadius: 3,
                                background: '#F5A623',
                                width: `${Math.round((row.pctOfTotal / maxPct) * 100)}%`,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: '#475569', textAlign: 'right', padding: '10px 0' }}>{row.newThisPeriod.toLocaleString()}</td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textAlign: 'right', padding: '10px 0' }}>{row.pctOfTotal}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
