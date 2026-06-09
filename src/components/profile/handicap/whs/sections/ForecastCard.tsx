import React from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import { useHandicapTrend } from '@/lib/whs/hooks';
import { buildForecast, type Forecast, type CounterCell } from '@/lib/whs/forecast';
import { DarkSectionHeader } from './_shared/darkAtoms';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

// ── Tokens ──────────────────────────────────────────────────────────
const T = {
  cardBg: 'var(--hcp-bg-1)',
  border: 'var(--hcp-line-2)',
  divider: 'var(--hcp-line)',
  textHi: 'var(--hcp-t-100)',
  textMid: 'var(--hcp-t-60)',
  textLow: 'var(--hcp-t-40)',
  good: 'var(--hcp-good-deep)',
  goodSoft: 'var(--hcp-good-2)',
  goodFill: 'rgba(74,222,128,0.18)',
  goodPill: 'rgba(5,150,105,0.16)',
  goodBorder: 'rgba(5,150,105,0.35)',
  bad: 'var(--hcp-bad-deep)',
  badSoft: 'var(--hcp-bad)',
  badPill: 'rgba(159,29,29,0.18)',
  badBorder: 'rgba(159,29,29,0.40)',
  amber: 'var(--hcp-amber)',
  amberPill: 'rgba(247,147,30,0.14)',
  amberBorder: 'rgba(247,147,30,0.30)',
  neutralFill: 'var(--hcp-bg-3)',
};

interface Props {
  connectionId: string;
  currentHandicap: number | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const ForecastCard: React.FC<Props> = ({
  connectionId,
  currentHandicap: passedHcp,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { data: allScores, isLoading: scoresLoading } = useAllScores(connectionId);
  const { data: trend } = useHandicapTrend(connectionId);
  const currentHandicap = passedHcp ?? trend?.current ?? null;

  const possessiveCap = viewMode === 'friend'
    ? (ownerFirstName ? `${ownerFirstName}'s` : 'Their')
    : 'Your';
  const possessiveLower = viewMode === 'friend'
    ? (ownerFirstName ? `${ownerFirstName}'s` : 'their')
    : 'your';
  const subjectCap = viewMode === 'friend' ? (ownerFirstName ?? 'They') : 'You';
  const subjectLower = viewMode === 'friend' ? (ownerFirstName ?? 'they') : 'you';
  const hasVerb = viewMode === 'friend' && ownerFirstName ? 'has' : 'have';
  const needsVerb = viewMode === 'friend' && ownerFirstName ? 'needs' : 'need';

  if (scoresLoading) return <ForecastSkeleton eyebrow={`${possessiveCap} form`} />;

  const forecast = buildForecast(allScores ?? [], currentHandicap, 7);

  return (
    <section style={{ marginTop: 0, fontFamily: FONT }}>
      <DarkSectionHeader eyebrow={`${possessiveCap} form`} />
      {renderStateCard(forecast, { possessiveLower, subjectCap, subjectLower, hasVerb, needsVerb, viewMode })}
    </section>
  );
};

interface CopyCtx {
  possessiveLower: string;
  subjectCap: string;
  subjectLower: string;
  hasVerb: string;
  needsVerb: string;
  viewMode: 'owner' | 'friend';
}

function renderStateCard(f: Forecast, ctx: CopyCtx) {
  switch (f.state) {
    case 'sharp-drop': return <SharpDropCard f={f} ctx={ctx} />;
    case 'sharp-rise': return <SharpRiseCard f={f} ctx={ctx} />;
    case 'improving': return <NormalCard f={f} tone="good" ctx={ctx} />;
    case 'worsening': return <NormalCard f={f} tone="amber" ctx={ctx} />;
    case 'steady': return <NormalCard f={f} tone="neutral" ctx={ctx} />;
    case 'building': return <BuildingCard f={f} ctx={ctx} />;
    case 'brand-new': return <BrandNewCard ctx={ctx} />;
  }
}

// ── Shared shell ────────────────────────────────────────────────────

const CardShell: React.FC<{
  borderColor?: string;
  bgTint?: string;
  glow?: 'red' | 'green' | null;
  children: React.ReactNode;
}> = ({ borderColor, bgTint, glow, children }) => (
  <div
    style={{
      margin: '0 16px',
      background: bgTint ? `${bgTint}, ${T.cardBg}` : T.cardBg,
      border: `1px solid ${borderColor ?? T.border}`,
      borderRadius: 16,
      overflow: 'hidden',
      fontFamily: FONT,
      boxShadow:
        glow === 'red'
          ? '0 0 24px rgba(239,68,68,0.28)'
          : glow === 'green'
            ? '0 0 24px rgba(52,211,153,0.26)'
            : undefined,
    }}
  >
    {children}
  </div>
);

// ── Eyebrow row above headline ──────────────────────────────────────

const EyebrowRow: React.FC<{
  left: React.ReactNode;
  right?: React.ReactNode;
  color?: string;
}> = ({ left, right, color }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      padding: '14px 18px 6px',
      gap: 8,
    }}
  >
    <span
      style={{
        textTransform: 'uppercase',
        fontSize: 10,
        letterSpacing: '0.18em',
        fontWeight: 800,
        color: color ?? T.textMid,
      }}
    >
      {left}
    </span>
    {right && (
      <span
        style={{
          textTransform: 'uppercase',
          fontSize: 10,
          letterSpacing: '0.14em',
          fontWeight: 700,
          color: T.textLow,
        }}
      >
        {right}
      </span>
    )}
  </div>
);

