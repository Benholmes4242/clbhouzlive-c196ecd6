import React, { useState } from 'react';
import { MapPin, Flag, CircleDot, ShoppingBag, Grip, BarChart2, Video, Settings, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { motion, AnimatePresence } from 'framer-motion';
import { InsightsMiniStrip } from './InsightsMiniStrip';
import { FeaturedVideoBlock } from './FeaturedVideoBlock';
import { useNavigate } from 'react-router-dom';
import { useBusinessVerificationRequest } from '@/hooks/useBusinessVerificationRequest';

interface BusinessProfileOverviewProps {
  business: BusinessProfile;
  membership?: BusinessMembership | null;
}

// Icons for common highlights
const HIGHLIGHT_ICONS: Record<string, typeof Flag> = {
  '18-hole course': Flag,
  '9-hole course': Flag,
  'Driving range': CircleDot,
  'Pro shop': ShoppingBag,
  'Practice facilities': Grip,
};

export function BusinessProfileOverview({ business, membership }: BusinessProfileOverviewProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const navigate = useNavigate();
  const { data: verificationRequest } = useBusinessVerificationRequest(business.id);
  
  const MAX_CHARS = 200;
  const hasLongDescription = (business.description?.length ?? 0) > MAX_CHARS;
  const displayDescription = showFullDescription 
    ? business.description 
    : business.description?.slice(0, MAX_CHARS);

  const handleDirections = () => {
    if (business.location) {
      const query = encodeURIComponent(business.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  // Placeholder highlights - these would come from a facilities field later
  const highlights = [
    business.category,
    '18-hole course',
    'Driving range',
    'Pro shop',
  ].filter(Boolean);

  const isOwner = membership?.canManage || false;
  const canViewInsights = membership?.canViewInsights || false;

  // Determine verification status for CTA
  const getVerificationCTA = () => {
    if (business.is_verified) {
      return { label: 'Verified', variant: 'success' as const, disabled: true };
    }
    if (verificationRequest?.status === 'pending') {
      return { label: 'Verification in progress', variant: 'pending' as const, disabled: true };
    }
    return { label: 'Get verified', variant: 'default' as const, disabled: false };
  };
  const verificationCTA = getVerificationCTA();

  return (
    <div className="space-y-6">
      {/* ========== OWNER-ONLY SECTION ========== */}
      {isOwner && (
        <div 
          className="rounded-sq-lg p-4 space-y-4"
          style={{ 
            background: 'white',
            border: '1px solid rgba(31,36,40,0.08)',
            boxShadow: '0 2px 8px rgba(31,36,40,0.04)'
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1F2428]">Business Tools</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/business/${business.id}/edit`)}
              className="text-[#5E666D] hover:text-[#1F2428] gap-1.5"
            >
              <Settings className="h-4 w-4" />
              Edit
            </Button>
          </div>

          {/* Quick actions grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Insights */}
            {canViewInsights && (
              <button
                onClick={() => navigate(`/business/${business.id}/insights`)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-sq-md hover:bg-[#F4F5F7] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#EDEFF2] flex items-center justify-center">
                  <BarChart2 className="h-5 w-5 text-[#5E666D]" />
                </div>
                <span className="text-xs font-medium text-[#1F2428]">Insights</span>
              </button>
            )}

            {/* Featured Video */}
            <button
              onClick={() => console.log('Feature a video')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-sq-md hover:bg-[#F4F5F7] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#EDEFF2] flex items-center justify-center">
                <Video className="h-5 w-5 text-[#5E666D]" />
              </div>
              <span className="text-xs font-medium text-[#1F2428]">Feature video</span>
            </button>

            {/* Verification CTA */}
            <button
              onClick={() => !verificationCTA.disabled && navigate(`/business/${business.id}/verification`)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-sq-md transition-colors ${
                verificationCTA.disabled ? 'cursor-default' : 'hover:bg-[#F4F5F7]'
              }`}
              disabled={verificationCTA.disabled}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  verificationCTA.variant === 'success' 
                    ? 'bg-emerald-100' 
                    : verificationCTA.variant === 'pending'
                    ? 'bg-amber-100'
                    : 'bg-[#EDEFF2]'
                }`}
              >
                <ShieldCheck 
                  className={`h-5 w-5 ${
                    verificationCTA.variant === 'success' 
                      ? 'text-emerald-600' 
                      : verificationCTA.variant === 'pending'
                      ? 'text-amber-600'
                      : 'text-[#5E666D]'
                  }`} 
                />
              </div>
              <span className={`text-xs font-medium ${
                verificationCTA.variant === 'success' 
                  ? 'text-emerald-600' 
                  : verificationCTA.variant === 'pending'
                  ? 'text-amber-600'
                  : 'text-[#1F2428]'
              }`}>
                {verificationCTA.label}
              </span>
            </button>
          </div>

          {/* Insights Mini-Strip */}
          {canViewInsights && (
            <InsightsMiniStrip
              businessId={business.id}
              visits7d={127}
              followersGained={12}
              postImpressions={458}
            />
          )}
        </div>
      )}

      {/* Featured Video Block */}
      <FeaturedVideoBlock
        videoUrl={null}
        posterUrl={null}
        businessName={business.name}
        isOwner={isOwner}
        onEditClick={() => console.log('Edit featured video')}
      />

      {/* About section */}
      <section 
        className="rounded-sq-lg p-4 space-y-3"
        style={{ 
          background: 'white',
          border: '1px solid rgba(31,36,40,0.08)'
        }}
      >
        <h2 className="text-base font-semibold text-[#1F2428]">About</h2>
        {business.description ? (
          <div>
            <p className="text-sm text-[#5E666D] leading-[1.7] whitespace-pre-wrap">
              {displayDescription}
              {hasLongDescription && !showFullDescription && '...'}
            </p>
            {hasLongDescription && (
              <AnimatePresence>
                <motion.button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-sm font-medium text-[#F7931E] hover:underline mt-2 inline-block"
                  whileTap={{ scale: 0.98 }}
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </motion.button>
              </AnimatePresence>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#97A1AA] italic">No description available.</p>
        )}
      </section>

      {/* Highlights */}
      <section 
        className="rounded-sq-lg p-4 space-y-3"
        style={{ 
          background: 'white',
          border: '1px solid rgba(31,36,40,0.08)'
        }}
      >
        <h2 className="text-base font-semibold text-[#1F2428]">Highlights</h2>
        <div className="flex flex-wrap gap-2">
          {highlights.map((highlight, idx) => {
            const Icon = HIGHLIGHT_ICONS[highlight as string] || Flag;
            return (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-[#5E666D]"
                style={{ background: '#EDEFF2' }}
              >
                <Icon className="h-3.5 w-3.5" />
                {highlight}
              </span>
            );
          })}
        </div>
      </section>

      {/* Location */}
      <section 
        className="rounded-sq-lg p-4 space-y-3"
        style={{ 
          background: 'white',
          border: '1px solid rgba(31,36,40,0.08)'
        }}
      >
        <h2 className="text-base font-semibold text-[#1F2428]">Location</h2>
        {business.location ? (
          <div className="space-y-4">
            <p className="text-sm text-[#5E666D]">{business.location}</p>
            
            {/* Map placeholder */}
            <div 
              className="h-[140px] rounded-sq-md flex flex-col items-center justify-center"
              style={{ background: '#EDEFF2' }}
            >
              <MapPin className="h-8 w-8 text-[#97A1AA] mb-2" />
              <p className="text-sm text-[#97A1AA]">Map coming soon</p>
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleDirections} 
                className="rounded-full text-[#1F2428] border-[#1F2428]/10 hover:bg-[#EDEFF2]"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get directions
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#97A1AA] italic">No location information available.</p>
        )}
      </section>

      {/* Reviews placeholder */}
      <section 
        className="rounded-sq-lg p-4 space-y-3"
        style={{ 
          background: 'white',
          border: '1px solid rgba(31,36,40,0.08)'
        }}
      >
        <h2 className="text-base font-semibold text-[#1F2428]">Reviews</h2>
        <p className="text-sm text-[#97A1AA] py-4">
          Coming soon — you'll be able to see what golfers are saying about this business.
        </p>
      </section>
    </div>
  );
}
