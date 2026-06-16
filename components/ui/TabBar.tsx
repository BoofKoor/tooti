'use client';

import type { ComponentType } from 'react';
import { Cards, House, User } from '@phosphor-icons/react/dist/ssr';
import type { IconProps } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon: ComponentType<IconProps>;
}

// Three destinations: the Learn path (the whole learn→practice→test journey),
// the Vocabulary section, and the Profile. `id` doubles as the route segment.
export const defaultTabs: TabItem[] = [
  { id: 'learn', label: 'Learn', icon: House },
  { id: 'vocab', label: 'Vocab', icon: Cards },
  { id: 'profile', label: 'Profile', icon: User },
];

export interface TabBarProps {
  tabs?: TabItem[];
  activeId: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function TabBar({ tabs = defaultTabs, activeId, onTabChange, className }: TabBarProps) {
  const n = tabs.length;
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeId),
  );

  // SVG-artwork exemption: bar path geometry (notch bump centered on the active
  // tab) is generated from the active center-x; coordinates are asset values.
  const cx = ((activeIndex + 0.5) / n) * 360;
  const d = `M 32 0 L ${cx - 20} 0 C ${cx - 14} 0 ${cx - 10} 12 ${cx} 12 C ${cx + 10} 12 ${cx + 14} 0 ${cx + 20} 0 L 328 0 Q 360 0 360 32 L 360 40 Q 360 72 328 72 L 32 72 Q 0 72 0 40 L 0 32 Q 0 0 32 0 Z`;
  const dotPos = `${((activeIndex + 0.5) / n) * 100}%`;

  return (
    <div className={cn('tabbar', className)}>
      <svg
        className="tabbar-bar"
        viewBox="0 0 360 72"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={d} />
      </svg>
      <span className="tabbar-dot" style={{ insetInlineStart: dotPos }} aria-hidden="true" />
      <div className="tabbar-row" role="tablist">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className="tabbar-tab"
              data-active={active || undefined}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="tabbar-icon">
                <Icon size="1em" weight={active ? 'fill' : 'regular'} />
              </span>
              <span className="tabbar-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
