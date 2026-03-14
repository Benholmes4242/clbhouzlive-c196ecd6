import React from 'react';
import { AdminPageHeader, AdminButton } from '../components/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogosManagement from '@/components/admin/LogosManagement';

export default function LogosPage() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Logos"
        description="Club and organization logo management"
        action={<AdminButton variant="outline" icon={ArrowLeft} size="sm" onClick={() => navigate('/admin-v2/assets')}>Back</AdminButton>}
      />
      <LogosManagement />
    </div>
  );
}
