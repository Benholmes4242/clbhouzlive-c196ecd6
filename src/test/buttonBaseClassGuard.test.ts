// @vitest-environment jsdom
/** FIX_PROFILE_FORM_RAIL_AND_TOP10_GAP: Button base classes (inline-flex,
 * items-center, justify-center, gap-2) beat a single-class stylesheet rule.
 * A Button whose className rule sets display/gap/justify-content/align-items
 * must use a doubled-class selector. KNOWN lists the offenders found when the
 * guard landed (reported, not yet changed); new ones fail. */
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

const KNOWN = new Set([
  'src/components/business/AccessRequestsSection.tsx:team-role-card',
  'src/components/business/BusinessMentionsRail.tsx:business-mention-cancel',
  'src/components/business/BusinessMentionsRail.tsx:business-mention-choice',
  'src/components/business/BusinessMentionsRail.tsx:business-mention-open',
  'src/components/business/TeamInvitesSection.tsx:team-invite-resend',
  'src/components/business/TeamInvitesSection.tsx:team-role-card',
  'src/components/business/TeamListSection.tsx:team-role-card',
  'src/components/business/editor/BusinessEditFrame.tsx:ep-back',
  'src/components/business/editor/BusinessEditPreview.tsx:ep-row',
  'src/components/business/editor/BusinessEditProfileLinks.tsx:ep-opt',
  'src/components/business/editor/BusinessEditProfileLinks.tsx:ep-row',
  'src/components/business/editor/BusinessEditSettings.tsx:ep-row',
  'src/components/business/editor/BusinessEditWhereContact.tsx:ep-row',
  'src/components/business/insights/InsightsCourseSection.tsx:insights-course-link',
  'src/components/course-media-tab/CourseMediaEmptyStates.tsx:media-empty-retag-action',
  'src/components/course-media-tab/CourseMediaTabNew.tsx:media-v2-untagged',
  'src/components/course-media-tab/HoleWalk.tsx:media-v2-add-card',
  'src/components/course-media-tab/ShotTagCard.tsx:media-v3-tag-remove',
  'src/components/course-media-tab/ShotTagChoices.tsx:media-v3-tag-place',
  'src/components/settings/SettingsNotificationsCard.tsx:ep-row',
  'src/components/settings/SettingsPrivacyCard.tsx:ep-opt',
  'src/components/settings/SettingsPrivacyCard.tsx:ep-row',
  'src/components/settings/SettingsTabContent.tsx:ep-row',
  'src/components/settings/SettingsYourData.tsx:ep-row',
  'src/features/business-create/BusinessCreateFinish.tsx:bizc-next-row',
  'src/features/business-create/BusinessCreateStep4.tsx:bizc-mini-cover',
  'src/features/business-create/BusinessCreateStep4.tsx:bizc-photo-action',
  'src/features/business-create/BusinessCreateStep4.tsx:bizc-textbtn',
  'src/features/coach/BusinessCoachCards.tsx:coach-person-row',
  'src/features/coach/BusinessCoachCards.tsx:coach-profile-line',
  'src/features/coach/CoachSheets.tsx:coach-person-row',
  'src/features/courses/_shared/scorecard/SheetDoorButton.tsx:sheet-door-button',
  'src/features/edit-profile/EditProfileCard.tsx:bizc-photo-action',
  'src/features/edit-profile/EditProfileCard.tsx:bizc-textbtn',
  'src/features/edit-profile/EditProfileGolf.tsx:ep-golf-action',
  'src/features/edit-profile/EditProfileGolf.tsx:ep-row',
  'src/features/edit-profile/EditProfileLinksPrivacy.tsx:ep-opt',
  'src/features/edit-profile/EditProfileLinksPrivacy.tsx:ep-row',
  'src/features/home-club/KeyboardClubSearchSheet.tsx:rcs-row',
  'src/features/onboarding/WelcomeHandicap.tsx:welcome-provider',
  'src/features/post-v2/components/golf/GolfPostSections.tsx:pf4-hole-audience',
  'src/features/pro-profile/ProAskSection.tsx:pro-ask-more',
  'src/features/pro-profile/ProAskSheets.tsx:pro-ask-later',
  'src/features/pro-profile/ProAskSheets.tsx:pro-ask-more',
  'src/features/pro-profile/ProAskSheets.tsx:pro-ask-who-name',
  'src/features/pro-profile/ProCollectionSections.tsx:pro-bag-row',
  'src/features/pro-profile/ProCollectionSections.tsx:pro-partner-tile',
  'src/features/pro-profile/ProCollectionSheets.tsx:pro-bag-row',
  'src/features/pro-profile/ProCollectionSheets.tsx:pro-business-match',
  'src/features/pro-profile/ProCollectionSheets.tsx:pro-collection-list-row',
  'src/features/pro-profile/ProSeasonSection.tsx:pro-profile-row',
  'src/features/profile-sheet-v2/components/YourCourseOpenContent.tsx:yc2-link',
  'src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx:pick-panel-chip',
  'src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:recap-name',
  'src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx:upcoming-player-row',
  'src/features/tourhub/tournament-v2/sections/CompletedWeekBlock.tsx:cw-lr',
  'src/features/tourhub/tournament-v2/sections/MiniBoard.tsx:tv-board-row',
  'src/pages/BusinessCreate.tsx:bizc-back',
  'src/pages/BusinessProfileEditor.tsx:ep-saved',
  'src/pages/BusinessTeamPage.tsx:team-header-invite',
]);
const LAYOUT = /(^|;|\s)(display|gap|justify-content|align-items)\s*:/;

function cssRules() {
  const map = new Map<string, Set<'single' | 'double'>>();
  for (const file of globSync('src/**/*.css')) {
    const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!LAYOUT.test(m[2])) continue;
      for (const raw of m[1].split(',')) {
        const sel = raw.trim();
        const single = /^\.([\w-]+)$/.exec(sel);
        const double = /^\.([\w-]+)\.\1$/.exec(sel);
        const key = single?.[1] ?? double?.[1];
        if (!key) continue;
        if (!map.has(key)) map.set(key, new Set());
        map.get(key)!.add(single ? 'single' : 'double');
      }
    }
  }
  return map;
}

describe('Button base-class leak guard', () => {
  it('the form tile rule is doubled and declares display:block', () => {
    const css = readFileSync('src/components/profile/hero/profile-form.css', 'utf8');
    const rule = /\.profile-form-round\.profile-form-round\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(/display:\s*block/);
    expect(rule).toMatch(/gap:\s*0/);
    expect(css).not.toMatch(/(^|\n)\.profile-form-round\s*\{/);
  });
  it('no new Button uses a single-class layout rule', () => {
    const rules = cssRules();
    const found: string[] = [];
    for (const file of globSync('src/**/*.tsx', { ignore: ['src/test/**', 'src/**/*.test.tsx'] })) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/<Button\b[^>]*?className="([^"]+)"/g)) {
        for (const cls of m[1].split(/\s+/)) {
          const kinds = rules.get(cls);
          if (kinds?.has('single') && !kinds.has('double')) found.push(`${file}:${cls}`);
        }
      }
    }
    expect(found.filter((entry) => !KNOWN.has(entry))).toEqual([]);
    expect(found).not.toContain('src/components/profile/hero/HeroHandicapDisplay.tsx:profile-form-round');
  });
});
