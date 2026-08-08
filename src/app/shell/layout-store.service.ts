import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

export type LayoutTheme = 'light' | 'dark';

export interface LayoutState {
  readonly theme: LayoutTheme;
  readonly navMinified: boolean;
  readonly darkNavigation: boolean;
}

const STORAGE_KEY = 'smart-management-layout';

const INITIAL_STATE: LayoutState = {
  theme: 'light',
  navMinified: false,
  darkNavigation: true,
};

/** SmartAdmin drives layout variants off classes on <html>; these are the ones the shell uses. */
const STATE_CLASSES = {
  navMinified: 'set-nav-minified',
  darkNavigation: 'set-nav-dark',
} as const;

const MOBILE_MENU_CLASS = 'app-mobile-menu-open';

/**
 * Chrome state: theme, sidebar width, mobile drawer. Persisted state and the classes SmartAdmin
 * reads off <html> are kept in step by one effect - writing to storage and to the DOM is exactly
 * the outside-the-graph work effects are for (vault/pages/conventions/signals-state.md).
 */
@Injectable({ providedIn: 'root' })
export class LayoutStoreService {
  private readonly document = inject(DOCUMENT);

  private readonly _state = signal<LayoutState>(readStoredState());
  private readonly _mobileMenuOpen = signal(false);

  readonly state = this._state.asReadonly();
  readonly mobileMenuOpen = this._mobileMenuOpen.asReadonly();

  constructor() {
    effect(() => {
      const state = this._state();
      const root = this.document.documentElement;

      root.setAttribute('data-bs-theme', state.theme);
      root.classList.toggle(STATE_CLASSES.navMinified, state.navMinified);
      root.classList.toggle(STATE_CLASSES.darkNavigation, state.darkNavigation);

      writeStoredState(state);
    });

    effect(() => {
      this.document.documentElement.classList.toggle(MOBILE_MENU_CLASS, this._mobileMenuOpen());
    });
  }

  toggleTheme(): void {
    this._state.update((state) => ({ ...state, theme: state.theme === 'light' ? 'dark' : 'light' }));
  }

  toggleNavMinified(): void {
    this._state.update((state) => ({ ...state, navMinified: !state.navMinified }));
  }

  toggleMobileMenu(): void {
    this._mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this._mobileMenuOpen.set(false);
  }

  reset(): void {
    this._state.set(INITIAL_STATE);
    this._mobileMenuOpen.set(false);
  }
}

function readStoredState(): LayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<LayoutState>) } : INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

function writeStoredState(state: LayoutState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
