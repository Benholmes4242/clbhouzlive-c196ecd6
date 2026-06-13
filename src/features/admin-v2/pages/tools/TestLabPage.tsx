import React from 'react';
import { AdminPageHeader, AdminSectionHeader } from '../../components/ui';
import { BusinessAccessTestLab } from '@/components/admin/BusinessAccessTestLab';

export default function TestLabPage() {
  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-4xl mx-auto space-y-6">
      <AdminPageHeader title="Test Lab" description="Development testing tools" />
      <div className="space-y-4">
        <AdminSectionHeader title="Business Access" />
        <BusinessAccessTestLab />
      </div>
    </div>
  );
}
