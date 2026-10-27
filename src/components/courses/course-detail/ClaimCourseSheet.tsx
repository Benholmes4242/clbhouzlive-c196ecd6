/**
 * CLAIM SHEET REBUILD — presentation follows claim-sheet-signed-off.html
 * exactly; the claim LOGIC is unchanged (same memberships, same
 * request-course-claim body, same create URL, same states).
 *
 * Figures are for sourceCourseId and reuse the shared hooks so nothing is
 * fetched twice: useCourseStatsDetail (rounds), useCourseHoleAnalysis (hole
 * strip), useCourseReviewSample + reviewsCommunitySample (rating), and
 * useCourseMediaCounts (photos). useUnansweredReviewCount is the sheet's own
 * open-gated read. Every section drops out when its data is missing.
 *
 * The hole strip reuses ClubHowItPlays' pickHardestHole/holeBarHeights so the
 * club page and this sheet name the same hardest hole. Stroke index is never
 * mentioned in copy — that comparison was removed from the product.
 */
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGolfClub } from '@/features/business/claimClub';
import {
  Loader2, Check, ArrowRight, X, MessageSquare, BarChart3, Eye, Calendar,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses, type BusinessMembership } from '@/hooks/useMyBusinesses';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { useCourseReviewSample } from '@/hooks/useCourseReviewSample';
import { useCourseMediaCounts } from '@/hooks/useCourseMediaCounts';
import { useUnansweredReviewCount } from '@/hooks/useUnansweredReviewCount';
import { reviewsCommunitySample } from '@/lib/reviews/communitySample';
import { hasCommunityAverage } from '@/lib/reviews/sampleRules';
import { pickHardestHole, holeBarHeights } from '@/components/business/ClubHowItPlays';
import { ordinal } from '@/lib/text/numbers';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { AppLog } from '@/lib/logger';

interface ClaimCourseSheetProps {
  open: boolean;
  onClose: () => void;
  clubId: string;
  sourceCourseId?: string;
}

/* Mock tokens (claim-sheet-signed-off.html). */
const SHEET = '#16161A';
const INKC = '#F8FAFC';
const ON_INK = '#0A0A0C';
const MUTE = 'rgba(248,250,252,0.62)';
const DIM = 'rgba(248,250,252,0.42)';
const TRACK = 'rgba(255,255,255,0.08)';
const LABEL: React.CSSProperties = {
  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: DIM,
};
const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"zero" 0' };

// The club id is the only club fact carried in the URL; the editor reads the
// name (and geography) from golf_clubs by id.
const createUrl = (clubId: string, sourceCourseId?: string) => {
  const p = new URLSearchParams({ category: 'golf_club', clubId });
  if (sourceCourseId) p.set('sourceCourseId', sourceCourseId);
  return `/business/create?${p.toString()}`;
};

const businessLocation = (b: BusinessMembership['business']) =>
  [b.city, b.region, b.country].filter(Boolean).join(', ') || b.location || '';

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';

const LogoTile: React.FC<{ name: string; logoUrl: string | null }> = ({ name, logoUrl }) => (
  <div
    style={{
      width: 40, height: 40, borderRadius: 10, background: '#23262E', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: 13, fontWeight: 700, color: INKC,
    }}
  >
    {logoUrl ? (
      <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      initialsOf(name)
    )}
  </div>
);

const PrimaryButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, loading, children }) => (
  <button
    type="button"
    data-claim-primary=""
    onClick={onClick}
    disabled={disabled || loading}
    className="w-full flex items-center justify-center transition-all active:scale-[0.98]"
    style={{
      height: 52,
      borderRadius: 14,
      background: disabled ? 'rgba(255,255,255,0.06)' : INKC,
      color: disabled ? DIM : ON_INK,
      fontSize: 16,
      fontWeight: 650,
      gap: 8,
      border: 'none',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
    }}
  >
    {loading ? <Loader2 size={18} className="animate-spin" /> : (
      <>
        {children}
        <ArrowRight size={17} color={disabled ? DIM : ON_INK} strokeWidth={2.2} />
      </>
    )}
  </button>
);

const Footnote: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ fontSize: 12, lineHeight: 1.5, color: DIM, textAlign: 'center', marginTop: 14 }}>
    {text}
  </div>
);

