import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck } from 'lucide-react';
import { AMBER, INK, INK_FAINT } from '@/features/courses/_shared/tokens';
import ClaimCourseSheet from './ClaimCourseSheet';

interface ClaimCourseCTAProps {
  clubId: string;
  clubName: string;
  sourceCourseId?: string;
}

const ClaimCourseCTA: React.FC<ClaimCourseCTAProps> = ({ clubId, clubName, sourceCourseId }) => {
  const { t } = useTranslation('courses');
  const [open, setOpen] = useState(false);

  return (
    <>
      <div style={{ padding: '0 16px' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '13px 14px',
            background: '#FFFFFF',
            border: '1px solid rgba(15,23,42,0.07)',
            borderRadius: 16,
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
            background: 'rgba(247,147,30,0.10)', color: AMBER,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BadgeCheck size={18} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>
              {t('courseDetail.claim.cta.title')}
            </div>
            <div style={{ fontSize: 11, color: INK_FAINT, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('courseDetail.claim.cta.body')}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            style={{
              flexShrink: 0,
              background: 'rgba(247,147,30,0.10)', color: AMBER,
              border: 'none', borderRadius: 999, padding: '8px 14px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('courseDetail.claim.cta.action')}
          </button>
        </div>
      </div>

      <ClaimCourseSheet
        open={open}
        onClose={() => setOpen(false)}
        clubId={clubId}
        clubName={clubName}
        sourceCourseId={sourceCourseId}
      />
    </>
  );
};

export default ClaimCourseCTA;
