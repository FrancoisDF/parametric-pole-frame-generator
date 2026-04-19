const THEME_KEY = 'theme';

type Theme = 'dark' | 'light';

function createTheme() {
  let current = $state<Theme>('dark');

  // Apply class to <html> and persist whenever theme changes
  $effect.root(() => {
    $effect(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('light', current === 'light');
        try {
          localStorage.setItem(THEME_KEY, current);
        } catch {}
      }
    });
  });

  // Read initial value from localStorage
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      current = stored;
    }
  }

  return {
    get current() {
      return current;
    },
    toggle() {
      current = current === 'dark' ? 'light' : 'dark';
    }
  };
}

export const theme = createTheme();
