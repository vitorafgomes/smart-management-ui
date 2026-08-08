import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TenantStorageService } from '@shared-kernel/tenant/tenant-storage.service';

@Component({
  selector: 'app-app-logo',
  imports: [RouterLink],
  templateUrl: './app-logo.html',
  styleUrl: './app-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-inline-flex' },
})
export class AppLogo {
  private readonly tenant = inject(TenantStorageService);

  private readonly nameParts = computed(() =>
    this.tenant
      .currentTenant()
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()),
  );

  protected readonly brandMain = computed(() => this.nameParts()[0] ?? 'Smart');
  protected readonly brandSecondary = computed(() => {
    const parts = this.nameParts();
    return parts.length > 1 ? ` ${parts.slice(1).join(' ')}` : ' Management';
  });
}
