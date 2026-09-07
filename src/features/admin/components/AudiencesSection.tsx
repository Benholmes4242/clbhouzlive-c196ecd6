import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { adminTheme as t } from '../theme';
import { useAudiences } from '../hooks/useAudiences';
import { SEGMENT_TO_MEMBERS_FILTER, type SegmentSlug } from '../lib/memberPredicates';
import AdminErrorState from './AdminErrorState';

interface CardDef {
  slug: SegmentSlug;
  name: string;
  definition: string;
}

const CARDS: CardDef[] = [
  { slug: 'new_this_week', name: 'New this week', definition: 'Members who joined in the last 7 days' },
  { slug: 'active_24h',    name: 'Active 24h',    definition: 'Rolling 24 hours, not since midnight' },
  { slug: 'dormant_14d',   name: 'Dormant 14d+',  definition: 'No activity for 14 or more days' },
  { slug: 'eg_linked',     name: 'EG linked',     definition: 'Members with an England Golf connection' },
  { slug: 'eg_issues',     name: 'EG issues',     definition: 'EG connection sync is auth-failed' },
  { slug: 'suspended',     name: 'Suspended',     definition: 'Accounts flagged and suspended' },
];

export default function AudiencesSection() {
  const q = useAudiences();

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.line}`, borderRadius: 22,
      boxShadow: t.shadowCard, padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>Audiences</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>Segment sizes right now. Tap a card to open the roster.</div>
      </div>

      {q.isError ? (
        /* An invariant break lands here too: an error, never a number. */
        <AdminErrorState
          title="Couldn't load audiences"
          message={q.error instanceof Error ? q.error.message : undefined}
          onRetry={() => q.refetch()}
        />
      ) : (
        <>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10,
        }}>
          {CARDS.map(c => {
            const size = q.data ? q.data[c.slug] : null;
            const clickable = c.slug !== 'eg_linked';
            const href = clickable
              ? `/admin-v2/users?filter=${SEGMENT_TO_MEMBERS_FILTER[c.slug as Exclude<SegmentSlug, 'eg_linked'>]}`
              : null;
            const body = <CardBody name={c.name} size={size} definition={c.definition} clickable={clickable} loading={q.isLoading} />;
            return href ? (
              <Link key={c.slug} to={href} style={{ textDecoration: 'none' }}>{body}</Link>
            ) : (
              <div key={c.slug}>{body}</div>
            );
          })}
        </div>

        {/*
          SET APART DELIBERATELY. Incomplete signups is a FUNNEL figure, not an
          audience: these accounts never confirmed, sit outside the member
          population, and must never be counted as members.
        */}
        <div style={{ borderTop: `1px solid ${t.line}`, paddingTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 260, flex: '1 1 200px' }}>
            <CardBody
              name="Incomplete signups"
              size={q.data ? q.data.incomplete_signups : null}
              definition="Started signing up, never confirmed"
              clickable={false}
              loading={q.isLoading}
            />
          </div>
          {/*
            Staff are MEMBERS and are counted in every figure above. This card
            only says how many there are, because they are excluded from
            event-volume figures (Events, Top content) by default.
          */}
          <div style={{ maxWidth: 260, flex: '1 1 200px' }}>
            <CardBody
              name="Staff accounts"
              size={q.data ? q.data.staff_accounts : null}
              definition="Counted as members; excluded from event volumes by default"
              clickable={false}
              loading={q.isLoading}
            />
          </div>
        </div>
        </>
      )}

    </div>
  );
}

function CardBody({ name, size, definition, clickable, loading }: {
  name: string; size: number | null; definition: string; clickable: boolean; loading: boolean;
}) {
  return (
    <div style={{
      background: t.canvas, border: `1px solid ${t.line}`, borderRadius: 16,
      padding: 12, display: 'flex', flexDirection: 'column', gap: 4, minHeight: 92,
      cursor: clickable ? 'pointer' : 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{
          color: t.inkMuted, fontSize: 11, fontWeight: 700,
          letterSpacing: 0.5, textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name}</div>
        {clickable && <ChevronRight size={14} color={t.inkFaint} />}
      </div>
      <div style={{
        color: t.ink, fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}>
        {loading || size === null ? '-' : size.toLocaleString()}
      </div>
      <div style={{
        color: t.inkFaint, fontSize: 10.5, lineHeight: 1.35,
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{definition}</div>
    </div>
  );
}
