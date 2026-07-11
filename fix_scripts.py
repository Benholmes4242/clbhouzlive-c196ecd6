import os
import re

def replace_in_file(path, pattern, replacement):
    with open(path, 'r') as f:
        content = f.read()
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    with open(path, 'w') as f:
        f.write(new_content)

# 1. UserListPage.tsx
path = 'src/components/social/UserListPage.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Add import
lines.insert(30, "import { useBlockActions } from '@/hooks/useBlockActions';\n")

# Add hook in UserRowFlat
for i, line in enumerate(lines):
    if 'const UserRowFlat' in line:
        # Find where to insert hook - after the last use... hook
        j = i + 1
        while 'use' in lines[j] or 'useState' in lines[j] or 'useMemo' in lines[j]:
            j += 1
        lines.insert(j, "  const { blockUser } = useBlockActions({ currentUserId: currentUserId || '' });\n")
        break

content = "".join(lines)
# Remove Mute Action
content = re.sub(r'<KebabAction\s+icon={<BellOff className="w-4 h-4" />}\s+label="Mute notifications".*?/>', '', content, flags=re.DOTALL)
# Update Block Action
block_replacement = """<KebabAction
              icon={<Ban className="w-4 h-4" />}
              label="Block"
              destructive
              onClick={async () => {
                setShowKebabSheet(false);
                try {
                  const success = await blockUser(user.id);
                  if (success) {
                    toast.success(`Blocked ${user.displayName}`);
                  } else {
                    toast.error("Could not block. Try again.");
                  }
                } catch (err) {
                  toast.error("Could not block. Try again.");
                }
              }}
            />"""
content = re.sub(r'<KebabAction\s+icon={<Ban className="w-4 h-4" />}\s+label="Block".*?onClick={() => {.*?toast\.success\(\'Block coming soon\'\);\s+}}', block_replacement, content, flags=re.DOTALL)
with open(path, 'w') as f:
    f.write(content)

# 2. ComingSoonScreen.tsx
coming_soon_screen = """import React from 'react';
import { MiniFlag } from './MiniFlag';
import type { WhsCountry } from '@/lib/whs/whsCountries';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const FIELD_FILL = '#F8FAFC';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  country: WhsCountry;
  /** @deprecated kept for backwards compat, no longer invoked */
  onNotifyMe?: (country: WhsCountry) => void;
  onChangeCountry: () => void;
}

export const ComingSoonScreen: React.FC<Props> = ({ country, onChangeCountry }) => {
  const shell: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${HAIR}`,
    borderRadius: 16,
    padding: '32px 22px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    fontFamily: FONT,
  };

  const secondaryBtn = (
    <button
      type="button"
      onClick={onChangeCountry}
      style={{
        fontSize: 13,
        color: INK_45,
        fontWeight: 600,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 12px',
        fontFamily: FONT,
      }}
    >
      Choose a different country
    </button>
  );

  return (
    <div style={shell}>
      <div style={{ marginBottom: 18, transform: 'scale(1.4)' }}>
        <MiniFlag iso={country.iso} />
      </div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          margin: '0 0 10px',
          maxWidth: 290,
        }}
      >
        {country.name} isn't supported yet
      </h2>

      <p
        style={{
          fontSize: 14,
          color: INK_45,
          lineHeight: 1.5,
          margin: '0 0 18px',
          maxWidth: 320,
        }}
      >
        England Golf is supported today. More federations are on the way. We'll add <strong style={{ color: INK, fontWeight: 700 }}>{country.body}</strong> as coverage expands.
      </p>

      <div style={{ marginTop: 6, background: FIELD_FILL, borderRadius: 8, padding: 0 }} />

      {secondaryBtn}
    </div>
  );
};

export default ComingSoonScreen;
"""
with open('src/components/profile/handicap/whs/connect/ComingSoonScreen.tsx', 'w') as f:
    f.write(coming_soon_screen)

# 3. CountryPickerSheet.tsx
replace_in_file('src/components/profile/handicap/whs/connect/CountryPickerSheet.tsx', r'Coming soon', 'Not yet supported')

# 4. InboxV2Page.tsx
replace_in_file('src/pages/messaging-v2/InboxV2Page.tsx', r'Early access: business messaging', 'Business messaging')
replace_in_file('src/pages/messaging-v2/InboxV2Page.tsx', r'Message golfers directly - free while we\'re in early access\. Limits and credits come later\.', 'Message golfers directly.')

# 5. NewConversationSheet.tsx
with open('src/pages/messaging-v2/NewConversationSheet.tsx', 'r') as f:
    content = f.read()
