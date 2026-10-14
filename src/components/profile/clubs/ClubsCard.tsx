import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, ChevronRight } from 'lucide-react';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { courseLabel } from '@/features/explore-magazine/useClubWeekRounds';
import { useClubGolfers } from '@/features/explore-magazine/useClubGolfers';
import { useProfileRounds, isFullEighteen } from '@/components/profile/rounds/useProfileRounds';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { fmtSigned } from '@/features/profile-sheet-v2/sheetState';
import { useClubsCourses, type ClubCourse } from './useClubsCourses';

interface Club {
  id: string;
  name: string;
  isPrimary?: boolean;
}

interface ClubsCardProps {
  homeClub: Club | null;
  secondaryClubs: Club[];
  isOwner: boolean;
  isPrivate?: boolean;
  /** The profile being read, and who is reading it. */
  profileId?: string;
  viewerId?: string;
  onEditClick?: () => void;
  /**
   * BRIEF_HOME_CLUB_PICKER §2.3 — the durable route to the picker. Present on
   * the owner's own profile whether or not they ever saw a prompt.
   */
  onSetHomeClub?: () => void;
  /**
   * THE CLUB THEY HAVE ASKED FOR AND ARE WAITING ON (§3.5), from
   * user_profiles.home_club_pending_name via useHomeClubStatus - a typed name of
   * a club not yet in the catalogue, not a club row.
   *
   * IT IS HERE BECAUSE AWAITING APPROVAL AND HAVING NO CLUB ARE TWO STATES AND
   * WERE RENDERING AS ONE. When HomeClubPrompt was removed this treatment left
   * with it, and a member who had already answered was told to answer again -
   * the same collapse as an error shown as a zero. This is now the only surface
   * that holds it.
   */
  pendingClubName?: string | null;
  className?: string;
}

const MAX_SECONDARY_CLUBS = 3;
const VS_AWAY_FLOOR = 5;

const EYEBROW: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

