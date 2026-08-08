import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_NAME } from '../../../shell-constants';

@Component({
  selector: 'app-landing-navbar',
  imports: [RouterLink],
  templateUrl: './landing-navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingNavbar {
  protected readonly appName = APP_NAME;
}
