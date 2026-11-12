import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { GOLFER_REASON_LABEL } from '../../supabase/functions/_shared/verificationRevocationReasons';

// Load the exported pure builders without starting Deno or making any requests.
function loadBuilders(name: string) {
  const source = readFileSync(resolve(__dirname, `../../supabase/functions/${name}/index.ts`), 'utf8');
  const pure = source.slice(0, source.indexOf('serve(async'))
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/const supabaseAdmin = createClient\([\s\S]*?\n\);/, '');
  const js = ts.transpileModule(pure, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: Record<string, any> = {};
  new Function('exports', 'GOLFER_REASON_LABEL', js)(exports, GOLFER_REASON_LABEL);
  return exports;
}

const { buildGolferPush } = loadBuilders('verify-golfer-decision');
const { buildGolferEmail } = loadBuilders('send-golfer-verification-result-email');
const email = (outcome: string, kind: string | null, reason: string | null = null, note: string | null = null) =>
  buildGolferEmail('member@example.com', outcome, kind, reason, note, 'https://clbhouz.co.uk');

describe('verification message payloads', () => {
  it('push copy never contains capitalised clbhouz across every outcome and reason', () => {
    for (const outcome of ['approved', 'rejected', 'removed']) {
      for (const isPro of [true, false]) {
        for (const reason of [null, ...Object.keys(GOLFER_REASON_LABEL)]) {
          expect(JSON.stringify(buildGolferPush(outcome, isPro, reason, 'Please contact support.'))).not.toContain('Clbhouz');
        }
      }
    }
  });

  it('email copy never contains capitalised clbhouz across every kind, outcome and reason', () => {
    for (const kind of [null, 'tour_pro', 'teaching_pro']) {
      for (const outcome of ['approved', 'rejected', 'removed']) {
        for (const reason of [null, ...Object.keys(GOLFER_REASON_LABEL)]) {
          expect(JSON.stringify(email(outcome, kind, reason, 'Please contact support.'))).not.toContain('Clbhouz');
        }
      }
    }
  });

  it('approved pro push matches the in-app pro title and body', () => {
    expect(buildGolferPush('approved', true, null, null)).toEqual({
      title: "You're verified as a pro",
      body: 'Your PRO label is live. No handicap needed.',
    });
  });

  it('approved amateur push retains generic wording with lowercase branding', () => {
    expect(buildGolferPush('approved', false, null, null)).toEqual({
      title: "You're verified",
      body: 'Your verified badge is now live across clbhouz.',
    });
  });

  it('email payload sends from support and accepts replies at support', () => {
    for (const outcome of ['approved', 'rejected', 'removed']) {
      expect(email(outcome, 'teaching_pro')).toMatchObject({
        from: 'clbhouz <support@clbhouz.co.uk>',
        reply_to: 'support@clbhouz.co.uk',
      });
    }
  });

  it('approved pro emails explain the PRO label and no-handicap rule for both kinds', () => {
    for (const [kind, label] of [['teaching_pro', 'teaching professional'], ['tour_pro', 'tour professional']]) {
      const payload = email('approved', kind);
      const body = `Your profile now shows you're a verified ${label}. Your PRO label is live and no handicap is needed.`;
      expect(payload.subject).toBe("You're verified as a pro on clbhouz");
      expect(payload.text).toBe(`${body}\n\nhttps://clbhouz.co.uk`);
      expect(payload.html).toContain(body);
      expect(payload.html).toContain('Open clbhouz');
    }
  });
});