// ── Headline number ─────────────────────────────────────────────────

const Headline: React.FC<{
  numberValue: string;
  numberColor: string;
  prose: React.ReactNode;
}> = ({ numberValue, numberColor, prose }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      padding: '0 18px 14px',
    }}
  >
    <span
      style={{
        fontSize: 56,
        fontWeight: 700,
        letterSpacing: '-0.045em',
        lineHeight: 0.95,
        color: numberColor,
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}
    >
      {numberValue}
    </span>
    <span
      style={{
        fontSize: 12.5,
        lineHeight: 1.35,
        color: T.textMid,
        textAlign: 'right',
        maxWidth: 200,
        paddingBottom: 6,
      }}
    >
      {prose}
    </span>
  </div>
);

// ── Counter strip ───────────────────────────────────────────────────

const CounterStrip: React.FC<{
  cells: CounterCell[];
  selectedCellId: string | null;
  onSelect: (id: string | null) => void;
}> = ({ cells, selectedCellId, onSelect }) => {
  if (cells.length === 0) return null;
  const diffs = cells.map((c) => c.differential);
  const minDiff = Math.min(...diffs);
  const maxDiff = Math.max(...diffs);
  const range = Math.max(maxDiff - minDiff, 1);

  return (
    <div
      style={{
        display: 'flex',
        gap: 5,
        height: 36,
        alignItems: 'flex-end',
        padding: '0 18px',
      }}
    >
      {cells.map((cell) => {
        const norm = (cell.differential - minDiff) / range;
        const heightPct = 30 + norm * 62;
        const isLowerHalf = cell.rank < 4;
        const fill = isLowerHalf ? T.goodFill : T.neutralFill;
        const isSelected = selectedCellId === cell.score.id;
        const shadow = isSelected
          ? `0 0 0 2px rgba(255,255,255,0.95)`
          : 'none';
        return (
          <button
            key={cell.score.id}
            type="button"
            aria-pressed={isSelected}
            aria-label={`Counter ${cell.rank + 1}: differential ${cell.differential.toFixed(1)}`}
            onClick={() => onSelect(isSelected ? null : cell.score.id)}
            style={{
              flex: 1,
              height: `${heightPct}%`,
              background: fill,
              border: 'none',
              borderRadius: 3,
              boxShadow: shadow,
              position: 'relative',
              padding: 0,
              cursor: 'pointer',
              transform: isSelected ? 'scaleY(1.05)' : 'scaleY(1)',
              transformOrigin: 'bottom',
              transition: 'transform 120ms ease, box-shadow 120ms ease',
              appearance: 'none',
              WebkitAppearance: 'none',
              fontFamily: FONT,
            }}
          >

            {(cell.isExpiring || cell.isNew) && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 9,
                  fontWeight: 800,
                  color: cell.isExpiring ? T.bad : T.good,
                  lineHeight: 1,
                }}
              >
                ▾
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ── Inline detail panel for selected counter ────────────────────────

const formatPlayDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const CounterDetailPanel: React.FC<{ cell: CounterCell }> = ({ cell }) => {
  const courseName = cell.score.course?.name ?? 'Unknown course';
  const status = cell.isExpiring ? 'Expiring soon' : cell.isNew ? 'New counter' : 'Counter';
  const statusColor = cell.isExpiring ? T.bad : cell.isNew ? T.good : T.textMid;

  const Item: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span
        style={{
          textTransform: 'uppercase',
          fontSize: 9,
          letterSpacing: '0.16em',
          fontWeight: 700,
          color: T.textLow,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: color ?? T.textHi,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      style={{
        margin: '10px 18px 0',
        padding: '10px 12px',
        border: `1px solid ${T.divider}`,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto',
        gap: 14,
        alignItems: 'center',
      }}
    >
      <Item label="Diff" value={cell.differential.toFixed(1)} />
      <Item label="Course" value={courseName} />
      <Item label="Date" value={formatPlayDate(cell.score.play_date)} />
      <Item label="Status" value={status} color={statusColor} />
    </div>
  );
};

// ── Strip band (header + strip + scale labels) ──────────────────────

const StripBand: React.FC<{ f: Forecast }> = ({ f }) => {
  const atRisk = Math.max(f.countersAtRiskInHorizon, f.expiringCount);
  const header =
    atRisk > 0
      ? `${atRisk} counter${atRisk > 1 ? 's' : ''} at risk over next ${f.roundsOut} rounds`
      : `Projection over ${f.roundsOut} rounds`;

  const [selectedCellId, setSelectedCellId] = React.useState<string | null>(null);
  const selectedCell = React.useMemo(
    () => f.counterCells.find((c) => c.score.id === selectedCellId) ?? null,
    [f.counterCells, selectedCellId],
  );

  return (
    <div
      style={{
        borderTop: `1px solid ${T.divider}`,
        padding: '12px 0 14px',
      }}
    >
      <div
        style={{
          padding: '0 18px 8px',
          textTransform: 'uppercase',
          fontSize: 9.5,
          letterSpacing: '0.18em',
          fontWeight: 700,
          color: T.textLow,
        }}
      >
        {header}
      </div>
      <CounterStrip
        cells={f.counterCells}
        selectedCellId={selectedCellId}
        onSelect={setSelectedCellId}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 18px 0',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: T.textLow,
          textTransform: 'uppercase',
        }}
      >
        <span>Best</span>
        <span>Weakest →</span>
      </div>
      {selectedCell && <CounterDetailPanel cell={selectedCell} />}
    </div>
  );
};

// ── Action footer ───────────────────────────────────────────────────

const ActionFooter: React.FC<{
  pillText: string;
  pillBg: string;
  pillBorder: string;
  pillColor: string;
  prose: React.ReactNode;
  footerBg?: string;
}> = ({ pillText, pillBg, pillBorder, pillColor, prose, footerBg }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 18px 14px',
      borderTop: `1px solid ${T.divider}`,
      background: footerBg ?? 'transparent',
    }}
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 10px',
        borderRadius: 999,
        background: pillBg,
        border: `1px solid ${pillBorder}`,
        fontSize: 12.5,
        fontWeight: 800,
        color: pillColor,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.01em',
        flexShrink: 0,
      }}
    >
      {pillText}
    </span>
    <span
      style={{
        fontSize: 12.5,
        lineHeight: 1.35,
        color: T.textMid,
      }}
    >
      {prose}
    </span>
  </div>
);

