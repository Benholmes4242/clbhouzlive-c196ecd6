/**
 * Temporary seeding utility for Benjamin Holmes business access notifications
 * For visual QA only - remove after testing
 * 
 * Clean-up SQL:
 * DELETE FROM notifications WHERE data->>'seed_key' = 'benjamin_business_access_qa_v1';
 */

import { supabase } from '@/integrations/supabase/client';

// ⚠️ TEMPORARY FLAG - Set to false and remove after QA
const SEED_BENJAMIN_BUSINESS_NOTIFS = true;

// Benjamin Holmes' user_profile_id
const BENJAMIN_USER_ID = '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e';

// Augusta Country Club business data
const AUGUSTA_BUSINESS = {
  id: '268973bd-a62a-450c-acb3-c4da57c5efc4',
  name: 'Augusta Country Club',
  logo_url: 'https://media.clbhouz.co.uk/6a5bcbb9-c22c-4655-ad8e-088b2858ca3e/clbhouz-club-logos/1766059121910-b2657pnojbl.jpg',
};

// Unique seed key for cleanup
const SEED_KEY = 'benjamin_business_access_qa_v1';

// Mock requester data for admin-facing notification
const MOCK_REQUESTER = {
  id: 'mock-requester-uuid-1234',
  name: 'Sarah Mitchell',
  avatar_url: null, // Will show initials
};

export async function seedBenjaminBusinessNotifications(): Promise<void> {
  // Guard: flag must be enabled
  if (!SEED_BENJAMIN_BUSINESS_NOTIFS) {
    return;
  }

  // Guard: check if already seeded via localStorage
  const alreadySeeded = localStorage.getItem('seed_benjamin_business_notifs_done');
  if (alreadySeeded === 'true') {
    console.log('[Seed] Benjamin business notifications already seeded, skipping');
    return;
  }

  // Guard: check if notifications already exist in DB
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', BENJAMIN_USER_ID)
    .contains('data', { seed_key: SEED_KEY })
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('[Seed] Seed notifications already exist in DB, marking localStorage');
    localStorage.setItem('seed_benjamin_business_notifs_done', 'true');
    return;
  }

  console.log('[Seed] Inserting Benjamin business access QA notifications...');

  const mockRequestId = 'mock-request-' + Date.now();

  const notifications = [
    // A) Access request received (admin-facing)
    {
      user_id: BENJAMIN_USER_ID,
      type: 'business_access_request',
      title: 'Access request',
      entity_type: 'business',
      entity_id: AUGUSTA_BUSINESS.id,
      data: {
        seed_key: SEED_KEY,
        request_id: mockRequestId + '-admin',
        business_id: AUGUSTA_BUSINESS.id,
        business_name: AUGUSTA_BUSINESS.name,
        business_avatar_url: AUGUSTA_BUSINESS.logo_url,
        entity_name: AUGUSTA_BUSINESS.name,
        entity_avatar_url: AUGUSTA_BUSINESS.logo_url,
        requester_id: MOCK_REQUESTER.id,
        requester_name: MOCK_REQUESTER.name,
        requester_avatar_url: MOCK_REQUESTER.avatar_url,
        role_requested: 'Manager',
      },
    },
    // B) Request received (pending) - requester-facing
    {
      user_id: BENJAMIN_USER_ID,
      type: 'business_access_request',
      title: 'Request pending',
      entity_type: 'business',
      entity_id: AUGUSTA_BUSINESS.id,
      data: {
        seed_key: SEED_KEY,
        request_id: mockRequestId + '-pending',
        business_id: AUGUSTA_BUSINESS.id,
        business_name: AUGUSTA_BUSINESS.name,
        business_avatar_url: AUGUSTA_BUSINESS.logo_url,
        entity_name: AUGUSTA_BUSINESS.name,
        entity_avatar_url: AUGUSTA_BUSINESS.logo_url,
        status: 'pending',
      },
    },
    // C) Approved
    {
      user_id: BENJAMIN_USER_ID,
      type: 'business_access_approved',
      title: 'Access approved',
      entity_type: 'business',
      entity_id: AUGUSTA_BUSINESS.id,
      data: {
        seed_key: SEED_KEY,
        request_id: mockRequestId + '-approved',
        business_id: AUGUSTA_BUSINESS.id,
        business_name: AUGUSTA_BUSINESS.name,
        business_avatar_url: AUGUSTA_BUSINESS.logo_url,
        entity_name: AUGUSTA_BUSINESS.name,
        entity_avatar_url: AUGUSTA_BUSINESS.logo_url,
        role_granted: 'Manager',
      },
    },
    // D) Declined
    {
      user_id: BENJAMIN_USER_ID,
      type: 'business_access_declined',
      title: 'Access declined',
      entity_type: 'business',
      entity_id: AUGUSTA_BUSINESS.id,
      data: {
        seed_key: SEED_KEY,
        request_id: mockRequestId + '-declined',
        business_id: AUGUSTA_BUSINESS.id,
        business_name: AUGUSTA_BUSINESS.name,
        business_avatar_url: AUGUSTA_BUSINESS.logo_url,
        entity_name: AUGUSTA_BUSINESS.name,
        entity_avatar_url: AUGUSTA_BUSINESS.logo_url,
      },
    },
  ];

  const { error } = await supabase.from('notifications').insert(notifications);

  if (error) {
    console.error('[Seed] Failed to insert notifications:', error);
    return;
  }

  console.log('[Seed] Successfully inserted 4 business access QA notifications');
  localStorage.setItem('seed_benjamin_business_notifs_done', 'true');
}