const ClaimCourseSheet: React.FC<ClaimCourseSheetProps> = ({
  open,
  onClose,
  clubId,
  sourceCourseId,
}) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: memberships, isLoading } = useMyBusinesses(user?.id);
  const { data: club } = useQuery({
    queryKey: ['golf-club', clubId],
    enabled: open && !!clubId,
    staleTime: 10 * 60 * 1000,
    queryFn: () => fetchGolfClub(clubId),
  });
  const clubName = club?.name ?? '';

  /* §1 — figures for sourceCourseId, all shared cache entries. */
  const { data: stats } = useCourseStatsDetail(sourceCourseId, open);
  const { data: analysis } = useCourseHoleAnalysis(sourceCourseId);
  const { data: sampleRows } = useCourseReviewSample(sourceCourseId ?? '', user?.id);
  const { data: media } = useCourseMediaCounts(sourceCourseId);
  const { data: unanswered } = useUnansweredReviewCount(sourceCourseId, open);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { claimable, linkedGolf } = useMemo(() => {
    const list = memberships ?? [];
    const golf = list.filter(
      (m) =>
        m.business.category === 'Golf Club' &&
        !m.business.is_deleted &&
        (m.role === 'owner' || m.role === 'admin'),
    );
    return {
      claimable: golf.filter((m) => m.business.club_id == null),
      linkedGolf: golf.filter((m) => m.business.club_id != null),
    };
  }, [memberships]);

  /* The linked state's card names the club that profile already runs. */
  const linkedClubId = claimable.length === 0 && linkedGolf.length > 0
    ? linkedGolf[0].business.club_id
    : null;
  const { data: linkedClub } = useQuery({
    queryKey: ['golf-club', linkedClubId],
    enabled: open && !!linkedClubId,
    staleTime: 10 * 60 * 1000,
    queryFn: () => fetchGolfClub(linkedClubId as string),
  });

  // Auto-select first claimable when list resolves
  React.useEffect(() => {
    if (!selectedId && claimable.length > 0) {
      setSelectedId(claimable[0].business.id);
    }
  }, [claimable, selectedId]);

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setSubmitting(false);
      setErrorMessage(null);
    }
  }, [open]);

  /* §9 — analytics. Open is tracked once per opening, with the settled state. */
  const state: 'signed_out' | 'claimable' | 'linked' | 'no_profile' = !user
    ? 'signed_out'
    : claimable.length > 0
      ? 'claimable'
      : linkedGolf.length > 0
        ? 'linked'
        : 'no_profile';
  const trackedOpen = useRef(false);
  React.useEffect(() => {
    if (!open) { trackedOpen.current = false; return; }
    if (trackedOpen.current) return;
    if (user && isLoading) return;
    trackedOpen.current = true;
    analyticsEvents.track('claim_sheet_open', {
      state, club_id: clubId, course_id: sourceCourseId ?? null,
    });
  }, [open, user, isLoading, state, clubId, sourceCourseId]);

  const goToCreate = () => {
    analyticsEvents.track('claim_sheet_setup_profile', {
      club_id: clubId, course_id: sourceCourseId ?? null,
    });
    onClose();
    navigate(createUrl(clubId, sourceCourseId));
  };

  const handleSubmitClaim = async () => {
    if (!selectedId || submitting) return;
    analyticsEvents.track('claim_sheet_submit', {
      club_id: clubId, course_id: sourceCourseId ?? null,
    });
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('request-course-claim', {
        body: {
          business_id: selectedId,
          club_id: clubId,
          club_key: null,
          source_course_id: sourceCourseId ?? null,
          proof_note: null,
        },
      });
      if (error || (data && data.ok === false)) {
        const msg =
          (data && data.error) ||
          error?.message ||
          t('courseDetail.claim.sheet.submitError');
        setErrorMessage(String(msg));
        setSubmitting(false);
        return;
      }
      toast.success(t('courseDetail.claim.sheet.submitted'));
      onClose();
    } catch (err) {
      AppLog.error('[ClaimCourseSheet]', 'submit failed', err);
      setErrorMessage(t('courseDetail.claim.sheet.submitError'));
      setSubmitting(false);
    }
  };

  /* ---- §4 Already on clbhouz panel ---- */
  const rounds = stats?.rounds_tracked ?? 0;
  const community = useMemo(
    () => (sampleRows ? reviewsCommunitySample(sampleRows, user?.id) : null),
    [sampleRows, user?.id],
  );
  const showRounds = rounds > 0;
  const showRating = !!community && community.score != null && hasCommunityAverage(community.ratingCount);
  const photos = media?.photos ?? 0;
  const showPhotos = photos > 0;
  const holes = useMemo(() => analysis?.holes ?? [], [analysis]);
  const showHoles = holes.length >= 9;
  const unansweredCount = unanswered ?? 0;
  const showUnanswered = unansweredCount > 0;
  const showPanel = showRounds || showRating || showPhotos || showHoles || showUnanswered;

  const hardestNo = showHoles ? pickHardestHole(holes) : null;
  const hardestIdx = hardestNo != null ? holes.findIndex((h) => h.hole_no === hardestNo) : -1;
  const hardestHole = hardestIdx >= 0 ? holes[hardestIdx] : null;
  const barHeights = showHoles ? holeBarHeights(holes) : [];

  const renderPanel = () => {
    if (!showPanel) return null;
    return (
      <div
        data-claim-panel=""
        style={{
          marginTop: 20, padding: 16, borderRadius: 16,
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${TRACK}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={LABEL}>{t('courseDetail.claim.sheet.panelKicker')}</div>
          <div
            style={{ ...LABEL, fontSize: 8.5 }}
            data-claim-panel-state={rounds < 10 ? 'early' : 'live'}
          >
            {t(rounds < 10 ? 'courseDetail.claim.sheet.earlyData' : 'courseDetail.claim.sheet.live')}
          </div>
        </div>

        {(showRounds || showRating || showPhotos) && (
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {showRounds && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: INKC, lineHeight: 1, ...NUM }}>
                  {rounds}
                </div>
                <div style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>
                  {t('courseDetail.claim.sheet.roundsMeasured')}
                </div>
              </div>
            )}
            {showRating && community && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: INKC, lineHeight: 1, ...NUM }}>
                  {community.score?.toFixed(1)}
                </div>
                <div style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>
                  {t('courseDetail.claim.sheet.rated')}
                </div>
                <div style={{ fontSize: 11.5, color: MUTE, marginTop: 4, ...NUM }}>
                  {t('courseDetail.claim.sheet.reviewsCount', { count: community.ratingCount })}
                </div>
              </div>
            )}
            {showPhotos && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: INKC, lineHeight: 1, ...NUM }}>
                  {photos}
                </div>
                <div style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>
                  {t('courseDetail.claim.sheet.photos')}
                </div>
              </div>
            )}
          </div>
        )}

        {showHoles && hardestHole && (
          <>
            <div style={{ height: 1, background: TRACK, margin: '16px 0 14px' }} />
            <div style={{ ...LABEL, fontSize: 8.5, marginBottom: 12 }}>
              {t('courseDetail.claim.sheet.holeByHole')}
            </div>
            <div data-claim-hole-strip="" style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 56 }}>
              {holes.map((h, i) => (
                <div
                  key={h.hole_no}
                  data-claim-bar={h.hole_no === hardestNo ? 'hardest' : undefined}
                  style={{
                    flex: 1,
                    height: `${barHeights[i]}%`,
                    borderRadius: 3,
                    background: h.hole_no === hardestNo ? INKC : 'rgba(255,255,255,0.22)',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
              {holes.map((h, i) => {
                const isHardest = i === hardestIdx;
                const showNo = isHardest
                  || ((i === 0 || i === holes.length - 1 || (i + 1) % 3 === 0) && Math.abs(i - hardestIdx) > 1);
                return (
                  <div
                    key={h.hole_no}
                    style={{
                      flex: 1, textAlign: 'center', fontSize: 8.5,
                      fontWeight: isHardest ? 700 : 500,
                      color: isHardest ? INKC : DIM,
                      ...NUM,
                    }}
                  >
                    {showNo ? String(h.hole_no) : ''}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.45, color: MUTE, marginTop: 12 }}>
              {t('courseDetail.claim.sheet.hardestPre')}
              <span style={{ color: INKC, fontWeight: 600 }}>{ordinal(hardestHole.hole_no)}</span>
              {t('courseDetail.claim.sheet.hardestMid')}
              <span style={{ color: INKC, fontWeight: 600, ...NUM }}>
                +{hardestHole.avg_to_par.toFixed(2)}
              </span>
              {t('courseDetail.claim.sheet.hardestPost')}
            </div>
          </>
        )}

        {showUnanswered && (
          <div
            data-claim-unanswered=""
            style={{
              display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
              padding: '11px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)',
            }}
          >
            <MessageSquare size={16} color={INKC} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: MUTE }}>
              <span style={{ color: INKC, fontWeight: 600, ...NUM }}>
                {t('courseDetail.claim.sheet.unansweredCount', { count: unansweredCount })}
              </span>
              {t('courseDetail.claim.sheet.unansweredTail')}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ---- §5 When it's yours ---- */
  const gains: { icon: React.ReactNode; title: string; sub: string }[] = [
    {
      icon: <MessageSquare size={18} color={INKC} />,
      title: t('courseDetail.claim.sheet.gainReplyTitle'),
      sub: t('courseDetail.claim.sheet.gainReplySub'),
    },
    {
      icon: <BarChart3 size={18} color={INKC} />,
      title: t('courseDetail.claim.sheet.gainMeasuredTitle'),
      sub: t('courseDetail.claim.sheet.gainMeasuredSub'),
    },
    {
      icon: <Eye size={18} color={INKC} />,
      title: t('courseDetail.claim.sheet.gainInterestedTitle'),
      sub: t('courseDetail.claim.sheet.gainInterestedSub'),
    },
    {
      icon: <Calendar size={18} color={INKC} />,
      title: t('courseDetail.claim.sheet.gainTeeTimesTitle'),
      sub: t('courseDetail.claim.sheet.gainTeeTimesSub'),
    },
  ];

  const renderGains = () => (
    <div data-claim-gains="">
      <div style={{ ...LABEL, margin: '24px 0 4px' }}>{t('courseDetail.claim.sheet.gainsTitle')}</div>
      {gains.map((g, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderTop: `1px solid ${TRACK}` }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {g.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: INKC }}>{g.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.45, color: MUTE, marginTop: 3 }}>{g.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );

  /* ---- §6 How it works ---- */
  const renderSteps = () => {
    const step1Done = claimable.length > 0;
    const steps = [
      t('courseDetail.claim.sheet.stepProfile'),
      t('courseDetail.claim.sheet.stepClaim'),
      t('courseDetail.claim.sheet.stepHandover'),
    ];
    return (
      <>
        <div style={{ height: 1, background: TRACK, margin: '6px 0 20px' }} />
        <div style={{ ...LABEL, marginBottom: 14 }}>{t('courseDetail.claim.sheet.stepsTitle')}</div>
        <div data-claim-steps="" style={{ display: 'flex', alignItems: 'flex-start' }}>
          {steps.map((label, i) => {
            const done = i === 0 && step1Done;
            return (
              <div
                key={i}
                data-claim-step={done ? 'done' : 'todo'}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  textAlign: 'center', position: 'relative',
                }}
              >
                {i > 0 && (
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute', top: 13, right: '50%', width: '100%', height: 1,
                      background: TRACK,
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'relative', width: 26, height: 26, borderRadius: 13,
                    border: `1px solid ${done ? INKC : 'rgba(255,255,255,0.18)'}`,
                    background: done ? INKC : SHEET,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: done ? ON_INK : MUTE, ...NUM,
                  }}
                >
                  {done ? <Check size={14} color={ON_INK} strokeWidth={2.6} /> : String(i + 1)}
                </div>
                <div
                  style={{
                    fontSize: 11.5, fontWeight: 600, color: done ? MUTE : INKC,
                    marginTop: 8, lineHeight: 1.35, padding: '0 4px',
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 1, background: TRACK, margin: '22px 0 18px' }} />
      </>
    );
  };

  /* ---- §7 button area, by the existing states ---- */
  const renderActions = () => {
    if (!user) {
      return (
        <div data-claim-actions="">
          <p style={{ fontSize: 13.5, lineHeight: 1.5, color: MUTE, marginBottom: 14 }}>
            {t('courseDetail.claim.sheet.signInBody')}
          </p>
          <PrimaryButton onClick={() => { onClose(); navigate('/auth'); }}>
            {t('courseDetail.claim.sheet.signIn')}
          </PrimaryButton>
          <Footnote text={t('courseDetail.claim.sheet.footnote')} />
        </div>
      );
    }

    if (isLoading) {
      return (
        <div data-claim-actions="" style={{ padding: '4px 0' }}>
          <div style={{ height: 14, width: '70%', background: TRACK, borderRadius: 6, marginBottom: 12 }} />
          <div style={{ height: 60, background: 'rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 12 }} />
          <div style={{ height: 52, background: 'rgba(255,255,255,0.06)', borderRadius: 14 }} />
        </div>
      );
    }

    if (claimable.length > 0) {
      return (
        <div data-claim-actions="">
          <div style={{ ...LABEL, marginBottom: 10 }}>{t('courseDetail.claim.sheet.claimAsLabel')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {claimable.map((m) => {
              const selected = selectedId === m.business.id;
              return (
                <button
                  key={m.business.id}
                  type="button"
                  data-claim-profile-card=""
                  data-claim-selected={selected ? 'true' : undefined}
                  onClick={() => setSelectedId(m.business.id)}
                  className="w-full flex items-center text-left transition-all active:scale-[0.99]"
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    gap: 12,
                    background: selected ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: `1px solid ${selected ? INKC : TRACK}`,
                  }}
                >
                  <LogoTile name={m.business.name} logoUrl={m.business.logo_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: INKC }}>{m.business.name}</div>
                    <div style={{ fontSize: 12.5, color: MUTE, marginTop: 2 }}>
                      {t('courseDetail.claim.sheet.golfClubProfile')}
                      {businessLocation(m.business) ? ` · ${businessLocation(m.business)}` : ''}
                    </div>
                  </div>
                  {selected && (
                    <div
                      style={{
                        width: 22, height: 22, borderRadius: 11, background: INKC,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}
                    >
                      <Check size={13} color={ON_INK} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {errorMessage && (
            <p style={{ fontSize: 13, color: '#E24B3F', marginTop: 12, textAlign: 'center' }}>
              {errorMessage}
            </p>
          )}

          <div style={{ height: 14 }} />
          <PrimaryButton
            onClick={handleSubmitClaim}
            disabled={!selectedId}
            loading={submitting}
          >
            {t('courseDetail.claim.sheet.claimButton', { clubName })}
          </PrimaryButton>

          <button
            type="button"
            onClick={goToCreate}
            className="w-full mt-3 text-[13px] font-semibold"
            style={{ color: MUTE, padding: '8px 0' }}
          >
            {t('courseDetail.claim.sheet.setupInstead')}
          </button>
          <Footnote text={t('courseDetail.claim.sheet.footnote')} />
        </div>
      );
    }

    if (linkedGolf.length > 0) {
      const first = linkedGolf[0].business;
      return (
        <div data-claim-actions="">
          <div
            data-claim-profile-card=""
            className="flex items-center"
            style={{
              padding: 12, borderRadius: 14, gap: 12,
              border: `1px solid ${TRACK}`, background: 'rgba(255,255,255,0.03)',
            }}
          >
            <LogoTile name={first.name} logoUrl={first.logo_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: INKC }}>{first.name}</div>
              <div style={{ fontSize: 12.5, color: MUTE, marginTop: 2 }}>
                {t('courseDetail.claim.sheet.alreadyRuns', { name: linkedClub?.name ?? first.name })}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.5, color: MUTE, margin: '12px 0 14px' }}>
            {t('courseDetail.claim.sheet.linkedBody', { clubName })}
          </p>
          <PrimaryButton onClick={goToCreate}>
            {t('courseDetail.claim.sheet.setupForClub')}
          </PrimaryButton>
          <Footnote text={t('courseDetail.claim.sheet.footnote')} />
        </div>
      );
    }

    /* No Golf Club profile, or profiles only in other categories. */
    return (
      <div data-claim-actions="">
        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: MUTE, marginBottom: 14 }}>
          {t('courseDetail.claim.sheet.noProfileBody')}
        </p>
        <PrimaryButton onClick={goToCreate}>
          {t('courseDetail.claim.sheet.setupGolfClub')}
        </PrimaryButton>
        <Footnote text={t('courseDetail.claim.sheet.footnote')} />
      </div>
    );
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      topRadius={28}
      grabberPadding="8px 0 0"
      scrollBody
      style={{ paddingBottom: 0 }}
    >
      <div
        style={{
          position: 'relative',
          padding: '28px 20px 0',
          paddingBottom: 'calc(34px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <button
          type="button"
          aria-label={t('courseDetail.claim.sheet.close')}
          onClick={onClose}
          style={{
            position: 'absolute', top: 4, right: 16, width: 32, height: 32, borderRadius: 16,
            background: 'rgba(255,255,255,0.06)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <X size={16} color={INKC} />
        </button>

        <div data-claim-header="">
          <div style={LABEL}>{t('courseDetail.claim.sheet.kicker')}</div>
          <h2
            style={{
              fontSize: 21, fontWeight: 700, color: INKC, lineHeight: 1.25,
              marginTop: 7, paddingRight: 36,
            }}
          >
            {t('courseDetail.claim.sheet.title', { clubName })}
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: MUTE, marginTop: 8 }}>
            {t('courseDetail.claim.sheet.subline')}
          </p>
        </div>

        {renderPanel()}
        {renderGains()}
        {renderSteps()}
        {renderActions()}
      </div>
    </BottomSheet>
  );
};

export default ClaimCourseSheet;
