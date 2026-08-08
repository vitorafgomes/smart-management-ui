import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppLogo } from './app-logo';

function render(): ComponentFixture<AppLogo> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [AppLogo], providers: [provideRouter([])] });

  const fixture = TestBed.createComponent(AppLogo);
  fixture.detectChanges();
  return fixture;
}

function wordmark(fixture: ComponentFixture<AppLogo>): string {
  return (fixture.nativeElement.querySelector('.logo-text') as HTMLElement)
    .textContent!.replace(/\s+/g, ' ')
    .trim();
}

describe('AppLogo', () => {
  it('renders the animated blob mark', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelector('.blobs svg')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.blob').length).toBe(8);
  });

  it('overlays a three-ring spinning atom mark on top of the blobs', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelector('.logo-mark')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ring-1')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ring-2')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ring-3')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.core')).not.toBeNull();
  });

  it('names the current tenant when no brand is given, and points at the dashboard', () => {
    const fixture = render();

    expect(wordmark(fixture)).toContain('Smart');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/dashboard');
  });

  it('carries the company wordmark and destination it is handed', () => {
    const fixture = render();

    fixture.componentRef.setInput('brandMain', 'Chiacho');
    fixture.componentRef.setInput('brandSecondary', ' & Gomes');
    fixture.componentRef.setInput('link', '/');
    fixture.detectChanges();

    expect(wordmark(fixture)).toBe('Chiacho & Gomes');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/');
  });
});
