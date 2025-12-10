import React from 'react';
import { Phone, Mail, Globe, MapPin, Clock } from 'lucide-react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';

interface BusinessProfileInfoProps {
  business: BusinessProfile;
}

export function BusinessProfileInfo({ business }: BusinessProfileInfoProps) {
  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <section className="bg-card border border-border rounded-sq-md p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
        <div className="space-y-4">
          {business.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <a href={`tel:${business.phone}`} className="text-foreground hover:underline">
                {business.phone}
              </a>
            </div>
          )}
          {business.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <a href={`mailto:${business.email}`} className="text-foreground hover:underline">
                {business.email}
              </a>
            </div>
          )}
          {business.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <a 
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline"
              >
                {business.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {business.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-foreground">{business.location}</span>
            </div>
          )}
          {!business.phone && !business.email && !business.website && !business.location && (
            <p className="text-muted-foreground italic">No contact information available.</p>
          )}
        </div>
      </section>

      {/* Opening Hours placeholder */}
      <section className="bg-card border border-border rounded-sq-md p-4 md:p-6">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold mb-1">Opening Hours</h2>
            <p className="text-sm text-muted-foreground">
              Coming soon – opening hours will be displayed here.
            </p>
          </div>
        </div>
      </section>

      {/* Business details */}
      <section className="bg-card border border-border rounded-sq-md p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Business Details</h2>
        <div className="space-y-3 text-sm">
          {business.category && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{business.category}</span>
            </div>
          )}
          {business.is_verified && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verified</span>
              <span className="font-medium text-blue-600">Yes</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">
              {business.created_at 
                ? new Date(business.created_at).toLocaleDateString('en-GB', { 
                    month: 'long', 
                    year: 'numeric' 
                  })
                : '–'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
