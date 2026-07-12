import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, BadgeCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses, type BusinessMembership } from '@/hooks/useMyBusinesses';
import { AMBER, INK, INK_FAINT } from '@/features/courses/_shared/tokens';
import { AppLog } from '@/lib/logger';

interface ClaimCourseSheetProps {
  open: boolean;
  onClose: () => void;
  clubId: string;
  clubName: string;
  sourceCourseId?: string;
}

const HAIRLINE = 'rgba(15,23,42,0.08)';

const createUrl = (clubId: string, clubName: string, sourceCourseId?: string) => {
  const p = new URLSearchParams({ category: 'golf_club', clubId, clubName });
  if (sourceCourseId) p.set('sourceCourseId', sourceCourseId);
  return `/business/create?${p.toString()}`;
};

const businessLocation = (b: BusinessMembership['business']) =>
  [b.city, b.region, b.country].filter(Boolean).join(', ') || b.location || '';

const PrimaryButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, loading, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    className="w-full h-[52px] rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
    style={{
      background: disabled ? 'rgba(15,23,42,0.06)' : AMBER,
      color: disabled ? 'rgba(15,23,42,0.38)' : '#FFFFFF',
      border: 'none',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
    }}
  >
    {loading ? <Loader2 size={18} className="animate-spin" /> : children}
  </button>
);

