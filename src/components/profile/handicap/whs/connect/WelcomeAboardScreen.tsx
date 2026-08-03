import React from 'react';
import { INK, MUTE, BORDER, GOOD, LABEL, H1, H1_SUB } from './designTokens';
import { Panel, PanelGap, Figure, PrimaryButton, FooterBar, CopyBlock } from './Primitives';
import { useImportedCounts } from './useImportedCounts';

interface Props {
  firstName: string;
  handicapIndex: number | null;
  homeClub: string | null;
  /** Legacy server figures - retained for API compatibility, not displayed. */
  scoresImported?: number;
  friendsImported?: number;
  connectionId?: string | null;
  onContinue: () => void;
}

const formatIndex = (h: number | null): string => {
  if (h === null || h === undefined) return '--';
  return h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1);
};

const NEXT_ROWS = [
  { title: 'Scoring breakdown', sub: 'Where the shots go, by par type and by third' },
  { title: 'Index history', sub: 'Every move since your first counting round' },
];

/** SCREEN 5 - DONE. All three figures derived client-side. Never a zero. */
export const WelcomeAboardScreen: React.FC<Props> = ({
  handicapIndex,
  homeClub,
  connectionId,
  onContinue,
}) => {
  const { data: counts } = useImportedCounts(connectionId);

  return (
    <>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px' }}>
        <CopyBlock kicker={`England Golf \u00B7 live`} kickerColor={GOOD}>
          <h1 style={{ ...H1, fontSize: 23 }}>That's it. You're on.</h1>
          <p style={H1_SUB}>Nothing else to do - your index moves on its own from here.</p>
        </CopyBlock>

        <Panel kicker="Your index" aside={homeClub ?? undefined}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 11, marginBottom: 18 }}>
            <div
              style={{
                fontSize: 46,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: INK,
                fontVariantNumeric: 'tabular-nums lining',
              }}
            >
              {formatIndex(handicapIndex)}
            </div>
            <div style={{ ...LABEL, color: MUTE }}>as of today</div>
          </div>

          <div style={{ paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
            {counts ? (
              <div style={{ display: 'flex' }}>
                <Figure label="Rounds in" value={counts.rounds} />
                <Figure label="Courses" value={counts.courses} />
                <Figure label="Friends" value={counts.friends} />
              </div>
            ) : (
              <div style={{ fontSize: 12.5, lineHeight: 1.52, color: MUTE }}>
                Your rounds are still importing. They will be here shortly - nothing more for you
                to do.
              </div>
            )}
          </div>
        </Panel>
        <PanelGap />

        <Panel kicker="Open to you now">
          {[
            NEXT_ROWS[0],
            {
              title: 'Course records',
              sub: counts
                ? `Your best at all ${counts.courses}, and who holds what`
                : 'Your best at every course, and who holds what',
            },
            NEXT_ROWS[1],
          ].map((r, i) => (
            <div
              key={r.title}
              style={{
                padding: i === 0 ? '0 0 12px' : '12px 0',
                borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{r.title}</div>
              <div style={{ fontSize: 11.5, color: MUTE, marginTop: 3 }}>{r.sub}</div>
            </div>
          ))}
        </Panel>
      </div>

      <FooterBar>
        <PrimaryButton onClick={onContinue}>See my handicap</PrimaryButton>
      </FooterBar>
    </>
  );
};

export default WelcomeAboardScreen;
