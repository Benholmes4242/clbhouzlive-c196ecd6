import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BusinessVerificationTab from '@/components/admin/verification/BusinessVerificationTab';
import GolferVerificationTab from '@/components/admin/verification/GolferVerificationTab';
import { VerificationQueueHeader, KeyboardShortcutsHint } from '@/components/admin/verification';

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
    <div className="flex flex-col h-full md:h-auto md:block space-y-4 md:space-y-6">
      {/* Stats Header */}
      <VerificationQueueHeader />

      {/* Tabs with keyboard shortcuts hint */}
      <div className="sticky top-0 z-20 bg-background md:static md:z-auto">
        <Tabs value={activeType} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between gap-4">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 flex-1">
              <TabsList className="inline-flex w-full md:w-auto h-9 md:h-10 gap-1">
                <TabsTrigger value="businesses" className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm px-3 md:px-4">
                  <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span>Business</span>
                  {(businessPendingCount ?? 0) > 0 && (
                    <span className="text-[10px] md:text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">
                      {businessPendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="people" className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm px-3 md:px-4">
                  <User className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span>People</span>
                  {(peoplePendingCount ?? 0) > 0 && (
                    <span className="text-[10px] md:text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">
                      {peoplePendingCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Keyboard shortcuts hint - hidden on mobile */}
            <div className="hidden md:block">
              <KeyboardShortcutsHint selectMode={false} />
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto md:overflow-visible pb-24 md:pb-0">
            <TabsContent value="businesses" className="mt-4 md:mt-6">
              <BusinessVerificationTab />
            </TabsContent>

            <TabsContent value="people" className="mt-4 md:mt-6">
              <GolferVerificationTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default VerificationsPage;
