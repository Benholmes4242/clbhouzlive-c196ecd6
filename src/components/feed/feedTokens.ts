/**
 * Feed post ink and surface. One owner, shared by FeedCard and ReviewPostCard
 * (BRIEF_REVIEW_POST_V2 R.2) so a review and a round read as one voice.
 * Lives here, not in FeedCard, because FeedCard imports ReviewPostCard.
 */
import { SLAB } from './feedSurfaces';

export const CARD = SLAB;
export const T100 = '#F8FAFC';
export const T60 = 'rgba(248,250,252,0.65)';
export const T40 = 'rgba(248,250,252,0.45)';
export const LINE = 'rgba(255,255,255,0.08)';
