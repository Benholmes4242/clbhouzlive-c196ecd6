import { supabase } from '@/integrations/supabase/client';
import { CoachProfile, CoachSearchParams, SwingShare, CoachFeedback, ShareConsentOptions, CoachReviewThread } from '@/types/coach';

export class SwingShareService {
  /**
   * Search for coaches near a location with optional filters
   */
  static async searchCoaches(params: CoachSearchParams): Promise<CoachProfile[]> {
    let query = supabase
      .from('coach_profiles')
      .select('*')
      .eq('status', 'active');

    // Filter by region if provided
    if (params.regionCode) {
      query = query.eq('region_code', params.regionCode);
    }

    // Filter by specialties if provided
    if (params.specialties && params.specialties.length > 0) {
      query = query.overlaps('specialties', params.specialties);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error searching coaches:', error);
      throw error;
    }

    let coaches = data || [];

    // Calculate distances if user location provided
    if (params.lat && params.lng && coaches.length > 0) {
      const coachesWithDistance = coaches
        .map(coach => {
          if (coach.lat && coach.lng) {
            const distance = this.calculateDistance(
              params.lat!,
              params.lng!,
              coach.lat,
              coach.lng
            );
            return { ...coach, distance };
          }
          return { ...coach, distance: undefined };
        })
        .filter(coach => !params.radiusKm || (coach.distance !== undefined && coach.distance <= params.radiusKm))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      coaches = coachesWithDistance;
    }

    return coaches.map(coach => ({
      id: coach.id,
      name: coach.name,
      email: coach.email,
      phone: coach.phone,
      regionCode: coach.region_code,
      specialties: coach.specialties,
      pricingNote: coach.pricing_note,
      bio: coach.bio,
      status: coach.status as 'active' | 'inactive',
      lat: coach.lat,
      lng: coach.lng,
      distance: (coach as any).distance,
      createdAt: coach.created_at,
      updatedAt: coach.updated_at
    }));
  }

  /**
   * Share a swing analysis with a coach
   */
  static async shareWithCoach(
    analysisId: string,
    coachId: string,
    consent: ShareConsentOptions
  ): Promise<SwingShare> {
    // Generate access token for coach
    const accessToken = crypto.randomUUID();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7 days

    const { data, error } = await supabase
      .from('swing_shares')
      .insert({
        analysis_id: analysisId,
        coach_id: coachId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        status: 'pending',
        consent_flags: consent as any,
        access_token: accessToken,
        token_expires_at: tokenExpiresAt.toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating swing share:', error);
      throw error;
    }

    // Send email notification to coach
    await this.notifyCoach(data.id, accessToken);

    return {
      id: data.id,
      analysisId: data.analysis_id,
      userId: data.user_id,
      coachId: data.coach_id,
      status: data.status as SwingShare['status'],
      consentFlags: data.consent_flags as any,
      accessToken: data.access_token,
      tokenExpiresAt: data.token_expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Get shares for current user
   */
  static async getUserShares(): Promise<SwingShare[]> {
    const { data, error } = await supabase
      .from('swing_shares')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user shares:', error);
      throw error;
    }

    return (data || []).map(share => ({
      id: share.id,
      analysisId: share.analysis_id,
      userId: share.user_id,
      coachId: share.coach_id,
      status: share.status as SwingShare['status'],
      consentFlags: share.consent_flags as any,
      accessToken: share.access_token,
      tokenExpiresAt: share.token_expires_at,
      createdAt: share.created_at,
      updatedAt: share.updated_at
    }));
  }

  /**
   * Get feedback thread for a share
   */
  static async getCoachReviewThread(shareId: string): Promise<CoachReviewThread | null> {
    // Get share details
    const { data: shareData, error: shareError } = await supabase
      .from('swing_shares')
      .select(`
        *,
        coach_profiles(*)
      `)
      .eq('id', shareId)
      .single();

    if (shareError || !shareData) {
      console.error('Error fetching share:', shareError);
      return null;
    }

    // Get feedback
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('coach_feedback')
      .select('*')
      .eq('share_id', shareId)
      .order('created_at', { ascending: true });

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      throw feedbackError;
    }

    return {
      share: {
        id: shareData.id,
        analysisId: shareData.analysis_id,
        userId: shareData.user_id,
        coachId: shareData.coach_id,
        status: shareData.status as SwingShare['status'],
        consentFlags: shareData.consent_flags as any as ShareConsentOptions,
        accessToken: shareData.access_token,
        tokenExpiresAt: shareData.token_expires_at,
        createdAt: shareData.created_at,
        updatedAt: shareData.updated_at
      },
      coach: {
        id: shareData.coach_profiles.id,
        name: shareData.coach_profiles.name,
        email: shareData.coach_profiles.email,
        phone: shareData.coach_profiles.phone,
        regionCode: shareData.coach_profiles.region_code,
        specialties: shareData.coach_profiles.specialties,
        pricingNote: shareData.coach_profiles.pricing_note,
        bio: shareData.coach_profiles.bio,
        status: shareData.coach_profiles.status as 'active' | 'inactive',
        lat: shareData.coach_profiles.lat,
        lng: shareData.coach_profiles.lng,
        createdAt: shareData.coach_profiles.created_at,
        updatedAt: shareData.coach_profiles.updated_at
      },
      feedback: (feedbackData || []).map(feedback => ({
        id: feedback.id,
        shareId: feedback.share_id,
        coachId: feedback.coach_id,
        author: feedback.author as 'coach' | 'system',
        message: feedback.message,
        attachments: feedback.attachments as string[],
        createdAt: feedback.created_at
      }))
    };
  }

  /**
   * Send notification email to coach
   */
  private static async notifyCoach(shareId: string, accessToken: string): Promise<void> {
    try {
      await supabase.functions.invoke('coach-notification', {
        body: {
          shareId,
          accessToken,
          reviewUrl: `${window.location.origin}/coach/review?token=${accessToken}`
        }
      });
    } catch (error) {
      console.error('Error sending coach notification:', error);
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get available specialties for filtering
   */
  static getAvailableSpecialties(): string[] {
    return [
      'Driver',
      'Iron Play',
      'Short Game',
      'Putting',
      'Course Management',
      'Swing Mechanics',
      'Beginners',
      'Junior Golf',
      'Advanced Techniques',
      'Tournament Prep',
      'Slice/Hook Fix',
      'Mental Game'
    ];
  }
}