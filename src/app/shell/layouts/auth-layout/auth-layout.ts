import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ToastOutlet } from '@shared-kernel/toasts/toast-outlet/toast-outlet';

import { BackgroundAnimation } from '../../components/background-animation/background-animation';
import { APP_NAME } from '../../shell-constants';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, ToastOutlet, BackgroundAnimation],
  templateUrl: './auth-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayout {
  protected readonly appName = APP_NAME;
}
