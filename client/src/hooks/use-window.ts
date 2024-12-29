import { useEffect, useState } from 'react';
import { z } from 'zod';

// Validation schemas
const windowDimensionsSchema = z.object({
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
});

const windowScrollSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
});

type WindowDimensions = z.infer<typeof windowDimensionsSchema>;
type WindowScroll = z.infer<typeof windowScrollSchema>;

class WindowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WindowError';
    Object.freeze(this);
  }

  static noWindow(): WindowError {
    return new WindowError('Window is not available');
  }

  static invalidDimensions(dimensions: unknown): WindowError {
    return new WindowError(`Invalid window dimensions: ${JSON.stringify(dimensions)}`);
  }

  static invalidScroll(scroll: unknown): WindowError {
    return new WindowError(`Invalid window scroll: ${JSON.stringify(scroll)}`);
  }
}

/**
 * Validates window dimensions
 * @param dimensions - Dimensions to validate
 * @throws {WindowError} If dimensions are invalid
 */
function validateDimensions(dimensions: unknown): WindowDimensions {
  try {
    return windowDimensionsSchema.parse(dimensions);
  } catch (error) {
    throw WindowError.invalidDimensions(dimensions);
  }
}

/**
 * Validates window scroll position
 * @param scroll - Scroll position to validate
 * @throws {WindowError} If scroll position is invalid
 */
function validateScroll(scroll: unknown): WindowScroll {
  try {
    return windowScrollSchema.parse(scroll);
  } catch (error) {
    throw WindowError.invalidScroll(scroll);
  }
}

/**
 * Gets the current window dimensions
 * @returns Current window dimensions
 * @throws {WindowError} If window is not available or dimensions are invalid
 */
function getWindowDimensions(): WindowDimensions {
  if (typeof window === 'undefined') {
    throw WindowError.noWindow();
  }

  return validateDimensions({
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

/**
 * Gets the current window scroll position
 * @returns Current window scroll position
 * @throws {WindowError} If window is not available or scroll position is invalid
 */
function getWindowScroll(): WindowScroll {
  if (typeof window === 'undefined') {
    throw WindowError.noWindow();
  }

  return validateScroll({
    x: window.scrollX,
    y: window.scrollY,
  });
}

interface UseWindowResult {
  readonly dimensions: WindowDimensions;
  readonly scroll: WindowScroll;
  readonly isClient: boolean;
}

/**
 * Hook for accessing window dimensions and scroll position
 * @returns Object containing window dimensions and scroll position
 */
export function useWindow(): UseWindowResult {
  const [dimensions, setDimensions] = useState<WindowDimensions>(() => {
    try {
      return getWindowDimensions();
    } catch (error) {
      console.error('Failed to get window dimensions:', error);
      return { width: 0, height: 0 };
    }
  });

  const [scroll, setScroll] = useState<WindowScroll>(() => {
    try {
      return getWindowScroll();
    } catch (error) {
      console.error('Failed to get window scroll:', error);
      return { x: 0, y: 0 };
    }
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const handleResize = () => {
      try {
        setDimensions(getWindowDimensions());
      } catch (error) {
        console.error('Failed to update window dimensions:', error);
      }
    };

    const handleScroll = () => {
      try {
        setScroll(getWindowScroll());
      } catch (error) {
        console.error('Failed to update window scroll:', error);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return Object.freeze({
    dimensions,
    scroll,
    isClient,
  });
}

export type { WindowDimensions, WindowScroll };