content = re.sub(r'<div\s+style={{\s+display: \'flex\',\s+alignItems: \'center\',\s+gap: 8,\s+padding: \'10px 12px\',\s+background: \'rgba\(247,147,30,0\.08\)\',\s+borderRadius: 11,\s+}}\s+>\s+<Sparkles size={16} color={AMBER} />\s+<span style={{\s+color: \'#B45309\', fontSize: 12\.5, lineHeight: 1\.4\s+}}>\s+Free during early access - business message limits are coming soon\.\s+</span>\s+</div>', '', content, flags=re.DOTALL)
with open('src/pages/messaging-v2/NewConversationSheet.tsx', 'w') as f:
    f.write(content)

# 6. Settings files
for path in ['src/components/settings/ui/SettingsToggleRow.tsx', 'src/components/settings/ui/SettingsRow.tsx', 'src/components/settings/ui/SettingsChevronRow.tsx']:
    replace_in_file(path, r'{isBeta && <SettingsBadge>Beta</SettingsBadge>}', '')
    # Check if SettingsBadge is still used
    with open(path, 'r') as f:
        content = f.read()
    if '<SettingsBadge' not in content:
        content = re.sub(r'import { SettingsBadge } from \'./SettingsRow\';\n?', '', content)
    with open(path, 'w') as f:
        f.write(content)

# 7. BusinessProfileEditor.tsx
replace_in_file('src/pages/BusinessProfileEditor.tsx', r'import BookingComingSoonSection from \'@/components/business/editor/BookingComingSoonSection\';\n?', '')
replace_in_file('src/pages/BusinessProfileEditor.tsx', r'{\s*/\* 6\. BOOKING — coming soon \*/\s*}\s*<BookingComingSoonSection />', '')

# 8. RivalryPage.tsx & ActionRail.tsx
replace_in_file('src/pages/RivalryPage.tsx', r'onMessage={handleMessage}\s*', '')
# ActionRail.tsx
with open('src/pages/rivalry-page/ActionRail.tsx', 'r') as f:
    lines = f.readlines()
new_lines = []
for line in lines:
    if 'onMessage: () => void;' in line: continue
    if 'onMessage,' in line: continue
    if '<ActionButton Icon={MessageCircle} label="Message" onClick={onMessage} />' in line: continue
    if "gridTemplateColumns: '1fr 1fr 1fr'," in line:
        new_lines.append("      gridTemplateColumns: '1fr 1fr',\n")
        continue
    new_lines.append(line)
with open('src/pages/rivalry-page/ActionRail.tsx', 'w') as f:
    f.write("".join(new_lines))

# 9. Tour Hub items
replace_in_file('src/features/tourhub/components/overview-v2/DataUnlockingPremium.tsx', r'Coming soon', 'Not available')

# DataUnlocking.tsx
with open('src/features/tourhub/components/overview-feed/DataUnlocking.tsx', 'w') as f:
    f.write("export function DataUnlocking({ items }: { items: any[] }) { return null; }\n")

replace_in_file('src/features/tourhub/components/cinematic/CinematicHero.tsx', r'Leaderboard coming soon', 'Leaderboard not available')

# LiveNowModule.tsx
replace_in_file('src/features/tourhub/components/golf-universe/components/LiveNowModule.tsx', r'Live scoring coming soon', 'No live coverage right now')
replace_in_file('src/features/tourhub/components/golf-universe/components/LiveNowModule.tsx', r'leaderboards prop is optional\. When not available:\s+\* - Shows "Live scoring coming soon" instead of empty "updating\.\.\."', 'leaderboards prop is optional. When not available: * - Shows "No live coverage right now" instead of empty "updating..."')

replace_in_file('src/features/tourhub/components/overview-v3/HybridHeroBands/LeaderboardBand.tsx', r'Tournament preview coming soon\.', 'Tournament preview not available.')
replace_in_file('src/components/championship/modules/rivals/RivalVersusPanel.tsx', r'Rivalry history coming soon', 'No rivalry history yet')

# 10. LearnEmptyState.tsx
replace_in_file('src/components/learn/LearnEmptyState.tsx', r"We're building learning paths tailored to your game\. More coming soon\.", "Learning paths tailored to your game will appear here.")

# 11. EmojiPicker.tsx
with open('src/components/posts/EmojiPicker.tsx', 'r') as f:
    content = f.read()
content = re.sub(r'<div className="mt-3 pt-3 border-t border-gray-100">\s+<p className="text-xs text-gray-500 text-center">\s+More emojis coming soon!\s+</p>\s+</div>', '', content, flags=re.DOTALL)
with open('src/components/posts/EmojiPicker.tsx', 'w') as f:
    f.write(content)

# 12. Leaderboard cleanup
replace_in_file('src/components/leaderboard/LeaderboardEmptyState.tsx', r'rising-coming-soon', 'rising-empty')
replace_in_file('src/components/leaderboard/PlayersLeaderboardViewV2.tsx', r'rising-coming-soon', 'rising-empty')

