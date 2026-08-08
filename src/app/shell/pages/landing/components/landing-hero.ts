import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-hero',
  imports: [RouterLink],
  templateUrl: './landing-hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingHero {
  /** The theme reads this back through `.eye-catcher-text::after` to cast the headline shadow. */
  protected readonly headline = 'One back office for the whole operation';
}
