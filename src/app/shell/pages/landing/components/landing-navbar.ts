import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AUTH_ENABLED } from '@shared-kernel/auth/auth-enabled.token';

import { AppLogo } from '../../../components/app-logo/app-logo';
import { COMPANY_BRAND_MAIN, COMPANY_BRAND_SECONDARY } from '../../../shell-constants';

@Component({
  selector: 'app-landing-navbar',
  imports: [RouterLink, AppLogo],
  templateUrl: './landing-navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingNavbar {
  protected readonly brandMain = COMPANY_BRAND_MAIN;
  protected readonly brandSecondary = COMPANY_BRAND_SECONDARY;
  protected readonly authEnabled = inject(AUTH_ENABLED);
}
