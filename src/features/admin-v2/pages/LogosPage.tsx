import React from 'react';
import { AdminPageHeader, AdminButton } from '../components/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogosManagement from '@/components/admin/LogosManagement';

export default function LogosPage() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Logos"
        description="Club and organization logo management"
        action={<AdminButton variant="outline" icon={ArrowLeft} size="sm" onClick={() => navigate('/admin-v2/assets')}>Back</AdminButton>}
      />
      <LogosManagement />
    </div>
  );
}