const ClaimCourseSheet: React.FC<ClaimCourseSheetProps> = ({
  open,
  onClose,
  clubId,
  clubName,
  sourceCourseId,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: memberships, isLoading } = useMyBusinesses(user?.id);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { claimable, linkedGolf, hasAnyBusiness, hasGolfBusiness } = useMemo(() => {
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
      hasAnyBusiness: list.length > 0,
      hasGolfBusiness: golf.length > 0,
    };
  }, [memberships]);

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

  const goToCreate = () => {
    onClose();
    navigate(createUrl(clubId, clubName, sourceCourseId));
  };

  const handleSubmitClaim = async () => {
    if (!selectedId || submitting) return;
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
          'Could not submit claim. Please try again.';
        setErrorMessage(String(msg));
        setSubmitting(false);
        return;
      }
      toast.success('Claim submitted for review.');
      onClose();
    } catch (err) {
      AppLog.error('[ClaimCourseSheet]', 'submit failed', err);
      setErrorMessage('Could not submit claim. Please try again.');
      setSubmitting(false);
    }
  };

  // --- Render ---
  const renderHeader = () => (
    <div style={{ padding: '4px 0 12px' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'rgba(247,147,30,0.12)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <BadgeCheck size={20} color={AMBER} strokeWidth={2.2} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>
        Claim {clubName}
      </h2>
    </div>
  );

  const renderBody = () => {
    if (!user) {
      return (
        <>
          <p style={{ fontSize: 14, color: INK_FAINT, lineHeight: 1.5, marginBottom: 16 }}>
            Sign in to claim this course.
          </p>
          <PrimaryButton onClick={() => { onClose(); navigate('/auth'); }}>
            Sign in
          </PrimaryButton>
        </>
      );
    }

    if (isLoading) {
      return (
        <div style={{ padding: '24px 0' }}>
          <div style={{ height: 14, width: '70%', background: 'rgba(15,23,42,0.06)', borderRadius: 6, marginBottom: 12 }} />
          <div style={{ height: 60, background: 'rgba(15,23,42,0.04)', borderRadius: 14, marginBottom: 12 }} />
          <div style={{ height: 60, background: 'rgba(15,23,42,0.04)', borderRadius: 14 }} />
        </div>
      );
    }

    // State A: at least one claimable (unlinked) golf-club business
    if (claimable.length > 0) {
      return (
        <>
          <p style={{ fontSize: 14, color: INK_FAINT, lineHeight: 1.5, marginBottom: 12 }}>
            Claim this course for your golf club profile. We will review it before it goes live.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {claimable.map((m) => {
              const selected = selectedId === m.business.id;
              return (
                <button
                  key={m.business.id}
                  type="button"
                  onClick={() => setSelectedId(m.business.id)}
                  className="w-full flex items-center gap-3 text-left transition-all active:scale-[0.99]"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: '#FFFFFF',
                    border: `1.5px solid ${selected ? AMBER : HAIRLINE}`,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: '#F4F4F5',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {m.business.logo_url ? (
                      <img src={m.business.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <BadgeCheck size={18} color={INK_FAINT} />
                    )}
                    <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 10, border: '1px solid rgba(15,23,42,0.12)', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
                      {m.business.name}
                    </div>
                    {businessLocation(m.business) && (
                      <div style={{ fontSize: 12, color: INK_FAINT, marginTop: 2 }}>
                        {businessLocation(m.business)}
                      </div>
                    )}
                  </div>
                  {selected && (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: AMBER,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={14} color="#FFF" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {errorMessage && (
            <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12, textAlign: 'center' }}>
              {errorMessage}
            </p>
          )}

          <PrimaryButton
            onClick={handleSubmitClaim}
            disabled={!selectedId}
            loading={submitting}
          >
            Claim as {claimable.find((m) => m.business.id === selectedId)?.business.name ?? 'business'}
          </PrimaryButton>

          <p style={{ fontSize: 11, color: INK_FAINT, marginTop: 10, textAlign: 'center' }}>
            Claiming covers all listings of this club on clbhouz.
          </p>

          <button
            type="button"
            onClick={goToCreate}
            className="w-full mt-3 text-[13px] font-semibold"
            style={{ color: AMBER, padding: '8px 0' }}
          >
            Set up a new golf club profile instead
          </button>

          {linkedGolf.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${HAIRLINE}` }}>
              {linkedGolf.map((m) => (
                <p
                  key={m.business.id}
                  style={{ fontSize: 12, color: INK_FAINT, lineHeight: 1.5, marginBottom: 4 }}
                >
                  {m.business.name} already manages another club and cannot claim a second course.
                </p>
              ))}
            </div>
          )}
        </>
      );
    }

    // State B: only linked golf-club businesses (no claimable)
    if (linkedGolf.length > 0) {
      const first = linkedGolf[0].business;
      const bodyCopy =
        linkedGolf.length === 1
          ? `Your golf club profile ${first.name} already manages another club. A business can manage one club, so set up a separate Golf Club profile for ${clubName}.`
          : `Your golf club profiles already manage other clubs. A business can manage one club, so set up a separate Golf Club profile for ${clubName}.`;
      return (
        <>
          <p style={{ fontSize: 14, color: INK_FAINT, lineHeight: 1.5, marginBottom: 16 }}>
            {bodyCopy}
          </p>
          <PrimaryButton onClick={goToCreate}>
            Set up a Golf Club profile
            <ArrowRight size={16} />
          </PrimaryButton>
        </>
      );
    }

    // State C: businesses exist but none are Golf Club
    if (hasAnyBusiness && !hasGolfBusiness) {
      const first = (memberships ?? [])[0]?.business;
      const cat = first?.category || 'business';
      return (
        <>
          <p style={{ fontSize: 14, color: INK_FAINT, lineHeight: 1.5, marginBottom: 16 }}>
            Claiming a course needs a Golf Club profile. Your {cat} profile cannot manage a course. Set up a Golf Club profile to claim {clubName}.
          </p>
          <PrimaryButton onClick={goToCreate}>
            Set up a Golf Club profile
            <ArrowRight size={16} />
          </PrimaryButton>
        </>
      );
    }

    // State D: no businesses
    return (
      <>
        <p style={{ fontSize: 14, color: INK_FAINT, lineHeight: 1.5, marginBottom: 16 }}>
          Set up a Golf Club profile to claim this course and manage its details, reviews, and updates.
        </p>
        <PrimaryButton onClick={goToCreate}>
          Set up Golf Club profile
          <ArrowRight size={16} />
        </PrimaryButton>
      </>
    );
  };

  return (
    <BottomSheet open={open} onClose={onClose} variant="light">
      <div style={{ padding: '20px 20px 28px' }}>
        {renderHeader()}
        {renderBody()}
      </div>
    </BottomSheet>
  );
};

export default ClaimCourseSheet;