// ── Calm action line (no pill, no red border) ──────────────────────

const CalmActionLine: React.FC<{ prose: React.ReactNode }> = ({ prose }) => (
  <div
    style={{
      padding: '12px 18px 14px',
      borderTop: `1px solid ${T.divider}`,
      fontSize: 12.5,
      lineHeight: 1.4,
      color: T.textMid,
    }}
  >
    {prose}
  </div>
);

// ── State: Normal (worsening / improving / steady) ──────────────────

const NormalCard: React.FC<{ f: Forecast; tone: 'good' | 'amber' | 'neutral'; ctx: CopyCtx }> = ({ f, tone, ctx }) => {
  const isImproving = tone === 'good';
  const isWorsening = tone === 'amber';

  let headlineNumber: string;
  let headlineColor: string;
  let prose: React.ReactNode;

  if (isImproving) {
    headlineNumber = (f.projected ?? 0).toFixed(1);
    headlineColor = T.textHi;
    prose = (
      <>
        Heading{' '}
        <strong style={{ color: T.goodSoft, fontWeight: 700 }}>↓ down to ~{(f.projected ?? 0).toFixed(1)}</strong>{' '}
        over {ctx.possessiveLower} next <strong style={{ color: T.textHi, fontWeight: 700 }}>{f.roundsOut} rounds</strong>
      </>
    );
  } else if (isWorsening) {
    headlineNumber = (f.projected ?? 0).toFixed(1);
    headlineColor = T.textHi;
    prose = (
      <>
        Heading{' '}
        <strong style={{ color: T.badSoft, fontWeight: 700 }}>↑ up to ~{(f.projected ?? 0).toFixed(1)}</strong>{' '}
        over {ctx.possessiveLower} next <strong style={{ color: T.textHi, fontWeight: 700 }}>{f.roundsOut} rounds</strong>
      </>
    );
  } else {
    headlineNumber = (f.current ?? 0).toFixed(1);
    headlineColor = T.textHi;
    prose = (
      <>
        <strong style={{ color: T.textHi, fontWeight: 700 }}>Holding steady</strong> around{' '}
        <strong style={{ color: T.textHi, fontWeight: 700 }}>{(f.current ?? 0).toFixed(1)}</strong> over{' '}
        {ctx.possessiveLower} next <strong style={{ color: T.textHi, fontWeight: 700 }}>{f.roundsOut} rounds</strong>
      </>
    );
  }

  const eyebrowLeft = isImproving
    ? 'Heading down'
    : isWorsening
      ? 'Heading up'
      : 'Holding steady';
  const eyebrowColor = isImproving ? T.good : isWorsening ? T.amber : T.textMid;

  const cutTarget = f.cutTarget;
  let action: React.ReactNode = null;
  if (cutTarget != null) {
    const pillText = `Shoot ${cutTarget.toFixed(1)}+`;
    if (isImproving) {
      action = (
        <ActionFooter
          pillText={pillText}
          pillBg={T.goodPill}
          pillBorder={T.goodBorder}
          pillColor={T.good}
          prose={
            <>
              next round to <strong style={{ color: T.textHi, fontWeight: 700 }}>extend the run</strong>.
            </>
          }
        />
      );
    } else if (isWorsening) {
      action = (
        <ActionFooter
          pillText={pillText}
          pillBg={T.amberPill}
          pillBorder={T.amberBorder}
          pillColor={T.amber}
          prose={
            <>
              next round to <strong style={{ color: T.textHi, fontWeight: 700 }}>break the trend</strong>.
            </>
          }
        />
      );
    } else {
      action = (
        <ActionFooter
          pillText={pillText}
          pillBg="rgba(255,255,255,0.06)"
          pillBorder="rgba(255,255,255,0.14)"
          pillColor={T.textHi}
          prose={
            <>
              next round to{' '}
              <strong style={{ color: T.textHi, fontWeight: 700 }}>start a downward trend</strong>.
            </>
          }
        />
      );
    }
  }

  return (
    <CardShell glow={tone === 'good' ? 'green' : tone === 'amber' ? 'red' : null}>
      <EyebrowRow left={eyebrowLeft} right={f.whenLabel ?? undefined} color={eyebrowColor} />
      <Headline numberValue={headlineNumber} numberColor={headlineColor} prose={prose} />
      <StripBand f={f} />
      {action}
    </CardShell>
  );
};

