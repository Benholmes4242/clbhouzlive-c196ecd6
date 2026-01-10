/**
 * TripDetailContent - Content component for trip detail sheet
 * Matches GameDetailContent structure exactly with:
 * - Header actions row (Invite button + overflow menu)
 * - Tab pills (Details, Messages, Players)
 * - Glass cards for details
 * - RSVP footer
 */

import React, { useState } from 'react';
import { MapPin, Users, Calendar, MoreVertical, UserPlus, ExternalLink, Pencil, Share2, LogOut, Trash2, Flag, Globe, Lock, UserCheck } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { TripDetailTabPills, type TripDetailTab } from './TripDetailTabPills';
import { TripTimeline } from './TripTimeline';
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
}

// V2 Glass Card component for details - matches GameDetailContent exactly
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
}: TripDetailContentProps) {
  const dayCount = differenceInDays(trip.endDate, trip.startDate) + 1;
  const joinedCount = participants.filter(p => p.rsvpStatus === 'going').length;
  
  const visibilityIcon = trip.visibility === 'invite' ? Lock : 
                         trip.visibility === 'friends' ? UserCheck : Globe;
  const visibilityLabel = trip.visibility === 'invite' ? 'Invite only' : 
                          trip.visibility === 'friends' ? 'Friends' : 'Public';

  return (
    <>
      {/* Header actions row - matches Game sheet exactly */}
      <div className="flex items-center justify-end gap-2 px-5 py-2 flex-shrink-0">
        {/* Invite button */}
        <Button
          variant="outline"
          size="sm"
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
                  background: 'rgba(255, 255, 255, 0.7)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.03)',
                }}
              >
                <div 
                  className="text-[11px] font-medium uppercase tracking-wide mb-1.5"
                  style={{ color: 'rgba(30, 41, 59, 0.4)' }}
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
                className="text-[11px] font-semibold uppercase tracking-wider mb-3"
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
                      background: 'rgba(255, 255, 255, 0.7)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      border: '1px solid rgba(0, 0, 0, 0.03)',
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

      {/* Footer - matches Game sheet */}
      <div 
        className="absolute bottom-0 left-0 right-0 px-5 py-3"
        style={{ 
          background: 'rgba(249, 250, 251, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {participants.slice(0, 5).map(p => (
              <SquircleAvatar
                key={p.id}
                src={p.profile?.profilePhotoUrl}
                alt={p.profile?.displayName || 'Participant'}
                size={28}
                className="border-2 border-white"
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {joinedCount} joined
          </span>
        </div>
      </div>
    </>
  );
}

// RSVP status label component
function RsvpStatusLabel({ status }: { status: string | null }) {
  const labels: Record<string, { text: string; color: string }> = {
    going: { text: 'Joined', color: 'text-green-600' },
    maybe: { text: 'Maybe', color: 'text-yellow-600' },
    declined: { text: "Can't go", color: 'text-red-500' },
    invited: { text: 'Invited', color: 'text-blue-500' },
  };
  
  const config = status ? labels[status] : null;
  if (!config) return null;
  
  return (
    <span className={`text-xs font-medium ${config.color}`}>
      {config.text}
    </span>
  );
}
