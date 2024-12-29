import { z } from 'zod';

// Validation schemas
const themeSchema = z.enum(['light', 'dark', 'system']);

type Theme = z.infer<typeof themeSchema>;

const themeStateSchema = z.object({
  theme: themeSchema,
  systemTheme: z.enum(['light', 'dark']).optional(),
});

type ThemeState = z.infer<typeof themeStateSchema>;

class ThemeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThemeError';
    Object.freeze(this);
  }

  static invalidTheme(theme: unknown): ThemeError {
    return new ThemeError(`Invalid theme: ${String(theme)}`);
  }

  static systemPreferenceError(): ThemeError {
    return new ThemeError('Failed to detect system theme preference');
  }
}

/**
 * Validates a theme value
 * @param theme - Theme to validate
 * @throws {ThemeError} If theme is invalid
 */
function validateTheme(theme: unknown): Theme {
  try {
    return themeSchema.parse(theme);
  } catch (error) {
    throw ThemeError.invalidTheme(theme);
  }
}

/**
 * Gets the system theme preference
 * @returns The system theme preference
 * @throws {ThemeError} If system preference cannot be detected
 */
function getSystemTheme(): 'light' | 'dark' {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (error) {
    throw ThemeError.systemPreferenceError();
  }
}

/**
 * Hook for managing theme state
 * @returns Object containing theme state and control functions
 */
export function useTheme(): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme?: 'light' | 'dark';
} {
  // Get initial theme from localStorage or system preference
  const [themeState, setThemeState] = React.useState<ThemeState>(() => {
    try {
      const storedTheme = localStorage.getItem('theme');
      const theme = storedTheme ? validateTheme(storedTheme) : 'system';
      const systemTheme = theme === 'system' ? getSystemTheme() : undefined;

      return themeStateSchema.parse({ theme, systemTheme });
    } catch (error) {
      console.error('Failed to initialize theme:', error);
      return { theme: 'system', systemTheme: 'light' };
    }
  });

  // Update theme in localStorage and document
  React.useEffect(() => {
    try {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      const effectiveTheme = themeState.theme === 'system'
        ? themeState.systemTheme ?? 'light'
        : themeState.theme;

      root.classList.add(effectiveTheme);
      localStorage.setItem('theme', themeState.theme);
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  }, [themeState]);

  // Listen for system theme changes
  React.useEffect(() => {
    if (themeState.theme !== 'system') return;

    try {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      
      const updateSystemTheme = () => {
        setThemeState(prev => ({
          ...prev,
          systemTheme: getSystemTheme(),
        }));
      };

      media.addEventListener('change', updateSystemTheme);
      return () => media.removeEventListener('change', updateSystemTheme);
    } catch (error) {
      console.error('Failed to listen for system theme changes:', error);
    }
  }, [themeState.theme]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    try {
      const validatedTheme = validateTheme(newTheme);
      const systemTheme = validatedTheme === 'system' ? getSystemTheme() : undefined;

      setThemeState(themeStateSchema.parse({
        theme: validatedTheme,
        systemTheme,
      }));
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  }, []);

  return {
    theme: themeState.theme,
    setTheme,
    systemTheme: themeState.systemTheme,
  };
}

export type { Theme };
