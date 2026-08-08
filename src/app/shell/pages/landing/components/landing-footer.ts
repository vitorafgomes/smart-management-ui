import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_NAME } from '../../../shell-constants';

@Component({
  selector: 'app-landing-footer',
  imports: [RouterLink],
  templateUrl: './landing-footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFooter {
  protected readonly appName = APP_NAME;
  protected readonly currentYear = new Date().getFullYear();
}
