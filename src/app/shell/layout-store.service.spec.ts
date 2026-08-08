import { TestBed } from '@angular/core/testing';

import { LayoutStoreService } from './layout-store.service';

const STORAGE_KEY = 'smart-management-layout';

const DEFAULTS = {
  theme: 'light',
  skin: 'default',
  navMinified: false,
  darkNavigation: true,
};

function freshStore(): LayoutStoreService {
  TestBed.resetTestingModule();
  return TestBed.inject(LayoutStoreService);
}

function themeLink(): HTMLLinkElement {
  return document.getElementById('app-theme') as HTMLLinkElement;
}

describe('LayoutStoreService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-bs-theme');

    // index.html parks this link in <body>; the TestBed document has no markup of its own.
    document.getElementById('app-theme')?.remove();
    const link = document.createElement('link');
    link.id = 'app-theme';
    link.rel = 'stylesheet';
    document.body.appendChild(link);
  });

  it('starts light, expanded and with dark navigation', () => {
    const store = freshStore();

    expect(store.state()).toEqual(DEFAULTS);
    expect(store.mobileMenuOpen()).toBe(false);
  });

  it('flips the theme between light and dark', () => {
    const store = freshStore();

    store.toggleTheme();
    expect(store.state().theme).toBe('dark');

    store.toggleTheme();
    expect(store.state().theme).toBe('light');
  });

  it('collapses and expands the sidebar', () => {
    const store = freshStore();

    store.toggleNavMinified();

    expect(store.state().navMinified).toBe(true);
  });

  it('opens and closes the mobile drawer', () => {
    const store = freshStore();

    store.toggleMobileMenu();
    expect(store.mobileMenuOpen()).toBe(true);

    store.closeMobileMenu();
    expect(store.mobileMenuOpen()).toBe(false);
  });

  it('mirrors the state onto the document so SmartAdmin can style it', () => {
    const store = freshStore();

    store.toggleTheme();
    store.toggleNavMinified();
    TestBed.tick();

    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('set-nav-minified')).toBe(true);
    expect(document.documentElement.classList.contains('set-nav-dark')).toBe(true);
  });

  it('restores persisted state on the next boot', () => {
    const store = freshStore();
    store.toggleTheme();
    TestBed.tick();

    expect(freshStore().state().theme).toBe('dark');
  });

  it('falls back to the defaults when the stored state is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    expect(freshStore().state()).toEqual(DEFAULTS);
  });

  it('returns to the defaults on reset', () => {
    const store = freshStore();
    store.toggleTheme();
    store.toggleNavMinified();
    store.toggleMobileMenu();

    store.reset();

    expect(store.state()).toEqual(DEFAULTS);
    expect(store.mobileMenuOpen()).toBe(false);
  });

  it('leaves the theme link href-less on the default skin', () => {
    freshStore();
    TestBed.tick();

    expect(themeLink().hasAttribute('href')).toBe(false);
  });

  it('points the theme link at the chosen skin stylesheet', () => {
    const store = freshStore();

    store.setSkin('nebula');
    TestBed.tick();

    expect(store.state().skin).toBe('nebula');
    expect(themeLink().getAttribute('href')).toBe('/assets/css/nebula.css');
  });

  it('clears the theme link when the skin goes back to default', () => {
    const store = freshStore();
    store.setSkin('storm');
    TestBed.tick();

    store.setSkin('default');
    TestBed.tick();

    expect(themeLink().hasAttribute('href')).toBe(false);
  });

  it('ignores a stored skin that is not one of the shipped stylesheets', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULTS, skin: '../../evil' }));

    const store = freshStore();
    TestBed.tick();

    expect(store.state().skin).toBe('default');
    expect(themeLink().hasAttribute('href')).toBe(false);
  });
});
