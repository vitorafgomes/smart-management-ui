import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Sidenav } from './sidenav';

function typeInFilter(fixture: ComponentFixture<Sidenav>, value: string): void {
  const input = fixture.nativeElement.querySelector('#menu-filter') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function renderedLabels(fixture: ComponentFixture<Sidenav>): string[] {
  return [...fixture.nativeElement.querySelectorAll('.nav-link-text')].map((element) =>
    (element as HTMLElement).textContent!.trim(),
  );
}

describe('Sidenav', () => {
  let fixture: ComponentFixture<Sidenav>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Sidenav],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidenav);
    fixture.detectChanges();
  });

  it('renders the mocked menu', () => {
    expect(renderedLabels(fixture)).toContain('Home');
    expect(renderedLabels(fixture)).toContain('Identity');
  });

  it('keeps only entries matching the filter', () => {
    typeInFilter(fixture, 'sales');

    expect(renderedLabels(fixture)).toEqual(['Sales']);
  });

  it('keeps a parent when one of its children matches', () => {
    typeInFilter(fixture, 'permissions');

    expect(renderedLabels(fixture)).toEqual(['Identity', 'Permissions']);
  });

  it('tells the user when nothing matches', () => {
    typeInFilter(fixture, 'nothing-here');

    expect(renderedLabels(fixture)).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No menu items found.');
  });

  it('restores the full menu when the filter is cleared', () => {
    typeInFilter(fixture, 'sales');
    typeInFilter(fixture, '');

    expect(renderedLabels(fixture)).toContain('Home');
  });
});
