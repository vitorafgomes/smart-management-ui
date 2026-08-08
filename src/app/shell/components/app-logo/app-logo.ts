import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TenantStorageService } from '@shared-kernel/tenant/tenant-storage.service';

/**
 * The animated blob mark and the wordmark beside it. The two surfaces it appears on want
 * different words: the sidenav names the tenant you are signed in to, while the landing and auth
 * navbars carry the fixed company brand. Left unset, the wordmark falls back to the tenant.
 */
@Component({
  selector: 'app-app-logo',
  imports: [RouterLink],
  templateUrl: './app-logo.html',
  styleUrl: './app-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-inline-flex' },
})
export class AppLogo {
  readonly brandMain = input<string>();
  readonly brandSecondary = input<string>();
  readonly link = input('/dashboard');

  private readonly tenant = inject(TenantStorageService);

  private readonly nameParts = computed(() =>
    this.tenant
      .currentTenant()
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()),
  );

  protected readonly mainText = computed(() => this.brandMain() ?? this.nameParts()[0] ?? 'Smart');
  protected readonly secondaryText = computed(() => {
    const override = this.brandSecondary();
    if (override !== undefined) {
      return override;
    }

    const parts = this.nameParts();
    return parts.length > 1 ? ` ${parts.slice(1).join(' ')}` : ' Management';
  });
}
