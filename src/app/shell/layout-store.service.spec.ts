import { TestBed } from '@angular/core/testing';

import { LayoutStoreService } from './layout-store.service';

const STORAGE_KEY = 'smart-management-layout';

function freshStore(): LayoutStoreService {
  TestBed.resetTestingModule();
  return TestBed.inject(LayoutStoreService);
}

describe('LayoutStoreService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-bs-theme');
  });

  it('starts light, expanded and with dark navigation', () => {
    const store = freshStore();

    expect(store.state()).toEqual({ theme: 'light', navMinified: false, darkNavigation: true });
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

    expect(freshStore().state()).toEqual({
      theme: 'light',
      navMinified: false,
      darkNavigation: true,
    });
  });

  it('returns to the defaults on reset', () => {
    const store = freshStore();
    store.toggleTheme();
    store.toggleNavMinified();
    store.toggleMobileMenu();

    store.reset();

    expect(store.state()).toEqual({ theme: 'light', navMinified: false, darkNavigation: true });
    expect(store.mobileMenuOpen()).toBe(false);
  });
});