function locationOf(c: ClubCourse | undefined): string | null {
  if (!c) return null;
  const parts = [c.region, c.sub_country ?? c.country].filter(
    (p, i, arr): p is string => !!p && arr.indexOf(p) === i,
  );
  return parts.length ? parts.join(', ') : null;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

const ClubsCard: React.FC<ClubsCardProps> = ({
  homeClub,
  secondaryClubs,
  isOwner,
  isPrivate = false,
  profileId,
  viewerId,
  onEditClick,
  onSetHomeClub,
  pendingClubName,
  className,
}) => {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const hasClubs = !!homeClub || secondaryClubs.length > 0;
  const displayedSecondary = secondaryClubs.slice(0, MAX_SECONDARY_CLUBS);
  const remainingCount = secondaryClubs.length - MAX_SECONDARY_CLUBS;

  const clubIds = useMemo(
    () => [homeClub?.id, ...displayedSecondary.map((c) => c.id)].filter(Boolean) as string[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [homeClub?.id, displayedSecondary.map((c) => c.id).join(',')],
  );
  const { data: coursesByClub = {} } = useClubsCourses(clubIds);
  const { data: rounds = [] } = useProfileRounds(hasClubs ? profileId : undefined);

  /* useClubGolfers excludes THE VIEWER; on a visitor's profile the owner is
     still in its list, so they are excluded below before counting. */
  const { data: golfersRaw } = useClubGolfers(viewerId, homeClub?.id ?? null, !!homeClub) as {
    data?: { userId: string; photoUrl: string | null; name: string }[];
  };
  const viewerClubs = useProfileClubs(!isOwner && homeClub ? viewerId : undefined, viewerId);
  const viewerSharesClub = !isOwner && !!homeClub && viewerClubs.homeClub?.id === homeClub.id;

  /*
   * ONE POPULATION FOR EVERY FIGURE ON THIS SECTION. A qualifying round comes
   * from useProfileRounds (one can_view_handicap gate, in the database), passes
   * isFullEighteen (nine-hole rounds and rounds whose whs_scores join did not
   * return are out), and is then split by whether its course_id belongs to the
   * club. ROUNDS HERE, BEST, VS AWAY and every "{n} ROUNDS" read this one set —
   * never a looser population for the count and a stricter one for averages.
   */
  const qualifying = useMemo(() => rounds.filter(isFullEighteen), [rounds]);
  const roundsAtClub = (clubId: string) => {
    const ids = new Set((coursesByClub[clubId] ?? []).map((c) => c.id));
    return qualifying.filter((r) => r.course_id && ids.has(r.course_id));
  };

  const pencil = isOwner && onEditClick ? (
    <button
      type="button"
      onClick={onEditClick}
      aria-label={t('clubs.edit', 'Edit clubs')}
      style={{ marginLeft: 'auto', background: 'none', border: 0, padding: 0, color: A.INK, display: 'flex', cursor: 'pointer' }}
    >
      <Pencil size={15} strokeWidth={2} />
    </button>
  ) : null;

  const eyebrow = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ ...EYEBROW, color: A.MUTE }}>{t('clubs.homeClub', 'HOME CLUB')}</span>
      {pencil}
    </div>
  );

  const wrap = (children: React.ReactNode) => (
    <div className={className} style={{ fontFamily: SANS }}>{children}</div>
  );

  /**
   * PENDING OUTRANKS EMPTY. A member with a club on the way has answered the
   * question the empty state asks, so it must not be asked again. Their answer
   * is shown, visibly unconfirmed - the amber here is a status on the member's
   * own profile, not decoration.
   */
  if (!hasClubs && isOwner && pendingClubName) {
    return wrap(
      <>
        {eyebrow}
        <div
          style={{
            marginTop: 9,
            border: '1px solid rgba(247,147,30,0.35)',
            background: 'rgba(247,147,30,0.06)',
            borderRadius: 14,
            padding: '13px 15px',
          }}
        >
          <div style={{ fontSize: 14.5, fontWeight: 700, color: A.INK }}>{pendingClubName}</div>
          <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 600, color: A.AMBER }}>
            {t('clubs.pending', 'Waiting to be added to the catalogue')}
          </div>
        </div>
      </>,
    );
  }

  if (!hasClubs && isOwner) {
    return wrap(
      <>
        {eyebrow}
        <div style={{ marginTop: 9, border: `1px solid ${A.BORDER}`, borderRadius: 14, padding: 15 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>
            {t('clubs.emptyTitle', 'Where do you play?')}
          </div>
          <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, color: A.BODY }}>
            {t(
              'clubs.emptyBody',
              'Set your home club and we will show your record there, who else from the club is on clbhouz, and what they have been shooting.',
            )}
          </div>
          <button
            type="button"
            onClick={onSetHomeClub ?? onEditClick}
            style={{
              marginTop: 12,
              width: '100%',
              height: 38,
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#0A0A0C',
              border: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {t('clubs.setHomeClub', 'SET HOME CLUB')}
          </button>
        </div>
      </>,
    );
  }

  if (!hasClubs && !isOwner && isPrivate) {
    return wrap(
      <p style={{ fontSize: 12.5, fontWeight: 600, color: A.MUTE, margin: 0 }}>
        {t('clubs.private', 'Clubs are private.')}
      </p>,
    );
  }

  if (!hasClubs) return null;

  /* ---------- home club ---------- */
  let homeBlock: React.ReactNode = null;
  if (homeClub) {
    const courses = coursesByClub[homeClub.id] ?? [];
    const first = courses[0];
    const multi = courses.length > 1;
    const labels = multi
      ? courses.map((c) => courseLabel(c.name, homeClub.name)).filter(Boolean).join(' & ')
      : null;
    const subline = [locationOf(first), labels].filter(Boolean).join(' · ');
    const tappable = courses.length === 1;

    const here = roundsAtClub(homeClub.id);
    const homeIds = new Set(courses.map((c) => c.id));
    const away = qualifying.filter((r) => !r.course_id || !homeIds.has(r.course_id));
    const grosses = here.map((r) => r.gross_score).filter((g): g is number => g != null);
    const hereDiffs = here.map((r) => r.handicap_differential).filter((d): d is number => d != null);
    const awayDiffs = away.map((r) => r.handicap_differential).filter((d): d is number => d != null);
    const showVsAway = here.length >= VS_AWAY_FLOOR && away.length >= VS_AWAY_FLOOR
      && hereDiffs.length > 0 && awayDiffs.length > 0;
    const vsAway = showVsAway ? Math.round((mean(hereDiffs) - mean(awayDiffs)) * 10) / 10 : null;

    const figures: { value: string; label: string; color?: string }[] = [];
    if (here.length > 0) {
      figures.push({ value: String(here.length), label: t('clubs.roundsHere', 'ROUNDS HERE') });
      if (grosses.length) figures.push({ value: String(Math.min(...grosses)), label: t('clubs.best', 'BEST') });
      if (vsAway != null) {
        figures.push({
          value: fmtSigned(vsAway),
          label: t('clubs.vsAway', 'VS AWAY'),
          color: vsAway < 0 ? INDEX_DELTA.dark.improved : A.DIM,
        });
      }
    }

    const golfers = (golfersRaw ?? []).filter((g) => g.userId !== profileId);
    const n = golfers.length;

    homeBlock = (
      <>
        {eyebrow}
        <div
          role={tappable ? 'button' : undefined}
          onClick={tappable ? () => navigate(`/courses/${first.id}`) : undefined}
          style={{
            marginTop: 9,
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            height: 132,
            cursor: tappable ? 'pointer' : 'default',
          }}
        >
          <CourseImageFallback
            courseId={first?.id}
            courseName={first?.name ?? homeClub.name}
            imageUrl={first?.thumbnail_image}
            flatWhenEmpty
            style={{ position: 'absolute', inset: 0 }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(0deg, rgba(10,14,10,0.84), rgba(10,14,10,0) 62%)',
            }}
          />
          {multi && (
            <div
              style={{
                position: 'absolute',
                top: 9,
                right: 9,
                background: 'rgba(10,14,10,0.55)',
                borderRadius: 999,
                padding: '3px 9px',
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.82)',
                ...FIGS,
              }}
            >
              {t('clubs.courseCount', '{{n}} COURSES', { n: courses.length })}
            </div>
          )}
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.2, color: '#FFFFFF' }}>
              {homeClub.name}
            </div>
            {subline && (
              <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.74)' }}>
                {subline}
              </div>
            )}
          </div>
        </div>

        {figures.length > 0 && (
          <div
            style={{
              marginTop: 11,
              display: 'grid',
              gridTemplateColumns: `repeat(${figures.length === 3 ? 3 : 2}, 1fr)`,
            }}
          >
            {figures.map((f) => (
              <div key={f.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: f.color ?? A.INK, ...FIGS }}>
                  {f.value}
                </div>
                <div style={{ marginTop: 4, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM }}>
                  {f.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {n > 0 && (
          <div
            role="button"
            onClick={() => navigate('/golferstofollow')}
            style={{
              marginTop: 13,
              paddingTop: 12,
              borderTop: `1px solid ${A.SOFT}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', flexShrink: 0 }}>
              {golfers.slice(0, 5).map((g, i) => (
                <div
                  key={g.userId}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    border: `2px solid ${A.CANVAS}`,
                    marginLeft: i === 0 ? 0 : -8,
                    background: A.PANEL,
                    overflow: 'hidden',
                  }}
                >
                  {g.photoUrl && (
                    <img src={g.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, color: A.BODY }}>
              {viewerSharesClub ? (
                <>
                  {t('clubs.peopleSharedA', 'You and ')}
                  <b style={{ color: A.INK, ...FIGS }}>{n}</b>
                  {t('clubs.peopleSharedB', ' others here are on clbhouz')}
                </>
              ) : (
                <>
                  <b style={{ color: A.INK, ...FIGS }}>{n}</b>
                  {t('clubs.peopleB', ' members are on clbhouz')}
                </>
              )}
            </div>
            <ChevronRight size={16} style={{ marginLeft: 'auto', color: A.DIM, flexShrink: 0 }} />
          </div>
        )}
      </>
    );
  }

  return wrap(
    <>
      {homeBlock}
      {displayedSecondary.length > 0 && (
        <div style={{ marginTop: homeClub ? 18 : 0 }}>
          <div style={{ ...EYEBROW, color: A.DIM }}>{t('clubs.alsoMember', 'ALSO A MEMBER AT')}</div>
          <div style={{ marginTop: 4 }}>
            {displayedSecondary.map((club, i) => {
              const first = (coursesByClub[club.id] ?? [])[0];
              const count = roundsAtClub(club.id).length;
              return (
                <div
                  key={club.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 0',
                    borderTop: i === 0 ? undefined : `1px solid ${A.SOFT}`,
                  }}
                >
                  <div style={{ position: 'relative', width: 34, height: 26, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                    <CourseImageFallback
                      courseId={first?.id}
                      courseName={first?.name ?? club.name}
                      imageUrl={first?.thumbnail_image}
                      initialsSize={9}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {club.name}
                  </div>
                  {qualifying.length > 0 && (
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.30)', ...FIGS }}>
                      {t('clubs.roundsCount', '{{n}} ROUNDS', { n: count })}
                    </div>
                  )}
                </div>
              );
            })}
            {remainingCount > 0 && (
              <div style={{ padding: '9px 0', borderTop: `1px solid ${A.SOFT}`, fontSize: 12.5, fontWeight: 600, color: A.MUTE }}>
                {t('clubs.more', '+ {{n}} more', { n: remainingCount })}
              </div>
            )}
          </div>
        </div>
      )}
    </>,
  );
};

export default ClubsCard;
