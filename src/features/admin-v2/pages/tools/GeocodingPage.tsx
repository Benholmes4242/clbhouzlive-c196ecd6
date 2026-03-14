import React from 'react';
import { AdminPageHeader } from '../../components/ui';
import { Top100GeocodingBackfill } from '@/components/admin/Top100GeocodingBackfill';

export default function GeocodingPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <AdminPageHeader title="Geocoding Tools" description="Backfill coordinates for golf courses" />
      <Top100GeocodingBackfill />
    </div>
  );
}
