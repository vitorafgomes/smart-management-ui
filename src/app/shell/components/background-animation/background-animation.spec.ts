import { ApplicationRef, ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BackgroundAnimation } from './background-animation';

interface HaloOptions {
  el: HTMLElement;
  color: number;
  backgroundColor: string;
}

// vi.mock factories are hoisted above the module body, so the spies have to be too.
const { destroy, halo } = vi.hoisted(() => {
  const destroySpy = vi.fn();
  return {
    destroy: destroySpy,
    halo: vi.fn<(options: HaloOptions) => { destroy: () => void }>(() => ({
      destroy: destroySpy,
    })),
  };
});

vi.mock('vanta/dist/vanta.halo.min', () => ({ default: halo }));

// three brings a WebGL renderer jsdom cannot back; the component only forwards the namespace on.
vi.mock('three', () => ({ WebGLRenderer: class {} }));

async function renderAndSettle(): Promise<ComponentRef<BackgroundAnimation>> {
  const fixture = TestBed.createComponent(BackgroundAnimation);
  fixture.detectChanges();
  TestBed.inject(ApplicationRef).tick();

  // The effect is started from an afterNextRender callback that awaits two dynamic imports.
  await vi.waitFor(() => expect(halo).toHaveBeenCalled());

  return fixture.componentRef;
}

describe('BackgroundAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('renders the #net host the theme sizes the canvas against', () => {
    const fixture = TestBed.createComponent(BackgroundAnimation);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#net')).not.toBeNull();
  });

  it('starts the halo effect on the host element with the theme colours', async () => {
    const componentRef = await renderAndSettle();

    expect(halo).toHaveBeenCalledTimes(1);

    const options = halo.mock.calls[0][0];
    expect(options.el).toBe(componentRef.location.nativeElement.querySelector('#net'));
    expect(options.color).toBe(0xfd3995);
    expect(options.backgroundColor).toBe('#515a99');
  });

  it('tears the effect down with the component so the WebGL context is released', async () => {
    const componentRef = await renderAndSettle();

    componentRef.destroy();

    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
