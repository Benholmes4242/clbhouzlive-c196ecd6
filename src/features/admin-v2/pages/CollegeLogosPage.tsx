import React from 'react';
import { AdminPageHeader, AdminButton } from '../components/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CollegeLogoManager from '@/components/admin/CollegeLogoManager';

export default function CollegeLogosPage() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="College Logos"
        description="US college golf program logos"
        action={<AdminButton variant="outline" icon={ArrowLeft} size="sm" onClick={() => navigate('/admin-v2/assets')}>Back</AdminButton>}
      />
      <CollegeLogoManager />
    </div>
  );
}
