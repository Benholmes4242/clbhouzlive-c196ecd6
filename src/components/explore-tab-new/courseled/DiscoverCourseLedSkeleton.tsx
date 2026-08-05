import React from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { CARD_SHELL } from './tokens';
import { HONOURS_SHELL, GOLD_HAIR } from './HonoursBoard';

/**
 * DISCOVER, COURSE-LED — loading silhouette.
 *
 * Every block below is measured off the shipped component it stands in for
 * (rail card 200x(88+52), tour card 272x(100 + stat row + meta line), world
 * card image 128 over three 48px rows, mosaic 220 tall + 106 shorts, most
 * played rows 60, honours header + 58px rows), so the loaded page lands on
 * its own outline with no section boundary shifting.
 */


/**
 * Shimmer block. The base fill is INLINE because `.clb-shimmer-light` sets the
 * `background` shorthand, which would otherwise wipe out a `bg-*` utility class
 * and leave the bars invisible on the canvas.
 */
function Bar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`clb-shimmer-light ${className ?? ''}`}
      style={{ backgroundColor: A.TRACK, borderRadius: 6, ...style }}
    />
  );
}

/** Eyebrow: the live KICKER line box measures 15px with a 10px gap beneath. */
function EyebrowBar({ w = 150, aside = false }: { w?: number; aside?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 2px',
        marginBottom: 10,
        height: 15,
      }}
    >
      <Bar style={{ height: 10, width: w }} />
      {aside ? (
        <Bar style={{ height: 10, width: 44, marginLeft: 'auto' }} />
      ) : null}
    </div>
  );
}

function TextBar({ w, h = 11 }: { w: number | string; h?: number }) {
  return <Bar style={{ height: h, width: w }} />;
}

/** Section 2 — friends rail: 200px cards, 88px image, 52px body. */
function FriendsRail() {
  return (
    <section>
      <EyebrowBar w={168} aside />
      <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...CARD_SHELL, width: 200, flexShrink: 0 }}>
            <Bar style={{ borderRadius: 0, height: 88, width: '100%' }} />
            <div
              style={{
                padding: '9px 11px',
                minHeight: 52,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <TextBar w={96} h={12} />
                <TextBar w={62} h={10} />
              </div>
              <TextBar w={20} h={15} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Section 3 — tour rail: 272px cards, 100px image, 3-cell stat row, meta line. */
function TourRail() {
  return (
    <section>
      <EyebrowBar w={140} aside />
      <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ ...CARD_SHELL, width: 272, flexShrink: 0 }}>
            <Bar style={{ borderRadius: 0, height: 100, width: '100%' }} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                padding: '10px 12px 20px',
              }}
            >
              {[0, 1, 2].map((c) => (
                <div
                  key={c}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <TextBar w={26} h={9} />
                  <TextBar w={38} h={14} />
                </div>
              ))}
            </div>
            <div style={{ padding: '0 12px 15px' }}>
              <TextBar w={150} h={11} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Section 4 — around the world: pill row, then one card (128px image + 3 rows). */
function AroundTheWorldCard() {
  return (
    <section>
      <EyebrowBar w={132} aside />
      <div
        style={{
          margin: '0 -14px 12px',
          padding: '12px 16px',
          display: 'flex',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        {[64, 78, 56, 92, 70].map((w, i) => (
          <Bar
            key={i}
            style={{ height: 34, width: w, borderRadius: 999, flexShrink: 0 }}
          />

        ))}
      </div>
      <div style={CARD_SHELL}>
        <Bar style={{ borderRadius: 0, height: 128, width: '100%' }} />
        <div style={{ padding: '3px 16px 5px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 0',
                borderBottom: i === 2 ? 'none' : `1px solid ${A.BORDER}`,
              }}
            >
              <Bar style={{ height: 30, width: 30, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <TextBar w={112} h={13} />
                <TextBar w={148} h={11} />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <TextBar w={30} h={14} />
                <TextBar w={22} h={9} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Section 5 — moments mosaic: tall 220 lead tile, 106 shorts, 8px gap. */
function MomentsMosaic() {
  return (
    <section>
      <EyebrowBar w={158} aside />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Bar style={{ height: 220, borderRadius: 14, gridRow: 'span 2' }} />
        <Bar style={{ height: 106, borderRadius: 14 }} />
        <Bar style={{ height: 106, borderRadius: 14 }} />
      </div>
    </section>
  );
}

/** Section 6 — most played: panel of rows (rank + 40px thumb + bars + figure). */
function MostPlayedPanel() {
  return (
    <section>
      <EyebrowBar w={152} aside />
      <div style={{ ...CARD_SHELL, padding: '4px 14px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '10px 0',
              borderBottom: i === 2 ? 'none' : `1px solid ${A.BORDER}`,
            }}
          >
            <TextBar w={14} h={12} />
            <Bar style={{ height: 40, width: 40, borderRadius: 11, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <TextBar w={130} h={13} />
              <TextBar w={72} h={11} />
            </div>
            <TextBar w={26} h={15} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Section 7 — honours board: gold-wash panel, centred header, 2 rows. */
function HonoursPanel() {
  return (
    <section>
      <div style={{ ...HONOURS_SHELL, padding: '4px 14px' }}>
        <div
          style={{
            padding: '14px 0 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 7,
            borderBottom: `1px solid ${GOLD_HAIR}`,
          }}
        >
          <TextBar w={128} h={10} />
          <TextBar w={190} h={10} />
        </div>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '11px 0',
              borderBottom: i === 1 ? 'none' : `1px solid ${GOLD_HAIR}`,
            }}
          >
            <Bar style={{ height: 30, width: 30, borderRadius: 999, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <TextBar w={140} h={13} />
              <TextBar w={104} h={11} />
            </div>
            <TextBar w={34} h={16} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DiscoverCourseLedSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{ background: A.CANVAS, minHeight: '100vh', fontFamily: SANS }}
    >
      {/* Header block — the live kicker line box is 15px, the h1's is 39px, so
          the bars sit inside boxes of those heights and the title lands put. */}
      <div
        style={{
          padding: '0 16px 12px',
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 52px)',
        }}
      >
        <div style={{ height: 15, display: 'flex', alignItems: 'center' }}>
          <Bar style={{ height: 10, width: 96 }} />
        </div>
        <div style={{ height: 39, marginTop: 7, display: 'flex', alignItems: 'center' }}>
          <Bar style={{ height: 26, width: 232 }} />
        </div>
      </div>


      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <FriendsRail />
        <TourRail />
        <AroundTheWorldCard />
        <MomentsMosaic />
        <MostPlayedPanel />
        <HonoursPanel />
      </div>
    </div>
  );
}
