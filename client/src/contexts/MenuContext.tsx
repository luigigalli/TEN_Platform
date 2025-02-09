import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { MenuState, MenuAction } from '../types/menu';

const initialState: MenuState = {
  expandedItems: new Set<string>(),
  isSidebarOpen: true,
};

function menuReducer(state: MenuState, action: MenuAction): MenuState {
  switch (action.type) {
    case 'TOGGLE_ITEM':
      const newExpandedItems = new Set(state.expandedItems);
      if (newExpandedItems.has(action.payload)) {
        newExpandedItems.delete(action.payload);
      } else {
        newExpandedItems.add(action.payload);
      }
      return { ...state, expandedItems: newExpandedItems };

    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };

    case 'COLLAPSE_ALL':
      return { ...state, expandedItems: new Set() };

    case 'EXPAND_ALL':
      // This will be populated with all menu items that have subItems
      return { ...state, expandedItems: new Set() }; // We'll update this when we have the full menu structure

    default:
      return state;
  }
}

interface MenuContextType {
  state: MenuState;
  dispatch: React.Dispatch<MenuAction>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(menuReducer, initialState);

  return (
    <MenuContext.Provider value={{ state, dispatch }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
