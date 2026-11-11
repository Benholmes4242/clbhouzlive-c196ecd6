import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { postAuthor, postAuthorRoute } from '@/lib/postAuthor';
import { VideoCard } from '@/features/explore-magazine/watch/videoUnit';
import { feedCardAuthorName } from '@/components/feed-cards/FeedCard';
import type { FeedPost } from '@/components/media-system/types/media';

const BUSINESS_ROW = {
  post_id: 'p1',
  post_actor_type: 'business',
  post_actor_id: 'biz-1',
  post_user_id: 'user-1',
  business_name: 'Machrihanish Golf Club',
  business_logo_url: 'https://cdn.example.com/logo.png',
  business_is_verified: true,
  creator_display_name: 'Mac Heed',
  creator_username: 'machgolfclub',
  creator_avatar_url: 'https://cdn.example.com/uploader.png',
  creator_is_verified: false,
};

describe('postAuthor', () => {
  it('returns the business name, logo, verified and null handle for a post_actor_type business row', () => {
    const author = postAuthor(BUSINESS_ROW);
    expect(author.kind).toBe('business');
    expect(author.id).toBe('biz-1');
    expect(author.name).toBe('Machrihanish Golf Club');
    expect(author.avatarUrl).toBe('https://cdn.example.com/logo.png');
    expect(author.isVerified).toBe(true);
    expect(author.handle).toBeNull();
    expect(postAuthorRoute(author)).toBe('/business/biz-1');
  });

  it('never falls back to creator_* for a business row, even when business_* is absent (long-form shape)', () => {
    // get_long_form_videos_v2 now returns business_*; a raw row's creator_* can
    // be the UPLOADER's personal profile, so a business with no logo must not
    // show the uploader's photo (BUSINESS_AUTHORSHIP_APP_WIDE §1).
    const author = postAuthor({
      actor_type: 'business',
      actor_id: 'biz-1',
      creator_display_name: 'Mac Heed',
      creator_avatar_url: 'https://cdn.example.com/uploader.png',
      creator_is_verified: true,
      creator_username: null,
    });
    expect(author.kind).toBe('business');
    expect(author.name).toBe('');
    expect(author.avatarUrl).toBeNull();
    expect(author.isVerified).toBe(false);
    expect(author.handle).toBeNull();
  });

  it('returns the personal fields for a personal row', () => {
    const author = postAuthor({
      post_actor_type: 'personal',
      post_actor_id: 'user-1',
      creator_display_name: 'Mac Heed',
      creator_username: 'machgolfclub',
      creator_avatar_url: 'https://cdn.example.com/uploader.png',
      creator_is_verified: false,
    });
    expect(author.kind).toBe('personal');
    expect(author.name).toBe('Mac Heed');
    expect(author.handle).toBe('machgolfclub');
    expect(author.avatarUrl).toBe('https://cdn.example.com/uploader.png');
    expect(postAuthorRoute(author)).toBe('/profile/user-1');
  });

  it('names the business on a shorts_v2-shaped row carrying business_name', () => {
    const author = postAuthor({
      post_actor_type: 'business',
      post_actor_id: 'biz-1',
      business_name: 'Machrihanish Golf Club',
      creator_display_name: 'Mac Heed',
      creator_username: 'machgolfclub',
    });
    expect(author.name).toBe('Machrihanish Golf Club');
    expect(author.handle).toBeNull();
  });
});

describe('videoUnit VideoCard', () => {
  it('renders the business name and logo, never the uploader, for a business long-form row', () => {
    render(
      <VideoCard
        row={{ ...BUSINESS_ROW, post_content: 'A day on the links', post_created_at: null } as any}
        onPress={() => {}}
        autoplay={false}
      />,
    );
    expect(screen.getByText('Machrihanish Golf Club')).toBeTruthy();
    expect(screen.queryByText(/machgolfclub/)).toBeNull();
    expect(screen.queryByText(/Mac Heed/)).toBeNull();
    const logo = document.querySelector('img[src="https://cdn.example.com/logo.png"]');
    expect(logo).toBeTruthy();
    expect(document.querySelector('img[src="https://cdn.example.com/uploader.png"]')).toBeNull();
  });

  it('renders the two-initial dark fallback when the business has no logo', () => {
    render(
      <VideoCard
        row={{ ...BUSINESS_ROW, business_logo_url: null, post_content: 'A day on the links', post_created_at: null } as any}
        onPress={() => {}}
        autoplay={false}
      />,
    );
    expect(screen.getByText('MG')).toBeTruthy();
    expect(screen.queryByText('M')).toBeNull();
  });
});

describe('feedCardAuthorName', () => {
  const feedPost = {
    id: 'p1',
    userId: 'user-1',
    actorType: 'business',
    actorId: 'biz-1',
    displayName: 'Machrihanish Golf Club',
  } as unknown as FeedPost;

  it('returns the business name for a business feed row, never the uploader', () => {
    const name = feedCardAuthorName(
      {
        post_id: 'p1',
        post_content: null,
        derived_format: 'video',
        poster_url: null,
        duration_seconds: null,
        creator_username: 'machgolfclub',
        creator_display_name: 'Mac Heed',
        like_count: 0,
        course_name: null,
      },
      feedPost,
    );
    expect(name).toBe('Machrihanish Golf Club');
  });

  it('returns the personal name for a personal feed row', () => {
    const name = feedCardAuthorName(
      {
        post_id: 'p1',
        post_content: null,
        derived_format: 'video',
        poster_url: null,
        duration_seconds: null,
        creator_username: 'machgolfclub',
        creator_display_name: 'Mac Heed',
        like_count: 0,
        course_name: null,
      },
      { ...feedPost, actorType: 'personal', actorId: 'user-1', displayName: 'Mac Heed' } as FeedPost,
    );
    expect(name).toBe('Mac Heed');
  });
});
