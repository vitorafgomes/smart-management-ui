import { ChangeDetectionStrategy, Component } from '@angular/core';

import { APP_NAME } from '../../shell-constants';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly appName = APP_NAME;
  protected readonly currentYear = new Date().getFullYear();
}
