import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

export type LayoutTheme = 'light' | 'dark';

/**
 * The alternate palettes shipped under assets/css/. `default` is the theme compiled into
 * styles.scss and needs no stylesheet of its own.
 */
export const LAYOUT_SKINS = [
  'default',
  'nebula',
  'olive',
  'solar',
  'lunar',
  'night',
  'aurora',
  'earth',
  'flare',
  'storm',
] as const;

export type LayoutSkin = (typeof LAYOUT_SKINS)[number];

export interface LayoutState {
  readonly theme: LayoutTheme;
  readonly skin: LayoutSkin;
  readonly navMinified: boolean;
  readonly darkNavigation: boolean;
}

const STORAGE_KEY = 'smart-management-layout';

const INITIAL_STATE: LayoutState = {
  theme: 'light',
  skin: 'default',
  navMinified: false,
  darkNavigation: true,
};

/** The `<link>` index.html parks in <body> for the skin stylesheet to be swapped into. */
const THEME_LINK_ID = 'app-theme';

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

      this.applySkin(state.skin);
      writeStoredState(state);
    });

    effect(() => {
      this.document.documentElement.classList.toggle(MOBILE_MENU_CLASS, this._mobileMenuOpen());
    });
  }

  toggleTheme(): void {
    this._state.update((state) => ({
      ...state,
      theme: state.theme === 'light' ? 'dark' : 'light',
    }));
  }

  setSkin(skin: LayoutSkin): void {
    this._state.update((state) => ({ ...state, skin }));
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

  /**
   * Upstream blanks the href on the default skin, which leaves the link pointing at the document
   * itself and the browser fetching the page as a stylesheet. Dropping the attribute instead is
   * the same result on screen without the wasted request.
   */
  private applySkin(skin: LayoutSkin): void {
    const link = this.document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      return;
    }

    if (skin === 'default') {
      link.removeAttribute('href');
      return;
    }

    const href = `/assets/css/${skin}.css`;
    if (link.getAttribute('href') !== href) {
      link.setAttribute('href', href);
    }
  }
}

function readStoredState(): LayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_STATE;
    }

    const stored = { ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<LayoutState>) };

    // The skin ends up in a stylesheet URL, and storage is editable by hand, so it is checked
    // against the list rather than trusted.
    return LAYOUT_SKINS.includes(stored.skin) ? stored : { ...stored, skin: 'default' };
  } catch {
    return INITIAL_STATE;
  }
}

function writeStoredState(state: LayoutState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
