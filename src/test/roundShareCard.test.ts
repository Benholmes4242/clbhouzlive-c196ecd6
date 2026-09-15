/**
 * ROUND SHARE PREVIEW - the pure half of functions/_lib/round.js.
 *
 * The document builder itself only joins these tags to metaDocument, which the
 * other preview Functions already own; what can go wrong is the title, the
 * to-par sign and the fail-closed rule, so those are what is tested.
 */
import { describe, it, expect } from 'vitest';
// plain JS Function helper, no types
import { roundMeta, toParLabel } from '../../functions/_lib/round.js';

const card = {
  player_name: 'Danny Robinson',
  gross_score: 69,
  course_par: 71,
  play_date: '2026-08-11',
  course_name: 'Broadstone Golf Club',
  course_image: 'https://img/broadstone.jpg',
};

describe('to-par label', () => {
  it('is E at level par', () => expect(toParLabel(71, 71)).toBe('E'));
  it('is +3 over par', () => expect(toParLabel(74, 71)).toBe('+3'));
  it('uses a TRUE MINUS under par', () => expect(toParLabel(69, 71)).toBe('\u22122'));
  it('is null without a par', () => expect(toParLabel(69, NaN)).toBeNull());
});

describe('round share card tags', () => {
  it('a public round gives the round card', () => {
    const meta = roundMeta(card);
    expect(meta.title).toBe('Danny Robinson \u00B7 69 (\u22122) at Broadstone Golf Club');
    expect(meta.description).toBe('11 August 2026 on clbhouz');
    expect(meta.image).toBe('https://img/broadstone.jpg');
  });

  it('brand is lowercase in the description', () => {
    expect(roundMeta(card).description).toContain('on clbhouz');
    expect(roundMeta(card).description).not.toContain('Clbhouz');
  });

  it('no par means no to-par in the title, and the gross still shows', () => {
    expect(roundMeta({ ...card, course_par: null }).title).toBe(
      'Danny Robinson \u00B7 69 at Broadstone Golf Club',
    );
  });

  it('no course image leaves the site fallback to metaDocument', () => {
    expect(roundMeta({ ...card, course_image: null }).image).toBeUndefined();
  });

  // FAIL CLOSED: a private round, a deleted account or an unknown id all reach
  // here as NO ROW, because the RPC gates on whs_score_publicly_visible().
  it('a private round (no row) gives no card, so the caller serves the generic one', () => {
    expect(roundMeta(null)).toBeNull();
  });
  it('an unknown id (no row) gives no card', () => {
    expect(roundMeta(undefined)).toBeNull();
  });
  it('a row without a gross gives no card', () => {
    expect(roundMeta({ ...card, gross_score: null })).toBeNull();
  });
  it('a row without a player or a course gives no card', () => {
    expect(roundMeta({ ...card, player_name: '' })).toBeNull();
    expect(roundMeta({ ...card, course_name: null })).toBeNull();
  });
});
