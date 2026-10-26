import { describe, expect, it } from 'vitest';
import { isNewSignup } from './isNewSignup';

const last_sign_in_at = '2026-10-26T09:00:00.000Z';
describe('CB87 isNewSignup', () => {
  it('recognises email confirmation ten minutes after the code was requested', () => {
    expect(isNewSignup({ created_at: '2026-10-26T08:50:00Z', email_confirmed_at: last_sign_in_at, last_sign_in_at })).toBe(true);
  });
  it.each(['Apple', 'Google'])('%s creation 300ms before sign-in is a signup', () => {
    expect(isNewSignup({ created_at: '2026-10-26T08:59:59.700Z', last_sign_in_at })).toBe(true);
  });
  it('a returning member created and confirmed months ago is not a signup', () => {
    expect(isNewSignup({ created_at: '2026-01-01T00:00:00Z', email_confirmed_at: '2026-01-01T00:01:00Z', last_sign_in_at })).toBe(false);
  });
  it.each([['60,000ms', '2026-10-26T08:59:00.000Z', true], ['60,001ms', '2026-10-26T08:58:59.999Z', false]] as const)('creation boundary %s is inclusive', (_name, created_at, expected) => {
    expect(isNewSignup({ created_at, last_sign_in_at })).toBe(expected);
  });
  it.each([['2026-10-26T08:59:00.000Z', true], ['2026-10-26T08:58:59.999Z', false]] as const)('confirmation boundary %s uses the same window', (email_confirmed_at, expected) => {
    expect(isNewSignup({ email_confirmed_at, last_sign_in_at })).toBe(expected);
  });
  it('missing last sign-in is false', () => {
    expect(isNewSignup({ created_at: last_sign_in_at })).toBe(false);
    expect(isNewSignup(null)).toBe(false); expect(isNewSignup(undefined)).toBe(false);
  });
  it('unparseable last sign-in is false even with valid creation', () => {
    expect(isNewSignup({ created_at: last_sign_in_at, last_sign_in_at: 'not-a-date' })).toBe(false);
  });
  it('unparseable creation and confirmation are false', () => {
    expect(isNewSignup({ created_at: 'invalid', email_confirmed_at: 'invalid', last_sign_in_at })).toBe(false);
  });
  it('missing creation and confirmation are false', () => {
    expect(isNewSignup({ last_sign_in_at })).toBe(false);
  });
  it('confirmed_at supplies the nullish email-confirmation fallback', () => {
    expect(isNewSignup({ email_confirmed_at: null, confirmed_at: last_sign_in_at, last_sign_in_at })).toBe(true);
    expect(isNewSignup({ email_confirmed_at: 'invalid', confirmed_at: last_sign_in_at, last_sign_in_at })).toBe(false);
  });
  it('a valid creation branch still works when confirmation is unparseable', () => {
    expect(isNewSignup({ email_confirmed_at: 'invalid', created_at: last_sign_in_at, last_sign_in_at })).toBe(true);
  });
  it('parses equivalent times with different timezone strings', () => {
    expect(isNewSignup({ created_at: '2026-10-26T10:00:00+01:00', last_sign_in_at })).toBe(true);
  });
  it('uses the optional window instead of a fixed minute', () => {
    expect(isNewSignup({ created_at: '2026-10-26T08:59:59.700Z', last_sign_in_at }, 300)).toBe(true);
    expect(isNewSignup({ created_at: '2026-10-26T08:59:59.700Z', last_sign_in_at }, 299)).toBe(false);
  });
});