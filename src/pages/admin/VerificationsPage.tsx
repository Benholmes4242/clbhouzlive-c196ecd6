import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BusinessVerificationTab from '@/components/admin/verification/BusinessVerificationTab';
import GolferVerificationTab from '@/components/admin/verification/GolferVerificationTab';

const VerificationsPage = () => {
  const [activeType, setActiveType] = useState<'businesses' | 'golfers'>('businesses');

  // Counts for badges
  const { data: businessPendingCount } = useQuery({
    queryKey: ['admin-business-verifications-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('business_verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: golferPendingCount } = useQuery({
    queryKey: ['admin-golfer-verifications-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('golfer_verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <div className="p-6 space-y-section">
      <div>
        <h1 className="text-2xl font-semibold">Verification</h1>
        <p className="text-muted-foreground">
          Review and verify businesses and golfers to help the community identify authentic, trusted profiles.
        </p>
      </div>

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as 'businesses' | 'golfers')}>
        <TabsList>
          <TabsTrigger value="businesses" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Businesses
            {(businessPendingCount ?? 0) > 0 && (
              <span className="ml-1 text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">
                {businessPendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="golfers" className="gap-1.5">
            <User className="h-4 w-4" />
            Golfers
            {(golferPendingCount ?? 0) > 0 && (
              <span className="ml-1 text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">
                {golferPendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="mt-6">
          <BusinessVerificationTab />
        </TabsContent>

        <TabsContent value="golfers" className="mt-6">
          <GolferVerificationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VerificationsPage;
