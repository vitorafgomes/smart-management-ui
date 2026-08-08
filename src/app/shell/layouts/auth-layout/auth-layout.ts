import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ToastOutlet } from '@shared-kernel/toasts/toast-outlet/toast-outlet';

import { AppLogo } from '../../components/app-logo/app-logo';
import { BackgroundAnimation } from '../../components/background-animation/background-animation';
import { COMPANY_BRAND_MAIN, COMPANY_BRAND_SECONDARY } from '../../shell-constants';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, ToastOutlet, BackgroundAnimation, AppLogo],
  templateUrl: './auth-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayout {
  protected readonly brandMain = COMPANY_BRAND_MAIN;
  protected readonly brandSecondary = COMPANY_BRAND_SECONDARY;
}
