/**
 * vanta ships no types. Only the HALO effect is used, and only through the handful of options
 * the hero backdrop sets - see src/app/shell/components/background-animation/.
 */
declare module 'vanta/dist/vanta.halo.min' {
  interface VantaEffect {
    destroy(): void;
    resize(): void;
  }

  interface VantaOptions {
    el: HTMLElement;
    THREE: unknown;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    color?: number;
    backgroundColor?: string;
    size?: number;
    scale?: number;
    scaleMobile?: number;
    xOffset?: number;
    yOffset?: number;
  }

  export default function HALO(options: VantaOptions): VantaEffect;
}
