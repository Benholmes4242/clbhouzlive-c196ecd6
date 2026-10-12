/**
 * THE ONE CONTEXT LINE for the comments and likes sheets (BRIEF_COMMENTS_SHEET
 * G.3, lifted for BRIEF_LIKES_SHEET H.3 so the two sheets cannot drift).
 * 11px, A.MUTE, tabular, one line with ellipsis. Rounds and reviews only;
 * with no author or course it renders nothing and the header is unchanged.
 */
import { useTranslation } from 'react-i18next';
import { FIGS, A } from '@/features/courses/components/holes/analytical/tokens';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { shortCourseName } from '@/features/courses/_shared/courseLabel';

export interface SubjectContext {
  authorName: string | null;
  courseId: string | null;
  courseName: string | null;
  kind: 'round' | 'review' | 'post';
  gross: number | null;
  toPar: number | null;
  rating: number | null;
}

export function SubjectContextLine({ subject, dataAttr = 'subject-context' }: { subject: SubjectContext | null | undefined; dataAttr?: string }) {
  const { t } = useTranslation('common');
  if (!subject || subject.kind === 'post' || !subject.authorName || !subject.courseName) return null;
  const strong = { color: A.INK, fontWeight: 700 } as const;
  let tail: React.ReactNode = null;
  if (subject.kind === 'round' && subject.gross != null) {
    const tp = subject.toPar;
    const tpText = tp == null ? null : tp === 0 ? t('comments.contextLevel') : tp < 0 ? `\u2212${Math.abs(tp)}` : `+${tp}`;
    tail = (
      <>
        {' \u00B7 '}<span style={strong}>{subject.gross}</span>
        {tpText && <span style={{ color: tp != null && tp < 0 ? TOPAR_UNDER_DARK : A.MUTE, fontWeight: 700 }}>{' '}{tpText}</span>}
      </>
    );
  } else if (subject.kind === 'review' && subject.rating != null) {
    tail = <>{' \u00B7 '}<span style={strong}>{subject.rating.toFixed(1)}</span></>;
  }
  return (
    <div
      {...{ [`data-${dataAttr}`]: 'true' }}
      className="truncate"
      style={{ ...FIGS, fontSize: 11, color: A.MUTE, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}
    >
      <span style={strong}>{subject.authorName}</span>
      {' \u00B7 '}{shortCourseName(subject.courseName)}
      {tail}
    </div>
  );
}
