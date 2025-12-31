import { Music, Type, Sparkles, Sliders } from 'lucide-react';
import { StudioTool, STUDIO_TOOL_SCOPE } from '@/types/studio';

type ToolButtonProps = {
  icon: React.ReactNode;
  label: string;
  scopeLabel: string;
  active: boolean;
  onClick: () => void;
};

const ToolButton = ({ icon, label, scopeLabel, active, onClick }: ToolButtonProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-gradient-to-b from-[rgba(255,156,64,0.15)] to-[rgba(255,156,64,0.08)] border border-[rgba(255,156,64,0.4)] shadow-[0_2px_8px_rgba(255,156,64,0.15)]' 
        : 'bg-white/60 border border-zinc-200 hover:bg-white/80 hover:border-zinc-300'
    }`}
  >
    <div className={`${active ? 'text-[rgb(255,156,64)]' : 'text-zinc-600'}`}>
      {icon}
    </div>
    <span className={`text-sm font-medium ${active ? 'text-zinc-900' : 'text-zinc-600'}`}>
      {label}
    </span>
    <span className="text-[10px] text-zinc-400 -mt-0.5">
      {scopeLabel}
    </span>
  </button>
);

type StudioToolRailProps = {
  activeTool: StudioTool;
  setActiveTool: (tool: StudioTool) => void;
};

const SCOPE_LABELS: Record<'per-media' | 'per-post', string> = {
  'per-media': 'This photo/video',
  'per-post': 'Entire post',
};

export default function StudioToolRail({ activeTool, setActiveTool }: StudioToolRailProps) {
  return (
    <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-zinc-50/80 border-b border-zinc-200">
      <ToolButton
        icon={<Music className="w-5 h-5" />}
        label="Music"
        scopeLabel={SCOPE_LABELS[STUDIO_TOOL_SCOPE.music]}
        active={activeTool === 'music'}
        onClick={() => setActiveTool('music')}
      />
      <ToolButton
        icon={<Type className="w-5 h-5" />}
        label="Text"
        scopeLabel={SCOPE_LABELS[STUDIO_TOOL_SCOPE.text]}
        active={activeTool === 'text'}
        onClick={() => setActiveTool('text')}
      />
      <ToolButton
        icon={<Sparkles className="w-5 h-5" />}
        label="Filter"
        scopeLabel={SCOPE_LABELS[STUDIO_TOOL_SCOPE.filter]}
        active={activeTool === 'filter'}
        onClick={() => setActiveTool('filter')}
      />
      <ToolButton
        icon={<Sliders className="w-5 h-5" />}
        label="Edit"
        scopeLabel={SCOPE_LABELS[STUDIO_TOOL_SCOPE.edit]}
        active={activeTool === 'edit'}
        onClick={() => setActiveTool('edit')}
      />
    </div>
  );
}
