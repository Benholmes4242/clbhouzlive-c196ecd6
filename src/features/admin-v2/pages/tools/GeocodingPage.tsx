import React from 'react';
import { AdminPageHeader } from '../../components/ui';
import { Top100GeocodingBackfill } from '@/components/admin/Top100GeocodingBackfill';

export default function GeocodingPage() {
  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-4xl mx-auto space-y-6">
      <AdminPageHeader title="Geocoding Tools" description="Backfill coordinates for golf courses" />
      <Top100GeocodingBackfill />
    </div>
  );
}
