import { motion } from 'framer-motion';
import { Music, Type, Sparkles, Crop } from 'lucide-react';
import { StudioTool } from '@/types/studio';

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
    className="flex flex-col items-center justify-center gap-1 py-2.5 px-4 rounded-xl transition-all duration-150"
    style={active ? {
      background: 'rgba(255,255,255,0.92)',
      color: '#0D0D0D',
      boxShadow: '0 2px 10px rgba(255,255,255,0.15)',
    } : {
      background: 'transparent',
      color: 'rgba(255,255,255,0.45)',
    }}
  >
    <div className="transition-colors">
      {icon}
    </div>
    <span className="text-xs font-semibold transition-colors">
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
      className="grid grid-cols-4 gap-2.5 px-4 py-2.5 flex-shrink-0"
      style={{
        background: 'rgba(10,10,10,0.98)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
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
        icon={<Crop className="w-5 h-5" />}
        label="Crop"
        active={activeTool === 'edit'}
        onClick={() => setActiveTool('edit')}
      />
    </div>
  );
}
