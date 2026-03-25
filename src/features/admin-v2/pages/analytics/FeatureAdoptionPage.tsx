import React, { useState } from 'react';
import { AdminPageHeader } from '../../components/ui';
import { AdminPeriodPicker } from '../../components/ui/AdminPeriodPicker';
import type { AnalyticsPeriod } from '../../hooks/useAdminV2Analytics';
import { useFeatureAdoption } from '../../hooks/useAdminV2Analytics';

export default function FeatureAdoptionPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data: features = [], isLoading, isError } = useFeatureAdoption(period);

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <AdminPageHeader
        title="Feature Adoption"
        description="What % of users are using each feature"
        action={<AdminPeriodPicker value={period} onChange={setPeriod} />}
      />

      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20 }}>
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="w-32 h-4 rounded bg-slate-100 animate-pulse" />
                  <div className="w-16 h-4 rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="w-full h-2 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p style={{ fontSize: 13, color: '#94A3B8' }}>Failed to load feature adoption data</p>
        ) : !features.length ? (
          <p style={{ fontSize: 13, color: '#94A3B8' }}>No adoption data for this period</p>
        ) : (
          <>
            <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
              {features.map((f) => (
                <div key={f.feature} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{f.feature}</span>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{f.description}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Trend pill */}
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          background: f.trend === 'up' ? '#F0FDF4' : f.trend === 'down' ? '#FEF2F2' : '#F8FAFC',
                          color: f.trend === 'up' ? '#16A34A' : f.trend === 'down' ? '#DC2626' : '#64748B',
                        }}
                      >
                        {f.trend === 'up' ? '▲' : f.trend === 'down' ? '▼' : '→'}
                        {f.trend === 'flat' ? ' flat' : ` ${f.trendPct > 0 ? '+' : ''}${f.trendPct}%`}
                      </span>
                      <div className="text-right">
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{f.adoptionPct}%</span>
                        <p style={{ fontSize: 11, color: '#94A3B8' }}>{f.usersWhoUsed.toLocaleString()} users</p>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: 8, borderRadius: 4, background: '#F1F5F9' }}>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 4,
                        background: '#F5A623',
                        width: `${Math.min(f.adoptionPct, 100)}%`,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 16, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
              Adoption % = unique users who triggered the feature at least once in the period ÷ total registered users
            </p>
          </>
        )}
      </div>
    </div>
  );
}
