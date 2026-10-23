import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/** Static public information only: shares the legal-page shell, never reads
 * a document or starts deletion. The namespace loads on demand in English. */
const DeleteAccountPage: React.FC = () => {
  const { t } = useTranslation('deleteAccount', { lng: 'en', useSuspense: true });

  return (
    <ManagePageShell title={t('title')}>
      <div className="px-4 pt-4 pb-16">
        <main
          className="rounded-2xl p-5"
          style={{ background: A.PANEL, border: `1px solid ${A.BORDER}`, color: A.BODY, fontSize: 14, lineHeight: 1.65 }}
        >
          <p className="mb-3">{t('intro')}</p>
          {(['inApp', 'withoutApp', 'deleted', 'kept'] as const).map((section) => (
            <section key={section}>
              <h2 style={{ color: A.INK, fontSize: 17, fontWeight: 700, margin: '24px 0 8px', letterSpacing: 0 }}>
                {t(`${section}.title`)}
              </h2>
              <p className="mb-3 whitespace-pre-wrap">{t(`${section}.body`)}</p>
            </section>
          ))}
          <footer style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${A.BORDER}` }}>
            <Link to="/privacy" className="text-[13px] font-semibold underline" style={{ color: A.INK }}>
              {t('privacyLink')}
            </Link>
          </footer>
        </main>
      </div>
    </ManagePageShell>
  );
};

export default DeleteAccountPage;