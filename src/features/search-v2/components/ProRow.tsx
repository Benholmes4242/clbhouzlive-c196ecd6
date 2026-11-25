/**
 * Brief 26 — one Pros & coaches row. kind 'pro' reuses PersonRow (42px
 * squircle, ProMemberName → PRO badge) and opens the person; kind
 * 'business' reuses ClubRow and opens the business profile.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PersonRow } from './PersonRow';
import { ClubRow } from './ClubRow';
import {
  categoryCityLine,
  navClub,
  navPerson,
  proSubline,
  proToClub,
  proToPerson,
  type ProHit,
} from '../lib/searchNavigation';

interface Props {
  pro: ProHit;
  query: string;
  onCommit: (fn: () => void) => void;
}

export function ProRow({ pro, query, onCommit }: Props) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  if (pro.kind === 'business') {
    const club = proToClub(pro);
    return (
      <ClubRow
        club={club}
        query={query}
        subline={categoryCityLine(pro.category, pro.city)}
        onSelect={() => onCommit(() => navClub(navigate, club))}
      />
    );
  }
  const person = proToPerson(pro);
  return (
    <PersonRow
      person={person}
      query={query}
      subline={proSubline(pro, {
        tourPro: t('search.tourPro', { defaultValue: 'Tour pro' }),
        teachingPro: t('search.teachingPro', { defaultValue: 'Teaching pro' }),
      })}
      onSelect={() => onCommit(() => navPerson(navigate, person))}
    />
  );
}

export function BusinessRow({ business, query, onCommit }: { business: import('../lib/searchNavigation').BusinessHit; query: string; onCommit: (fn: () => void) => void }) {
  const navigate = useNavigate();
  const club = { id: business.id, name: business.name, slug: business.slug ?? null, logo_url: business.logo_url ?? null, city: business.city ?? null };
  return (
    <ClubRow
      club={club}
      query={query}
      subline={categoryCityLine(business.category, business.city)}
      onSelect={() => onCommit(() => navClub(navigate, club))}
    />
  );
}
