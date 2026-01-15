import React from 'react';
import { Phone, Mail, Globe, MapPin, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { format } from 'date-fns';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface BusinessProfileInfoProps {
  business: BusinessProfile;
}

// Note: Highlights section removed - requires database table for real data

export function BusinessProfileInfo({ business }: BusinessProfileInfoProps) {
  const handleCall = () => {
    if (business.phone) {
      window.location.href = `tel:${business.phone}`;
    }
  };

  const handleEmail = () => {
    if (business.email) {
      window.location.href = `mailto:${business.email}`;
    }
  };

  const handleWebsite = () => {
    if (business.website) {
      const url = business.website.startsWith('http') 
        ? business.website 
        : `https://${business.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDirections = () => {
    if (business.location) {
      const query = encodeURIComponent(business.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };


  return (
    <div 
      className="-mx-5 px-0"
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <div className="flex flex-col gap-3">
        {/* About - Full text without truncation */}
        {business.description && (
          <section className="bg-white p-4 space-y-3">
            <h2 className="text-base font-semibold text-[#1F2428]">About</h2>
            <p className="text-sm text-[#5E666D] leading-[1.7] whitespace-pre-wrap">
              {business.description}
            </p>
          </section>
        )}

        {/* Contact */}
        <section className="bg-white p-4 space-y-3">
          <h2 className="text-base font-semibold text-[#1F2428]">Contact</h2>
          <div className="space-y-2">
            {business.phone && (
              <button 
                onClick={handleCall}
                className="flex items-center gap-3 w-full text-left hover:bg-[#F4F5F7] rounded-sq-sm p-2.5 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-[#64748b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1F2428]">{business.phone}</p>
                  <p className="text-xs text-[#97A1AA]">Phone</p>
                </div>
              </button>
            )}
            
            {business.email && (
              <button 
                onClick={handleEmail}
                className="flex items-center gap-3 w-full text-left hover:bg-[#F4F5F7] rounded-sq-sm p-2.5 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-[#64748b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1F2428]">{business.email}</p>
                  <p className="text-xs text-[#97A1AA]">Email</p>
                </div>
              </button>
            )}
            
            {business.website && (
              <button 
                onClick={handleWebsite}
                className="flex items-center gap-3 w-full text-left hover:bg-[#F4F5F7] rounded-sq-sm p-2.5 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-[#64748b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1F2428]">
                    {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </p>
                  <p className="text-xs text-[#97A1AA]">Website</p>
                </div>
              </button>
            )}

            {!business.phone && !business.email && !business.website && (
              <p className="text-sm text-[#97A1AA] italic">No contact information available.</p>
            )}
          </div>
        </section>

        {/* Location */}
        <section className="bg-white p-4 space-y-3">
          <h2 className="text-base font-semibold text-[#1F2428]">Location</h2>
          {business.location ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-[#64748b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1F2428]">{business.location}</p>
                  <p className="text-xs text-[#97A1AA]">Address</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleDirections} 
                className="rounded-full w-full sm:w-auto text-[#1F2428] border-[#1F2428]/10 hover:bg-[#EDEFF2]"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get directions
              </Button>
            </div>
          ) : (
            <p className="text-sm text-[#97A1AA] italic">No location information available.</p>
          )}
        </section>


        {/* Business Details */}
        <section className="bg-white p-4 space-y-3">
          <h2 className="text-base font-semibold text-[#1F2428]">Business Details</h2>
          <div className="space-y-2">
            {business.category && (
              <div className="flex items-center gap-3 p-2.5">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-[#64748b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1F2428]">{business.category}</p>
                  <p className="text-xs text-[#97A1AA]">Category</p>
                </div>
              </div>
            )}
            
            {business.is_verified && (
              <div className="flex items-center gap-3 p-2.5">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <VerifiedBadge size="lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1F2428]">Verified Business</p>
                  <p className="text-xs text-[#97A1AA]">This business has been verified by clbhouz</p>
                </div>
              </div>
            )}
            
            {business.created_at && (
              <div className="flex items-center gap-3 p-2.5">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#64748b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1F2428]">
                    {format(new Date(business.created_at), 'MMMM yyyy')}
                  </p>
                  <p className="text-xs text-[#97A1AA]">Member since</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
