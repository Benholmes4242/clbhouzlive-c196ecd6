/**
 * BRIEF_YOU_TAB_THIN_COURSE_1 P1 — the thin-course minimum. Two rounds is not
 * a field: below COURSE_FIELD_MIN_ROUNDS the course-side claims (the "Here"
 * rate, the harder-than line, the "course record" noun) come off, while the
 * viewer-side projection is unaffected. This pins the minimum and the gate so
 * the next comparison added to the page clears the same bar.
 */
import { describe, expect, it } from 'vitest';
import { COURSE_FIELD_MIN_ROUNDS, courseFieldKnown } from '@/lib/courseYou/youDerivations';

describe('courseFieldKnown (YOU_TAB_THIN_COURSE_1)', () => {
  it('the minimum is 5, aligned with the field chart floor', () => {
    expect(COURSE_FIELD_MIN_ROUNDS).toBe(5);
  });

  it('two tracked rounds — Trump International Aberdeen — is not a field', () => {
    expect(courseFieldKnown(2)).toBe(false);
  });

  it('the minimum itself clears the gate', () => {
    expect(courseFieldKnown(COURSE_FIELD_MIN_ROUNDS)).toBe(true);
    expect(courseFieldKnown(COURSE_FIELD_MIN_ROUNDS - 1)).toBe(false);
  });

  it('an unknown round count cannot claim to describe the course', () => {
    expect(courseFieldKnown(null)).toBe(false);
    expect(courseFieldKnown(undefined)).toBe(false);
    expect(courseFieldKnown(NaN)).toBe(false);
  });
});