// ── State: Sharp drop ───────────────────────────────────────────────

const SharpDropCard: React.FC<{ f: Forecast; ctx: CopyCtx }> = ({ f, ctx }) => (
  <CardShell>
    <EyebrowRow left="On a tear" right={f.whenLabel ?? undefined} color={T.good} />
    <Headline
      numberValue={(f.projected ?? 0).toFixed(1)}
      numberColor={T.textHi}
      prose={
        <>
          On track for a{' '}
          <strong style={{ color: T.goodSoft, fontWeight: 700 }}>↓ {Math.abs(f.delta ?? 0).toFixed(1)} drop</strong>{' '}
          to <strong style={{ color: T.textHi, fontWeight: 700 }}>~{(f.projected ?? 0).toFixed(1)}</strong> over{' '}
          {ctx.possessiveLower} next <strong style={{ color: T.textHi, fontWeight: 700 }}>{f.roundsOut} rounds</strong>
        </>
      }
    />
    <StripBand f={f} />
    <ActionFooter
      pillText="Hold form"
      pillBg={T.goodPill}
      pillBorder={T.goodBorder}
      pillColor={T.good}
      prose={
        <>
          {ctx.viewMode === 'friend'
            ? <>{ctx.subjectCap} just {ctx.needsVerb} to keep playing at {ctx.possessiveLower} last 5 level — </>
            : <>Keep playing at {ctx.possessiveLower} last 5 level — </>}
          <strong style={{ color: T.textHi, fontWeight: 700 }}>{f.newCount} new counter{f.newCount === 1 ? '' : 's'}</strong>{' '}
          locking in a new low.
        </>
      }
    />
  </CardShell>
);

