import { motion } from 'framer-motion';
import { Music, Type, Sparkles, Sliders } from 'lucide-react';
import { StudioTool } from '@/types/studio';
import { cn } from '@/lib/utils';

type ToolButtonProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

const ToolButton = ({ icon, label, active, onClick }: ToolButtonProps) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.97 }}
    className={cn(
      "flex flex-col items-center justify-center gap-1 py-2.5 px-4 rounded-xl transition-all duration-150",
      active 
        ? "bg-foreground text-background" 
        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/40"
    )}
  >
    <div className="transition-colors">
      {icon}
    </div>
    <span className="text-xs font-medium transition-colors">
      {label}
    </span>
  </motion.button>
);

type StudioToolRailProps = {
  activeTool: StudioTool;
  setActiveTool: (tool: StudioTool) => void;
};

export default function StudioToolRail({ activeTool, setActiveTool }: StudioToolRailProps) {
  return (
    <div 
      className="grid grid-cols-4 gap-2.5 px-4 py-2.5"
      style={{ 
        background: 'var(--cm-surface-card)',
        borderBottom: '1px solid var(--cm-border-subtle)',
      }}
    >
      <ToolButton
        icon={<Music className="w-5 h-5" />}
        label="Music"
        active={activeTool === 'music'}
        onClick={() => setActiveTool('music')}
      />
      <ToolButton
        icon={<Type className="w-5 h-5" />}
        label="Text"
        active={activeTool === 'text'}
        onClick={() => setActiveTool('text')}
      />
      <ToolButton
        icon={<Sparkles className="w-5 h-5" />}
        label="Filter"
        active={activeTool === 'filter'}
        onClick={() => setActiveTool('filter')}
      />
      <ToolButton
        icon={<Sliders className="w-5 h-5" />}
        label="Edit"
        active={activeTool === 'edit'}
        onClick={() => setActiveTool('edit')}
      />
    </div>
  );
}
