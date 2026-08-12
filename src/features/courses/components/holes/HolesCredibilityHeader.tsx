import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { FONT, SC_ACCENT } from './_constants';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatNumber } from '@/i18n/format';



interface Props {
  totalRounds: number;
}

export const HolesCredibilityHeader: React.FC<Props> = ({ totalRounds }) => {
  const { t } = useTranslation(['courses']);
  return (
    <div style={{ padding: '16px 16px', fontFamily: FONT }}>
      <SectionHeader
        role="section"
        kicker={t('courses:holes.credibilityKicker')}
        accent={SC_ACCENT}
      />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 2,
          padding: '7px 12px',
          borderRadius: 999,
          background: 'rgba(247,147,30,0.08)',
          border: '1px solid rgba(247,147,30,0.18)',
          fontSize: 11.5,
          fontWeight: 600,
          color: '#B8720E',
        }}
      >
        <ShieldCheck size={13} strokeWidth={2.2} />
        <span>
          <span style={{ fontWeight: 700 }}>
            {t('courses:holes.rounds', { count: totalRounds, formattedCount: formatNumber(totalRounds) })}
          </span>
          {t('courses:holes.credibilitySuffix')}
        </span>
      </div>
    </div>
  );
};

export default HolesCredibilityHeader;
