/**
 * TripDetailContent - Content component for trip detail sheet
 * Matches GameDetailContent structure exactly with:
 * - Header actions row (Invite button + overflow menu)
 * - Tab pills (Details, Messages, Players)
 * - Glass cards for details
 * - RSVP footer with status buttons
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Calendar, MoreVertical, UserPlus, ExternalLink, Pencil, Share2, LogOut, Trash2, Flag, Globe, Lock, UserCheck, Check, HelpCircle, X } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { haptic } from '@/utils/haptics';
import { TripDetailTabPills, type TripDetailTab } from './TripDetailTabPills';
import { TripTimeline } from './TripTimeline';
import { InviteToTripModal } from '../invite/InviteToTripModal';
import { RsvpStatusLabel } from '../shared-detail/RsvpStatusLabel';
import { useTripRsvp, type TripRsvpStatus } from '../../hooks/useTripRsvp';
import type { TripData, TripParticipant, TripTimelineItem } from '../../hooks/useTripTimeline';

interface TripDetailContentProps {
  trip: TripData;
  participants: TripParticipant[];
  timeline: TripTimelineItem[];
  currentUserId: string | null;
  isHost: boolean;
  todayDayNumber?: number;
  hasMultipleDays?: boolean;
  hasTodayInTrip?: boolean;
  activeTab: TripDetailTab;
  onTabChange: (tab: TripDetailTab) => void;
  onOpenFullPage?: () => void;
  onAddRound?: () => void;
  onGameTap?: (gameId: string) => void;
  onShowRemoveDialog?: () => void;
  onShowLeaveDialog?: () => void;
  onInviteSuccess?: () => void;
}

// V2 Glass Card component for details - warm polish styling
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
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
      }}
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: accent 
            ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' 
            : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
        }}
      >
        <Icon 
          className="w-5 h-5" 
          style={{ color: accent ? 'rgb(59, 130, 246)' : 'rgba(30, 41, 59, 0.5)' }} 
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

export function TripDetailContent({
  trip,
  participants,
  timeline,
  currentUserId,
  isHost,
  todayDayNumber,
  hasMultipleDays,
  hasTodayInTrip,
  activeTab,
  onTabChange,
  onOpenFullPage,
  onAddRound,
  onGameTap,
  onShowRemoveDialog,
  onShowLeaveDialog,
  onInviteSuccess,
}: TripDetailContentProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  const dayCount = differenceInDays(trip.endDate, trip.startDate) + 1;
  const joinedCount = participants.filter(p => p.rsvpStatus === 'going').length;
  const maybeCount = participants.filter(p => p.rsvpStatus === 'maybe').length;
  const invitedCount = participants.filter(p => p.rsvpStatus === 'invited').length;
  
  // Get current user's RSVP status
  const currentUserParticipant = participants.find(p => p.userId === currentUserId);
  const currentUserRsvp = currentUserParticipant?.rsvpStatus as TripRsvpStatus | null;
  
  // RSVP hook for updating status
  const { setRsvp, isUpdating } = useTripRsvp(trip.id);
  
  const visibilityIcon = trip.visibility === 'invite' ? Lock : 
                         trip.visibility === 'friends' ? UserCheck : Globe;
  const visibilityLabel = trip.visibility === 'invite' ? 'Invite only' : 
                          trip.visibility === 'friends' ? 'Friends' : 'Public';

  const handleRsvpChange = (status: TripRsvpStatus) => {
    if (isUpdating) return;
    haptic('light');
    setRsvp(status);
  };

  return (
    <>
      {/* Header actions row - matches Game sheet exactly */}
      <div className="flex items-center justify-end gap-2 px-5 py-2 flex-shrink-0">
        {/* Invite button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            haptic('light');
            setInviteModalOpen(true);
          }}
          className="h-8 gap-1.5 text-xs rounded-full border-black/10 hover:bg-black/5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite
        </Button>

        {/* Overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full transition-colors hover:bg-black/5">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {onOpenFullPage && (
              <DropdownMenuItem 
                onClick={onOpenFullPage}
                className="gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open full page
              </DropdownMenuItem>
            )}

            {isHost && (
              <DropdownMenuItem className="gap-2 text-sm">
                <Pencil className="w-4 h-4" />
                Edit trip
              </DropdownMenuItem>
            )}

            <DropdownMenuItem className="gap-2 text-sm">
              <Share2 className="w-4 h-4" />
              Share trip
            </DropdownMenuItem>

            {!isHost && onShowLeaveDialog && (
              <DropdownMenuItem 
                onClick={onShowLeaveDialog}
                className="gap-2 text-sm text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Leave trip
              </DropdownMenuItem>
            )}

            {isHost && onShowRemoveDialog && (
              <DropdownMenuItem 
                onClick={onShowRemoveDialog}
                className="gap-2 text-sm text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Remove trip
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pill tabs - matching V2 design */}
      <div className="px-5 pb-3 flex-shrink-0">
        <TripDetailTabPills
          activeTab={activeTab}
          onTabChange={onTabChange}
          participantCount={joinedCount}
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {activeTab === 'details' && (
          <div className="space-y-3">
            {/* Cover image */}
            {trip.coverImageUrl && (
              <div className="w-full h-40 rounded-2xl overflow-hidden bg-muted -mt-1 mb-4">
                <img
                  src={trip.coverImageUrl}
                  alt={trip.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Date & Duration Card */}
            <DetailCard
              icon={Calendar}
              title={`${format(trip.startDate, 'EEEE, MMMM d')} – ${format(trip.endDate, 'MMMM d, yyyy')}`}
              subtitle={`${dayCount} ${dayCount === 1 ? 'day' : 'days'}`}
              accent
            />

            {/* Players Card */}
            <DetailCard
              icon={Users}
              title={`${joinedCount} ${joinedCount === 1 ? 'player' : 'players'} joined`}
              subtitle={participants.length > joinedCount ? `${participants.length - joinedCount} invited` : undefined}
            />

            {/* Visibility Card */}
            <DetailCard
              icon={visibilityIcon}
              title={visibilityLabel}
              subtitle="Trip visibility"
            />

            {/* Description/Note */}
            {trip.description && (
              <div 
                className="p-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                }}
              >
                <div 
                  className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5"
                  style={{ color: 'rgba(100, 116, 139, 0.5)' }}
                >
                  Trip description
                </div>
                <p 
                  className="text-[14px] leading-relaxed"
                  style={{ color: '#1e293b' }}
                >
                  {trip.description}
                </p>
              </div>
            )}

            {/* Timeline section */}
            <div className="pt-3">
              <div 
                className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3"
                style={{ color: 'rgba(100, 116, 139, 0.5)' }}
              >
                Rounds
              </div>
              <TripTimeline 
                items={timeline} 
                isLoading={false}
                onGameTap={onGameTap}
                onAddRound={isHost ? onAddRound : undefined}
                todayDayNumber={todayDayNumber}
                hasMultipleDays={hasMultipleDays}
                hasTodayInTrip={hasTodayInTrip}
              />
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(0, 0, 0, 0.04)' }}
            >
              <Flag className="w-6 h-6" style={{ color: 'rgba(100, 116, 139, 0.6)' }} />
            </div>
            <h3 
              className="text-[15px] font-semibold mb-1"
              style={{ color: '#1e293b' }}
            >
              Messages coming soon
            </h3>
            <p 
              className="text-[13px]"
              style={{ color: 'rgba(100, 116, 139, 0.7)' }}
            >
              Chat with your trip group
            </p>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="space-y-2">
            {participants.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No participants yet
              </div>
            ) : (
              participants.map((participant) => {
                const profile = participant.profile;
                const isParticipantHost = participant.role === 'host';

                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <div className="relative">
                      <SquircleAvatar
                        src={profile?.profilePhotoUrl}
                        alt={profile?.displayName || 'Participant'}
                        size={40}
                      />
                      {isParticipantHost && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground border-2 border-white">
                          H
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <span className="truncate">{profile?.displayName || 'Unknown'}</span>
                        {isParticipantHost && <span className="text-[10px] text-primary">(Host)</span>}
                      </div>
                    </div>
                    <RsvpStatusLabel status={participant.rsvpStatus} />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer with RSVP buttons - warm polish styling */}
      <div 
        className="absolute bottom-0 left-0 right-0 px-5 py-3"
        style={{ 
          background: 'linear-gradient(180deg, rgba(253, 252, 251, 0.95) 0%, rgba(245, 243, 240, 0.98) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {isHost ? (
          // Host view - show counts + "You're organizing" message
          <div className="space-y-2">
            <div 
              className="flex items-center gap-2 text-[12px]"
              style={{ color: 'rgba(30, 41, 59, 0.6)' }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {joinedCount} going
                {maybeCount > 0 && ` · ${maybeCount} maybe`}
                {invitedCount > 0 && ` · ${invitedCount} invited`}
              </span>
            </div>
            <p 
              className="text-[11px] text-center"
              style={{ color: 'rgba(30, 41, 59, 0.45)' }}
            >
              You're organizing this trip
            </p>
          </div>
        ) : (
          // Participant view - show RSVP buttons
          <div className="space-y-3">
            {/* Counts summary */}
            <div 
              className="flex items-center gap-2 text-[12px]"
              style={{ color: 'rgba(30, 41, 59, 0.6)' }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {joinedCount} going
                {maybeCount > 0 && ` · ${maybeCount} maybe`}
                {invitedCount > 0 && ` · ${invitedCount} invited`}
              </span>
            </div>

            {/* RSVP buttons */}
            <div className="flex gap-2">
              {[
                { status: 'going' as const, label: 'Joined', icon: <Check className="w-4 h-4" />, activeColor: 'rgba(34, 197, 94, 0.9)', activeBg: 'rgba(34, 197, 94, 0.12)' },
                { status: 'maybe' as const, label: 'Maybe', icon: <HelpCircle className="w-4 h-4" />, activeColor: 'rgba(234, 179, 8, 0.9)', activeBg: 'rgba(234, 179, 8, 0.12)' },
                { status: 'declined' as const, label: "Can't go", icon: <X className="w-4 h-4" />, activeColor: 'rgba(239, 68, 68, 0.8)', activeBg: 'rgba(239, 68, 68, 0.1)' },
              ].map(option => {
                const isActive = currentUserRsvp === option.status;
                
                return (
                  <motion.button
                    key={option.status}
                    onClick={() => handleRsvpChange(option.status)}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-[13px] font-medium transition-all duration-150 disabled:opacity-50"
                    style={{
                      background: isActive ? option.activeBg : 'rgba(0, 0, 0, 0.04)',
                      color: isActive ? option.activeColor : 'rgba(30, 41, 59, 0.55)',
                      border: `1px solid ${isActive ? option.activeColor.replace('0.9', '0.2').replace('0.8', '0.15') : 'rgba(0, 0, 0, 0.06)'}`,
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {option.icon}
                    {option.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <InviteToTripModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        tripId={trip.id}
        tripName={trip.name}
        onInviteSuccess={onInviteSuccess}
      />
    </>
  );
}
