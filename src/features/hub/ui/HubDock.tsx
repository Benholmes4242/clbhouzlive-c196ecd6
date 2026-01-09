import React from 'react';
import { Camera, Search, User, MessageCircle, Plus } from 'lucide-react';

export type HubDockItemKey = 'create_game' | 'search' | 'create_moment' | 'echo' | 'profile';

export interface HubDockItems {
  left1: { key: 'create_game'; label: string };
  left2: { key: 'search'; label: string };
  center: { key: 'create_moment'; label: string };
  right1: { key: 'echo'; label: string };
  right2: { key: 'profile'; label: string };
}

export interface HubDockProps {
  items: HubDockItems;
  onPress: (key: HubDockItemKey) => void;
}

/**
 * HubDock
 * - Anchored to bottom (handled by page).
 * - Shape stays same; center action is glassy orange.
 * - Items: Your Games, Search, (Orange +), Echo, Profile.
 */
export function HubDock({ items, onPress }: HubDockProps) {
  return (
    <div className="dockOuter">
      <div className="dockInner">
        <DockItem
          label={items.left1.label}
          icon={<Plus className="h-5 w-5" />}
          onClick={() => onPress(items.left1.key)}
        />
        <DockItem
          label={items.left2.label}
          icon={<Search className="h-5 w-5" />}
          onClick={() => onPress(items.left2.key)}
        />

        <button
          type="button"
          className="dockCenterBtn"
          onClick={() => onPress(items.center.key)}
          aria-label={items.center.label}
        >
          <Camera className="h-7 w-7 text-white/90" />
        </button>

        <DockItem
          label={items.right1.label}
          icon={<MessageCircle className="h-5 w-5" />}
          onClick={() => onPress(items.right1.key)}
        />
        <DockItem
          label={items.right2.label}
          icon={<User className="h-5 w-5" />}
          onClick={() => onPress(items.right2.key)}
        />
      </div>
    </div>
  );
}

function DockItem({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="dockItem" onClick={onClick}>
      <div className="dockItemIcon">{icon}</div>
      <div className="dockItemLabel">{label}</div>
    </button>
  );
}
