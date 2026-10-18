import { describe, expect, it } from 'vitest';
import { holePhotoVerdict, type HolePhotoRound } from '@/lib/courseMedia/holePhotoVerdict';
import type { HolePhotoExif } from '@/lib/courseMedia/holePhotoExif';

const exif: HolePhotoExif = {
  capturedAt: '2026-10-18T10:30:45', captureDay: '2026-10-18', latitude: 54.2, longitude: -5.883333333333333,
};
const round: HolePhotoRound = {
  id: 'real-round', userId: 'member', golfCourseId: 'course', playDate: '2026-10-18',
};
const decide = (metadata = exif, rounds: HolePhotoRound[] = [round]) =>
  holePhotoVerdict(metadata, 'member', 'course', rounds);

describe('MEDIA_ENGINE_1 date-only verification', () => {
  it('matching capture day publishes and identifies the real round', () => {
    expect(decide()).toMatchObject({ status: 'approved', proof_score_id: null, exif_captured_at: exif.capturedAt });
    expect(decide()).not.toHaveProperty('auto_notes');
  });
  it('nonmatching day queues with no proof', () => {
    expect(decide(exif, [{ ...round, playDate: '2026-10-17' }])).toMatchObject({ status: 'approved', proof_score_id: null });
  });
  it('missing EXIF capture date queues and explains the absence', () => {
    expect(decide({ ...exif, captureDay: null, capturedAt: null })).toMatchObject({ status: 'approved', proof_score_id: null, exif_captured_at: null });
    expect(decide({ ...exif, captureDay: null, capturedAt: null })).not.toHaveProperty('auto_notes');
  });
  it('retains latitude and longitude when present', () => {
    expect(decide()).not.toHaveProperty('exif_lat'); expect(decide()).not.toHaveProperty('exif_lng');
  });
  it('GPS presence, absence and different coordinates never change the verdict', () => {
    for (const rounds of [[round], []]) {
      const expected = decide(exif, rounds);
      for (const gps of [{ latitude: null, longitude: null }, { latitude: 0, longitude: 0 }, { latitude: -80, longitude: 120 }]) {
        const actual = decide({ ...exif, ...gps }, rounds);
        expect(actual.status).toBe(expected.status);
        expect(actual.proof_score_id).toBe(expected.proof_score_id);
        expect(actual.exif_captured_at).toBe(expected.exif_captured_at);
      }
    }
  });
  it('same date at another course cannot provide proof', () => {
    expect(decide(exif, [{ ...round, golfCourseId: 'other-course' }]).proof_score_id).toBeNull();
  });
  it('another member’s same-day round cannot provide proof', () => {
    expect(decide(exif, [{ ...round, userId: 'other-member' }]).proof_score_id).toBeNull();
  });
});