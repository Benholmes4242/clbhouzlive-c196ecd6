/**
 * TripDetailSheetV2 - Bottom sheet for viewing trip details
 * 
 * Anonymous view until accepted:
 * - Pre-accept: shows trip info + anonymous organizer blurb
 * - Post-accept: shows organizer identity + participants
 * 
 * Matches GameDetailSheetV2 design language
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Users, Calendar, UserPlus, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

import { useTripDetail } from '@/features/hub/hooks/useTripDetail';
import { TrustSignals } from '../discover-games/TrustSignals';
import HcpBadge from '@/components/HcpBadge';

interface TripDetailSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onRequestJoin?: () => void;
  isRequesting?: boolean;
}

// Glass card component
function DetailCard({ 
  icon: Icon, 
  title, 
  subtitle,
  accent = false,
}: { 
  icon: React.ElementType; 
  title: string; 
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <div 
      className="flex items-center gap-3.5 p-4 rounded-2xl transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.03)',
      }}
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: accent ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <Icon 
          className="w-5 h-5" 
          style={{ color: accent ? 'rgb(59, 130, 246)' : 'rgba(30, 41, 59, 0.45)' }} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <div 
          className="font-medium text-[14px] leading-snug"
          style={{ color: '#1e293b' }}
        >
          {title}
        </div>
        {subtitle && (
          <div 
            className="text-[12px] mt-0.5"
            style={{ color: 'rgba(30, 41, 59, 0.5)' }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function TripDetailSheetV2({
  isOpen,
  onClose,
  tripId,
  onRequestJoin,
  isRequesting,
}: TripDetailSheetV2Props) {
  // Scroll lock refs
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);

  // Data hooks
  const { data: trip, isLoading } = useTripDetail(isOpen ? tripId : null);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollYRef.current);
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  const handleRequestJoin = useCallback(() => {
    haptic('medium');
    onRequestJoin?.();
  }, [onRequestJoin]);

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;

  // Format trip dates
  const formatTripDates = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = differenceInDays(end, start) + 1;
    return {
      range: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
      duration: `${days} day${days !== 1 ? 's' : ''}`,
    };
  };

  // CTA state
  const getCTAState = () => {
    if (!trip) return { label: 'Loading...', disabled: true, style: 'bg-muted text-muted-foreground' };
    
    switch (trip.userRequestStatus) {
      case 'going':
        return { 
          label: "You're in ✅", 
          disabled: true, 
          style: 'bg-emerald-100 text-emerald-700',
          icon: CheckCircle
        };
      case 'invited':
        return { 
          label: "You're invited ✅", 
          disabled: true, 
          style: 'bg-emerald-100 text-emerald-700',
          icon: CheckCircle
        };
      case 'requested':
        return { 
          label: 'Requested', 
          disabled: true, 
          style: 'bg-amber-100 text-amber-700'
        };
      default:
        if (trip.slotsOpen <= 0) {
          return { 
            label: 'Full', 
            disabled: true, 
            style: 'bg-muted text-muted-foreground'
          };
        }
        return { 
          label: 'Request to join', 
          disabled: false, 
          style: 'bg-[#0F4C2E] text-white',
          icon: UserPlus
        };
    }
  };

  const cta = getCTAState();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10001]"
            style={{
              background: 'rgba(0, 0, 0, 0.18)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={handleClose}
          />

          {/* Stacked sheet CSS */}
          <style>{`
            .discover-games-sheet-wrapper {
              transition: transform 0.25s ease-out, opacity 0.25s ease-out;
            }
            .discover-games-sheet-wrapper.stacked-behind {
              transform: scale(0.985);
              opacity: 0.96;
            }
          `}</style>

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[24px] overflow-hidden"
            style={{
              height: '92svh',
              maxHeight: '92svh',
              backgroundColor: '#F9FAFB',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div 
                className="w-9 h-[3px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.08)' }}
              />
            </div>

            {/* Header */}
            <div 
              className="flex items-center gap-3 px-4 pt-1 pb-3 flex-shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <button
                onClick={handleClose}
                className="p-2 -ml-2 rounded-full transition-colors hover:bg-black/5"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: 'rgba(30, 41, 59, 0.7)' }} />
              </button>

              {/* Fixed height header */}
              <div className="flex-1 min-w-0 min-h-[44px] flex flex-col justify-center">
                {isLoading || !trip ? (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-5 w-36 bg-black/5 rounded-lg" />
                    <div className="h-3 w-24 bg-black/5 rounded-lg" />
                  </div>
                ) : (
                  <>
                    <h2 
                      className="text-[17px] font-semibold leading-tight truncate"
                      style={{ color: '#1e293b', letterSpacing: '-0.01em' }}
                    >
                      {trip.title}
                    </h2>
                    <p 
                      className="text-[12px]"
                      style={{ color: 'rgba(30, 41, 59, 0.5)' }}
                    >
                      {formatTripDates(trip.startDate, trip.endDate).range}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Divider */}
            <div 
              className="h-px flex-shrink-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 15%, rgba(0,0,0,0.06) 85%, transparent 100%)',
              }}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-28">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : trip ? (
                <div className="space-y-4">
                  {/* Cover image if available */}
                  {trip.coverImageUrl && (
                    <div className="rounded-2xl overflow-hidden h-40 bg-muted">
                      <img 
                        src={trip.coverImageUrl} 
                        alt={trip.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Trip info cards */}
                  <div className="space-y-3">
                    {/* Dates */}
                    <DetailCard
                      icon={Calendar}
                      title={formatTripDates(trip.startDate, trip.endDate).range}
                      subtitle={formatTripDates(trip.startDate, trip.endDate).duration}
                      accent
                    />

                    {/* Slots */}
                    <DetailCard
                      icon={Users}
                      title={`${trip.participantCount} golfer${trip.participantCount !== 1 ? 's' : ''} going`}
                      subtitle={trip.slotsOpen > 0 
                        ? `${trip.slotsOpen} spot${trip.slotsOpen !== 1 ? 's' : ''} available`
                        : 'Trip full'
                      }
                    />

                    {/* Description */}
                    {trip.description && (
                      <div 
                        className="p-4 rounded-2xl"
                        style={{
                          background: 'rgba(255, 255, 255, 0.7)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                          border: '1px solid rgba(0, 0, 0, 0.03)',
                        }}
                      >
                        <div 
                          className="text-[11px] font-medium uppercase tracking-wide mb-1.5"
                          style={{ color: 'rgba(30, 41, 59, 0.4)' }}
                        >
                          Description
                        </div>
                        <p 
                          className="text-[14px] leading-relaxed"
                          style={{ color: '#1e293b' }}
                        >
                          {trip.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Organizer section */}
                  <div 
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.7)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      border: '1px solid rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <div 
                      className="text-[11px] font-medium uppercase tracking-wide mb-3"
                      style={{ color: 'rgba(30, 41, 59, 0.4)' }}
                    >
                      {trip.canSeeIdentity ? 'Organizer' : 'Trip host'}
                    </div>

                    {trip.canSeeIdentity && trip.organizer ? (
                      // Revealed identity
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                          {trip.organizer.displayName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[15px] text-foreground">
                              {trip.organizer.displayName}
                            </span>
                            <HcpBadge 
                              value={trip.organizer.handicap} 
                              show={true}
                              className="text-muted-foreground text-[11px]"
                            />
                          </div>
                          {trip.organizer.username && (
                            <p className="text-[12px] text-muted-foreground">
                              @{trip.organizer.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Anonymous view
                      <div className="space-y-2">
                        <p 
                          className="text-[13px]"
                          style={{ color: 'rgba(30, 41, 59, 0.7)' }}
                        >
                          {trip.organizerBlurb.handicap !== null 
                            ? `Handicap ${Math.round(trip.organizerBlurb.handicap)}`
                            : 'Handicap hidden'
                          }
                          {trip.organizerBlurb.homeClub && (
                            <> • {trip.organizerBlurb.homeClub}</>
                          )}
                        </p>
                        
                        {/* Trust signals */}
                        <TrustSignals
                          isVerified={trip.organizerBlurb.isVerified}
                          showsHandicap={trip.organizerBlurb.showsHandicap}
                          showsHomeClub={trip.organizerBlurb.showsHomeClub}
                        />

                        <p 
                          className="text-[11px] italic"
                          style={{ color: 'rgba(30, 41, 59, 0.4)' }}
                        >
                          Identity revealed after joining
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Participants (only if can see identity) */}
                  {trip.canSeeIdentity && trip.participants.length > 0 && (
                    <div 
                      className="p-4 rounded-2xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      <div 
                        className="text-[11px] font-medium uppercase tracking-wide mb-3"
                        style={{ color: 'rgba(30, 41, 59, 0.4)' }}
                      >
                        Participants ({trip.participants.length})
                      </div>

                      <div className="space-y-2">
                        {trip.participants.map((p) => (
                          <div 
                            key={p.odUserId} 
                            className="flex items-center gap-3 py-2"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                              {p.displayName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-[13px] text-foreground truncate">
                                  {p.displayName}
                                </span>
                                <HcpBadge 
                                  value={p.handicap} 
                                  show={p.showHandicap}
                                  className="text-muted-foreground text-[10px]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* CTA Footer */}
            <div 
              className="absolute bottom-0 left-0 right-0 px-5 py-4"
              style={{ 
                background: 'rgba(249, 250, 251, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <button
                onClick={handleRequestJoin}
                disabled={cta.disabled || isRequesting}
                className={cn(
                  "w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-150",
                  cta.style,
                  (cta.disabled || isRequesting) && "opacity-80 cursor-not-allowed"
                )}
              >
                {isRequesting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {cta.icon && <cta.icon className="w-5 h-5" />}
                    {cta.label}
                  </span>
                )}
              </button>

              {trip?.userRequestStatus === 'requested' && (
                <p 
                  className="text-[11px] text-center mt-2"
                  style={{ color: 'rgba(100, 116, 139, 0.7)' }}
                >
                  Waiting for organizer approval
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
