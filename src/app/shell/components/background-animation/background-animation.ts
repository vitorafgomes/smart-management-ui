import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';

interface VantaEffect {
  destroy(): void;
}

/**
 * The animated hero backdrop: a vanta.js HALO effect rendered on a WebGL canvas by three.js.
 *
 * three.js and vanta together weigh more than the rest of the application, and the auth layout
 * that uses this component is reached eagerly, so both are pulled in by dynamic import at first
 * render rather than named at the top of the file. That keeps them in a chunk of their own,
 * fetched only once a surface that shows the effect is on screen.
 *
 * `#net` is the theme's own hook - assets/sass/app/_landing.scss and _authentication.scss both
 * size it and push its canvas behind the hero content, so the id has to stay.
 */
@Component({
  selector: 'app-background-animation',
  template: `<div #vantaHost id="net" class="w-100 h-100"></div>`,
  styles: `
    #net {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundAnimation {
  private readonly vantaHost = viewChild.required<ElementRef<HTMLDivElement>>('vantaHost');

  private effect?: VantaEffect;
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.effect?.destroy();
      this.effect = undefined;
    });

    afterNextRender(() => {
      void this.start();
    });
  }

  private async start(): Promise<void> {
    try {
      const [three, haloModule] = await Promise.all([
        import('three'),
        import('vanta/dist/vanta.halo.min'),
      ]);

      // The component can be torn down while those two chunks are still in flight.
      if (this.destroyed) {
        return;
      }

      // vanta ships a UMD build; depending on bundler interop the factory arrives as the
      // namespace default (dev server) or nested one level deeper (production esbuild).
      const unwrapped = (haloModule as { default?: unknown }).default ?? haloModule;
      const haloFactory = (
        typeof unwrapped === 'function' ? unwrapped : (unwrapped as { default?: unknown }).default
      ) as (options: Record<string, unknown>) => VantaEffect;

      if (typeof haloFactory !== 'function') {
        throw new TypeError('vanta HALO factory not found in module shape');
      }

      this.effect = haloFactory({
        el: this.vantaHost().nativeElement,
        THREE: three,
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        color: 0xfd3995,
        backgroundColor: '#515a99',
        size: 1.6,
        scale: 0.75,
        xOffset: 0.22,
        scaleMobile: 0.5,
      });
    } catch (error) {
      // Rule G wants a failure to leave a state the user can read, and here it already does:
      // the hero keeps the static gradient underneath. Escalating to the global handler would
      // put a toast on screen for a backdrop nobody asked for.
      console.warn('Hero background animation unavailable; falling back to the gradient.', error);
    }
  }
}
