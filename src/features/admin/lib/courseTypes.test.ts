import { describe, expect, it } from 'vitest';
import { COURSE_TYPES } from '../constants';

/**
 * golf_courses.course_type is the enum public.course_type. The admin selects
 * send the lower-cased label straight to that column, so a label the enum does
 * not carry is a 400 on save. This list is the enum, copied from the database;
 * a label added to COURSE_TYPES before the enum accepts it fails here instead.
 */
const COURSE_DB_ENUM = [
  'links',
  'parkland',
  'heathland',
  'coastal',
  'desert',
  'mountain',
  'mixed',
  'resort',
] as const;

describe('Admin course types match the course_type enum', () => {
  it('every COURSE_TYPES label lower-cases to an enum value', () => {
    const accepted = new Set<string>(COURSE_DB_ENUM);
    const rejected = COURSE_TYPES.filter((label) => !accepted.has(label.toLowerCase()));
    expect(rejected).toEqual([]);
  });
});
