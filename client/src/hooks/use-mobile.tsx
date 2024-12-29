import * as React from "react";
import { z } from "zod";

// Constants
const MOBILE_BREAKPOINT = 768;

// Validation schemas
const breakpointSchema = z.number().int().positive();
const windowSchema = z.object({
  innerWidth: z.number().int().nonnegative(),
  matchMedia: z.function().args(z.string()),
});

// Type definitions
type MediaQueryList = {
  matches: boolean;
  addEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => void;
  removeEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => void;
  addListener?: (listener: (e: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (e: MediaQueryListEvent) => void) => void;
};

interface MediaQueryListEvent {
  matches: boolean;
}

class MobileViewportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MobileViewportError';
  }
}

/**
 * Validates the mobile breakpoint value
 * @param breakpoint - The breakpoint value to validate
 * @throws {MobileViewportError} If the breakpoint is invalid
 */
function validateBreakpoint(breakpoint: number): void {
  try {
    breakpointSchema.parse(breakpoint);
  } catch (error) {
    throw new MobileViewportError(`Invalid mobile breakpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hook to detect if the current viewport is mobile-sized
 * @returns boolean indicating if the viewport is mobile-sized
 * @throws {MobileViewportError} If window object is invalid or media query fails
 */
export function useIsMobile(): boolean {
  // Validate breakpoint at initialization
  validateBreakpoint(MOBILE_BREAKPOINT);

  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    try {
      windowSchema.parse(window);
      return window.innerWidth < MOBILE_BREAKPOINT;
    } catch (error) {
      console.error('Window validation failed:', error);
      return false;
    }
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Validate window object
      windowSchema.parse(window);

      const mediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
      const mql = window.matchMedia(mediaQuery) as MediaQueryList;

      if (!mql || typeof mql.matches !== 'boolean') {
        throw new MobileViewportError('Invalid MediaQueryList object');
      }

      const onChange = (e: MediaQueryListEvent): void => {
        if (typeof e.matches !== 'boolean') {
          throw new MobileViewportError('Invalid MediaQueryListEvent');
        }
        setIsMobile(e.matches);
      };

      // Initial check
      setIsMobile(mql.matches);

      // Modern event listener with type checking
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
      } 
      // Fallback for older browsers with type checking
      else if (typeof mql.addListener === 'function') {
        mql.addListener(onChange);
        return () => {
          if (typeof mql.removeListener === 'function') {
            mql.removeListener(onChange);
          }
        };
      }
      // No valid event listener method available
      else {
        throw new MobileViewportError('No valid event listener method available');
      }
    } catch (error) {
      console.error('Mobile viewport detection error:', error);
      // Default to non-mobile on error
      setIsMobile(false);
      return;
    }
  }, []);

  return isMobile;
}