// ── State: Sharp rise ───────────────────────────────────────────────

const SharpRiseCard: React.FC<{ f: Forecast; ctx: CopyCtx }> = ({ f, ctx }) => {
  const cutTarget = f.cutTarget;
  return (
    <CardShell glow="red">
      <EyebrowRow left="Form alert" right={f.whenLabel ?? undefined} color={T.badSoft} />
      <Headline
        numberValue={(f.projected ?? 0).toFixed(1)}
        numberColor={T.textHi}
        prose={
          <>
            On track for a{' '}
            <strong style={{ color: T.badSoft, fontWeight: 700 }}>↑ {(f.delta ?? 0).toFixed(1)} rise</strong> to{' '}
            <strong style={{ color: T.textHi, fontWeight: 700 }}>~{(f.projected ?? 0).toFixed(1)}</strong> over{' '}
            {ctx.possessiveLower} next <strong style={{ color: T.textHi, fontWeight: 700 }}>{f.roundsOut} rounds</strong>
          </>
        }
      />
      <StripBand f={f} />
      {cutTarget != null && (
        <CalmActionLine
          prose={
            <>
              Shoot{' '}
              <strong style={{ color: T.goodSoft, fontWeight: 800 }}>{cutTarget.toFixed(1)} or better</strong>{' '}
              next round to break the slide.
            </>
          }
        />
      )}
    </CardShell>
  );
};


// ── State: Building ─────────────────────────────────────────────────

const BuildingCard: React.FC<{ f: Forecast; ctx: CopyCtx }> = ({ f, ctx }) => {
  const need = 8;
  const have = f.validRoundCount;
  return (
    <CardShell>
      <div style={{ padding: '18px 18px 20px' }}>
        <div
          style={{
            textTransform: 'uppercase',
            fontSize: 10,
            letterSpacing: '0.18em',
            fontWeight: 800,
            color: T.textMid,
            marginBottom: 8,
          }}
        >
          Building {ctx.possessiveLower} trend
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            lineHeight: 1.4,
            color: T.textMid,
          }}
        >
          We need at least <strong style={{ color: T.textHi, fontWeight: 700 }}>8 rounds</strong> in{' '}
          {ctx.possessiveLower} last 20. {ctx.subjectCap} {ctx.hasVerb}{' '}
          <strong style={{ color: T.textHi, fontWeight: 700 }}>{have}</strong> so far — keep playing.
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {Array.from({ length: need }).map((_, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background: i < have ? T.amber : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>
      </div>
    </CardShell>
  );
};

// ── State: Brand new ────────────────────────────────────────────────

const BrandNewCard: React.FC<{ ctx: CopyCtx }> = ({ ctx }) => (
  <CardShell>
    <div style={{ padding: '18px 18px 20px' }}>
      <div
        style={{
          textTransform: 'uppercase',
          fontSize: 10,
          letterSpacing: '0.18em',
          fontWeight: 800,
          color: T.textMid,
          marginBottom: 8,
        }}
      >
        {ctx.viewMode === 'friend'
          ? `${ctx.subjectCap} ${ctx.needsVerb} a round to start ${ctx.possessiveLower} trend`
          : `Play a round to start ${ctx.possessiveLower} trend`}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13.5,
          lineHeight: 1.4,
          color: T.textMid,
        }}
      >
        {ctx.viewMode === 'friend'
          ? <>Once {ctx.subjectLower} {ctx.hasVerb} posted a few rounds, we'll project where {ctx.possessiveLower} handicap is heading and tell {ctx.subjectLower} what to shoot to drop.</>
          : <>Once you've posted a few rounds, we'll project where your handicap is heading and tell you what to shoot to drop.</>}
      </p>
    </div>
  </CardShell>
);

// ── Skeleton ────────────────────────────────────────────────────────

const ForecastSkeleton: React.FC<{ eyebrow?: string }> = ({ eyebrow = 'Your form' }) => (
  <section style={{ marginTop: 0, fontFamily: FONT }}>
    <DarkSectionHeader eyebrow={eyebrow} />
    <div
      style={{
        margin: '0 16px',
        background: T.cardBg,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        height: 200,
      }}
    />
  </section>
);

export default ForecastCard;
