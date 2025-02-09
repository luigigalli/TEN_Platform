import React from 'react';
import { MenuItem } from '@/types/menu';
import { useMenu } from '@/contexts/MenuContext';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MenuGroupProps {
  item: MenuItem;
  depth?: number;
}

export function MenuGroup({ item, depth = 0 }: MenuGroupProps) {
  const { state, dispatch } = useMenu();
  const [location] = useLocation();
  const isExpanded = state.expandedItems.has(item.href);
  const isActive = location.startsWith(item.href);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!item.disabled) {
      dispatch({ type: 'TOGGLE_ITEM', payload: item.href });
    }
  };

  const MenuItem = () => (
    <div
      className={cn(
        'flex items-center p-2 rounded-lg cursor-pointer',
        'hover:bg-accent transition-colors duration-200',
        isActive && 'bg-accent',
        item.disabled && 'opacity-50 cursor-not-allowed',
        depth > 0 && 'ml-4'
      )}
    >
      <item.icon className="w-5 h-5 mr-2" />
      {state.isSidebarOpen && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.subItems && (
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isExpanded && 'transform rotate-180'
              )}
            />
          )}
        </>
      )}
    </div>
  );

  const renderMenuItem = () => {
    if (item.disabled) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div onClick={toggleExpanded}>{MenuItem()}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming soon</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // If it has subItems, wrap in a div for toggle behavior
    if (item.subItems) {
      return <div onClick={toggleExpanded}>{MenuItem()}</div>;
    }

    // If it's a leaf node (no subItems), wrap in Link for navigation
    return <Link href={item.href}>{MenuItem()}</Link>;
  };

  const hasPermission = !item.requiredPermission || true; // TODO: Check actual permissions

  if (!hasPermission) return null;

  return (
    <li>
      {renderMenuItem()}
      
      {item.subItems && isExpanded && state.isSidebarOpen && (
        <ul className="mt-1 space-y-1">
          {item.subItems.map((subItem) => (
            <MenuGroup
              key={subItem.href}
              item={subItem}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
