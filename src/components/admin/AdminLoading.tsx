
import React from 'react';
import { Loader2 } from 'lucide-react';

const AdminLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#b66b41' }} />
    </div>
  );
};

export default AdminLoading;
