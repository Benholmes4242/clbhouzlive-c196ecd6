// Round share card - 1200 x 630 OG image, analytical treatment.
//
// No photograph behind the figures (unreadable at thumbnail size, which is
// the real use case), no watermark beyond the small clbhouz footer mark.
// Absent values render nothing at all - never a zero.

import satori from 'npm:satori@0.10.13';
import { initWasm, Resvg } from 'npm:@resvg/resvg-wasm@2.6.2';
import { GEIST_700_B64, GEIST_800_B64, b64ToBytes } from './fonts.ts';

// Light analytical surface + the settled golf score convention.
const CANVAS = '#F4F6F9';
const PANEL = '#FFFFFF';
const INK = '#0E1216';
const MUTE = '#68707B';
const AMBER_DEEP = '#C2620A';
const HAIRLINE = '#E4E8ED';
const UNDER = '#D2222D';

export interface RoundCardData {
  playDate?: string | null;       // ISO date
  courseName?: string | null;
  grossScore?: number | null;
  coursePar?: number | null;
  stablefordPoints?: number | null;
  birdies?: number | null;
  playerName?: string | null;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatKicker(iso?: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!m) return null;
  const day = String(Number(m[3]));
  return day + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1];
}

function toParText(gross?: number | null, par?: number | null): { text: string; colour: string } | null {
  if (gross == null || par == null) return null;
  const diff = gross - par;
  if (diff === 0) return { text: 'E', colour: MUTE };
  if (diff < 0) return { text: String(diff), colour: UNDER };
  return { text: '+' + diff, colour: INK };
}

// Minimal element factory - avoids needing JSX in the edge runtime.
type El = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown): El => ({
  type,
  props: { style, children },
});

function figure(label: string, value: string, opts: { hero?: boolean; colour?: string }): El {
  const hero = !!opts.hero;
  return el('div', { display: 'flex', flexDirection: 'column' }, [
    el(
      'div',
      {
        fontSize: hero ? 20 : 17,
        fontWeight: 700,
        letterSpacing: hero ? 2.4 : 2,
        color: MUTE,
        marginBottom: hero ? 10 : 6,
      },
      label,
    ),
    el(
      'div',
      {
        fontSize: hero ? 104 : 52,
        fontWeight: 800,
        letterSpacing: -3,
        lineHeight: 1,
        color: opts.colour ?? INK,
      },
      value,
    ),
  ]);
}

function buildTree(data: RoundCardData): El {
  const kicker = formatKicker(data.playDate);
  const toPar = toParText(data.grossScore, data.coursePar);

  const heroFigures: El[] = [];
  if (data.grossScore != null) heroFigures.push(figure('GROSS', String(data.grossScore), { hero: true }));
  if (toPar) heroFigures.push(figure('TO PAR', toPar.text, { hero: true, colour: toPar.colour }));

  const subFigures: El[] = [];
  if (data.stablefordPoints != null) {
    subFigures.push(figure('STABLEFORD', String(data.stablefordPoints), {}));
  }
  if (data.birdies != null) subFigures.push(figure('BIRDIES', String(data.birdies), {}));

  const panelChildren: unknown[] = [];
  if (kicker) {
    panelChildren.push(
      el(
        'div',
        { fontSize: 22, fontWeight: 700, letterSpacing: 3, color: AMBER_DEEP, marginBottom: 14 },
        kicker,
      ),
    );
  }
  if (data.courseName) {
    panelChildren.push(
      el(
        'div',
        {
          display: 'flex',
          fontSize: data.courseName.length > 30 ? 52 : 68,
          fontWeight: 800,
          letterSpacing: -1.8,
          lineHeight: 1.06,
          color: INK,
          maxWidth: 1000,
          marginBottom: 30,
        },
        data.courseName,
      ),
    );
  }
  if (heroFigures.length > 0) {
    panelChildren.push(el('div', { display: 'flex', gap: 96, marginBottom: 26 }, heroFigures));
  }
  if (subFigures.length > 0) {
    panelChildren.push(el('div', { display: 'flex', gap: 104 }, subFigures));
  }

  const footerChildren: unknown[] = [
    el(
      'div',
      { fontSize: 26, fontWeight: 700, letterSpacing: 0.2, color: INK },
      data.playerName || '',
    ),
    el('div', { fontSize: 22, fontWeight: 700, letterSpacing: 1.6, color: MUTE }, 'clbhouz'),
  ];

  return el(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: CANVAS,
      padding: 28,
      fontFamily: 'Geist',
    },
    [
      el(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          backgroundColor: PANEL,
          border: '1px solid ' + HAIRLINE,
          borderRadius: 10,
          padding: '44px 56px',
          justifyContent: 'space-between',
        },
        [
          el('div', { display: 'flex', flexDirection: 'column' }, panelChildren),
          el(
            'div',
            {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '1px solid ' + HAIRLINE,
              paddingTop: 22,
            },
            footerChildren,
          ),
        ],
      ),
    ],
  );
}

let wasmReady: Promise<void> | null = null;
async function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = initWasm(
      fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm'),
    ) as unknown as Promise<void>;
  }
  await wasmReady;
}

export async function renderRoundCardSvg(data: RoundCardData): Promise<string> {
  const fonts = [
    { name: 'Geist', data: b64ToBytes(GEIST_700_B64), weight: 700 as const, style: 'normal' as const },
    { name: 'Geist', data: b64ToBytes(GEIST_800_B64), weight: 800 as const, style: 'normal' as const },
  ];
  // deno-lint-ignore no-explicit-any
  return await satori(buildTree(data) as any, { width: 1200, height: 630, fonts: fonts as any });
}

export async function renderRoundCardPng(data: RoundCardData): Promise<Uint8Array> {
  const svg = await renderRoundCardSvg(data);
  await ensureWasm();
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}
