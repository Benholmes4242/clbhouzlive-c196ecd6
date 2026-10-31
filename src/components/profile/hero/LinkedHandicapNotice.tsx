/** Shared owner-only linked/no-index notice; index figures stay with their
 * existing displays. Provider naming and management destination are canonical. */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { bodyNameForProvider } from '@/lib/whs/whsCountries';

export function LinkedHandicapNotice({ provider }: { provider?: string | null }) {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const body = bodyNameForProvider(provider);
  return <div data-linked-handicap-notice="" style={{ marginTop: 14 }}>
    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: A.MUTE }}>
      {t('hero.linkedNoIndex', { provider: body, defaultValue: `Connected to ${body}. Your index and rounds appear here as soon as ${body} has them.` })}
    </p>
    <Button variant="ghost" className="h-auto rounded-none p-0" onClick={() => navigate('/manage/handicap')} style={{ marginTop: 11, padding: 0, border: 0, background: 'transparent', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: A.INK }}>
      {t('hero.linkedManage', { provider: body, defaultValue: `${body} ›` })}
    </Button>
  </div>;
}