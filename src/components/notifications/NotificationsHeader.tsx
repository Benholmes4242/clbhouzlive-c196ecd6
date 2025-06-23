
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const NotificationsHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 mb-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
    </div>
  );
};

export default NotificationsHeader;
