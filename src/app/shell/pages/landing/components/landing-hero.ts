import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AUTH_ENABLED } from '@shared-kernel/auth/auth-enabled.token';

import { BackgroundAnimation } from '../../../components/background-animation/background-animation';

@Component({
  selector: 'app-landing-hero',
  imports: [RouterLink, BackgroundAnimation],
  templateUrl: './landing-hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingHero {
  /** The theme reads this back through `.eye-catcher-text::after` to cast the headline shadow. */
  protected readonly headline = 'One back office for the whole operation';
  protected readonly authEnabled = inject(AUTH_ENABLED);
}
