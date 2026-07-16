/**
 * RegionalJourneySummary - Regional list progress rail.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { QuestEmptyState } from './QuestEmptyState';

import gbiBadgeImage from '@/assets/badges/gbi-badge.png';
import europeBadgeImage from '@/assets/badges/europe-badge.png';
import usaBadgeImage from '@/assets/badges/usa-badge.png';
import globalBadgeImage from '@/assets/badges/global-badge.png';

export interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

interface RegionalJourneySummaryProps {
  regions: RegionProgress[];
  onRegionClick?: (region: RegionProgress) => void;
}

const REGION_BADGE_IMAGES: Record<string, string> = {
  'gb-i': gbiBadgeImage,
  'europe': europeBadgeImage,
  'usa': usaBadgeImage,
  'global': globalBadgeImage,
};

const REGION_COLORS: Record<string, string> = {
  'gb-i': '#334E3D',
  'europe': '#64748B',
  'usa': '#C1A84C',
  'global': '#334E3D',
};

const RegionRow: React.FC<{
  region: RegionProgress;
  onClick?: () => void;
}> = ({ region, onClick }) => {
  const { t } = useTranslation('achievements');
  const progressPercent = region.total > 0 ? (region.played / region.total) * 100 : 0;
  const isComplete = region.played >= region.total && region.total > 0;
  const badgeImage = REGION_BADGE_IMAGES[region.id];
  const accentColor = REGION_COLORS[region.id] || '#64748B';

  return (
    <button
      onClick={onClick}
      className="w-full text-left py-5 transition-all hover:bg-slate-50/50 group"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={badgeImage}
            alt={region.name}
            className={cn(
              "w-12 h-12 object-contain transition-transform duration-200 group-hover:scale-105",
              !isComplete && region.played === 0 && "opacity-40 grayscale-[60%]"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#1e293b]">
              {region.name}
            </span>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: isComplete
                    ? 'rgba(193, 168, 76, 0.12)'
                    : region.played > 0
                    ? 'rgba(51, 78, 61, 0.08)'
                    : 'rgba(148, 163, 184, 0.1)',
                  color: isComplete
                    ? '#8B7635'
                    : region.played > 0
                    ? '#334E3D'
                    : '#94a3b8',
                }}
              >
                {isComplete
                  ? t('quest.regional.statusComplete')
                  : region.played > 0
                  ? t('quest.regional.statusInProgress')
                  : t('quest.regional.statusNotStarted')}
              </span>

              <span className="text-sm font-semibold text-[#64748b] tabular-nums min-w-[50px] text-right">
                {region.played}/{region.total}
              </span>

              <ChevronRight className="w-4 h-4 text-[#94a3b8] transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete && "animate-quest-glow"
              )}
              style={{
                width: `${progressPercent}%`,
                backgroundColor: accentColor,
                opacity: region.played > 0 ? 1 : 0.3,
              }}
            />
          </div>
        </div>
      </div>
    </button>
  );
};

const REGION_ROUTES: Record<string, string> = {
  'gb-i': '/top100/gb-i',
  'europe': '/top100/europe',
  'usa': '/top100/usa',
  'global': '/top100/global',
};

export const RegionalJourneySummary: React.FC<RegionalJourneySummaryProps> = ({
  regions,
}) => {
  const { t } = useTranslation('achievements');
  const navigate = useNavigate();

  const handleRegionClick = (region: RegionProgress) => {
    const route = REGION_ROUTES[region.id];
    if (route) {
      navigate(route);
    }
  };

  if (!regions || regions.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 mb-6">
          {t('quest.regional.sectionTitle')}
        </h2>
        <QuestEmptyState
          icon={<Globe className="w-8 h-8 text-[#64748b]" />}
          title={t('quest.regional.emptyTitle')}
          description={t('quest.regional.emptyDescription')}
          action={{
            label: t('quest.regional.emptyCta'),
            onClick: () => navigate('/courses?tab=top100'),
          }}
        />
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 mb-4">
        {t('quest.regional.sectionTitle')}
      </h2>

      <div className="bg-white rounded-2xl border border-slate-200/60 px-4">
        {regions.map((region, index) => (
          <React.Fragment key={region.id}>
            <RegionRow
              region={region}
              onClick={() => handleRegionClick(region)}
            />
            {index < regions.length - 1 && (
              <div className="h-px bg-slate-100" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default RegionalJourneySummary;
