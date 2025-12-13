import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BusinessVerificationTab from '@/components/admin/verification/BusinessVerificationTab';
import GolferVerificationTab from '@/components/admin/verification/GolferVerificationTab';

type VerificationType = 'businesses' | 'people';

const VerificationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as VerificationType | null;
  const activeType: VerificationType = typeParam === 'people' ? 'people' : 'businesses';

  const handleTabChange = (value: string) => {
    setSearchParams({ type: value });
  };

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

  const { data: peoplePendingCount } = useQuery({
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Verification</h1>
        <p className="text-muted-foreground">
          Review and verify businesses and people to help golfers identify trusted accounts.
        </p>
      </div>

      <Tabs value={activeType} onValueChange={handleTabChange}>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex whitespace-nowrap">
            <TabsTrigger value="businesses" className="gap-1.5">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Businesses</span>
              <span className="sm:hidden">Biz</span>
              {(businessPendingCount ?? 0) > 0 && (
                <span className="ml-1 text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">
                  {businessPendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-1.5">
              <User className="h-4 w-4 shrink-0" />
              People
              {(peoplePendingCount ?? 0) > 0 && (
                <span className="ml-1 text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">
                  {peoplePendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="businesses" className="mt-6">
          <BusinessVerificationTab />
        </TabsContent>

        <TabsContent value="people" className="mt-6">
          <GolferVerificationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VerificationsPage;
