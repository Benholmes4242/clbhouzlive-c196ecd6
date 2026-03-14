import React from 'react';
import { AdminPageHeader, AdminSectionHeader } from '../../components/ui';
import { BusinessAccessTestLab } from '@/components/admin/BusinessAccessTestLab';
import { GameInviteTestLab } from '@/components/admin/GameInviteTestLab';

export default function TestLabPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <AdminPageHeader title="Test Lab" description="Development testing tools" />
      <div className="space-y-4">
        <AdminSectionHeader title="Business Access" />
        <BusinessAccessTestLab />
      </div>
      <div className="space-y-4">
        <AdminSectionHeader title="Game Invites" />
        <GameInviteTestLab />
      </div>
    </div>
  );
}
