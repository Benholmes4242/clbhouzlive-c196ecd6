
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

const NotificationsEmptyState = () => {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No notifications</h3>
        <p className="text-muted-foreground">You're all caught up!</p>
      </CardContent>
    </Card>
  );
};

export default NotificationsEmptyState;
