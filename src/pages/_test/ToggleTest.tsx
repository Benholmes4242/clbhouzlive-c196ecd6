import { SettingsToggleRow } from '@/components/settings/ui/SettingsToggleRow';

export default function ToggleTestPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 pt-12">
      <div className="rounded-2xl overflow-hidden bg-white border border-[rgba(15,23,42,0.07)]">
        <SettingsToggleRow
          title="Auto-post rounds"
          subtitle="When enabled, clbhouz will publish a summary card to your feed after every round you complete with enough hole-by-hole detail. Your followers will see your score, highlights and the course you played. You can still delete any round post afterwards."
          checked={false}
          onCheckedChange={() => {}}
        />
        <SettingsToggleRow
          title="Another setting"
          subtitle="Short subtitle."
          checked
          onCheckedChange={() => {}}
          isLast
        />
      </div>
    </div>
  );
}
