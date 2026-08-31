/**
 * GolfersToFollowV2 - BRIEF_SUGGESTED_GOLFERS S5.
 *
 * Rebuilt on the DEDICATED public.get_suggested_golfers rpc (NOT
 * search_empty_state_v2, which continues to serve the search overlay).
 * Rows come from the shared SuggestedGolferRow so the page and the Activity /
 * after-a-round blocks are one component.
 *
 * Grouped by reason - club, course, mutual, active - with empty groups hidden.
 * Following a row leaves it in place; it goes on the next load.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ROW_FONT } from '@/features/social-lists-v2/rowParts';
import { ListSkeleton } from '@/features/social-lists-v2/SocialListPage';
import { SuggestedGolferRow } from '@/features/social-suggestions/SuggestedGolferRow';
import {
  useSuggestedGolfers,
  type SuggestedGolfer,
  type SuggestionReason,
} from '@/features/social-suggestions/useSuggestedGolfers';

const GROUP_ORDER: SuggestionReason[] = ['club', 'course', 'mutual', 'active'];
const GROUP_KEY: Record<SuggestionReason, string> = {
  club: 'suggestedGolfers.group.club',
  course: 'suggestedGolfers.group.course',
  mutual: 'suggestedGolfers.group.mutual',
  active: 'suggestedGolfers.group.active',
};

export default function GolfersToFollowV2() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const q = useSuggestedGolfers(48);

  const groups = useMemo(() => {
    const map = new Map<SuggestionReason, SuggestedGolfer[]>();
    for (const g of q.data ?? []) {
      const list = map.get(g.reason_type) ?? [];
      list.push(g);
      map.set(g.reason_type, list);
    }
    return GROUP_ORDER.map((r) => ({ reason: r, people: map.get(r) ?? [] })).filter(
      (g) => g.people.length > 0,
    );
  }, [q.data]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/clubhouse');
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: A.CANVAS,
        fontFamily: ROW_FONT,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 40px)',
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 12px 0 10px',
            borderRadius: 17,
            background: A.PANEL,
            border: `0.5px solid ${A.BORDER}`,
            color: A.INK,
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: ROW_FONT,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} strokeWidth={2.2} />
          Back
        </button>

        <div style={{ marginTop: 18, marginBottom: 14 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: A.AMBER,
              textTransform: 'uppercase',
            }}
          >
            Build your clubhouse
          </div>
          <h1
            style={{
              margin: '6px 0 4px',
              fontSize: 26,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontWeight: 700,
              color: A.INK,
            }}
          >
            Golfers to follow
          </h1>
          <div style={{ fontSize: 13, fontWeight: 500, color: A.DIM }}>
            {t('suggestedGolfers.pageSub')}
          </div>
        </div>

        {/* S5.5 - the search entry point stays at the top of the page. */}
        <button
          type="button"
          onClick={() => navigate('/search')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            height: 42,
            padding: '0 14px',
            marginBottom: 16,
            borderRadius: 14,
            background: A.PANEL,
            border: `0.5px solid ${A.BORDER}`,
            color: A.DIM,
            fontSize: 13.5,
            fontWeight: 500,
            fontFamily: ROW_FONT,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Search size={15} strokeWidth={2.4} />
          <span style={{ flex: 1 }}>{t('suggestedGolfers.searchEntry')}</span>
          <ChevronRight size={15} strokeWidth={2.4} />
        </button>

        {q.isLoading ? (
          <Panel title={t('suggestedGolfers.heading')}>
            <ListSkeleton />
          </Panel>
        ) : q.isError ? (
          <Panel title={t('suggestedGolfers.heading')}>
            <Notice
              text={t('suggestedGolfers.error')}
              action={t('suggestedGolfers.retry')}
              onAction={() => q.refetch()}
            />
          </Panel>
        ) : groups.length === 0 ? (
          <Panel title={t('suggestedGolfers.heading')}>
            <Notice
              text={t('suggestedGolfers.empty')}
              action={t('suggestedGolfers.findGolfers')}
              onAction={() => navigate('/search')}
            />
          </Panel>
        ) : (
          groups.map((g, gi) => (
            <div key={g.reason} style={{ marginBottom: gi < groups.length - 1 ? 16 : 0 }}>
              <Panel title={t(GROUP_KEY[g.reason])}>
                {g.people.map((p, i) => (
                  <SuggestedGolferRow
                    key={p.user_id}
                    golfer={p}
                    showDivider={i < g.people.length - 1}
                  />
                ))}
              </Panel>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: A.PANEL,
        borderRadius: 16,
        border: `0.5px solid ${A.BORDER}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px 8px',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: A.DIM,
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Notice({
  text,
  action,
  onAction,
}: {
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div
      style={{
        padding: '28px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        color: A.DIM,
        fontSize: 13,
        textAlign: 'center',
      }}
    >
      {text}
      <button
        type="button"
        onClick={onAction}
        style={{
          background: A.INK,
          color: A.CANVAS,
          border: 'none',
          borderRadius: 999,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: ROW_FONT,
          cursor: 'pointer',
        }}
      >
        {action}
      </button>
    </div>
  );
}
