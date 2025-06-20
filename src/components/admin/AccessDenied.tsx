
import React from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AccessDenied: React.FC = () => {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessDenied;
