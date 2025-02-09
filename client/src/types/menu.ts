import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  href: string;
  icon: LucideIcon;
  label: string;
  requiredPermission?: string;
  subItems?: MenuItem[];
  isExpanded?: boolean;
  header?: string;  // For section headers like "USER MANAGEMENT"
  disabled?: boolean; // Indicates if the menu item is not yet functioning
}

export interface MenuGroup {
  header: string;
  items: MenuItem[];
}

export interface MenuState {
  expandedItems: Set<string>;
  isSidebarOpen: boolean;
}

export type MenuAction = 
  | { type: 'TOGGLE_ITEM'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'EXPAND_ALL' };
