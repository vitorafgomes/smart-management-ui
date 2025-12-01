import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbNavModule, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { TenantInfo } from './components/tenant-info';
import { TenantBranding } from './components/tenant-branding';
import { TenantLocalization } from './components/tenant-localization';
import { TenantCompliance } from './components/tenant-compliance';
import { TenantHeader } from './components/tenant-header';
import { TenantsService } from '@core/services/api/identity-tenant/tenants.service';
import { KeycloakAuthService } from '@core/services/auth/keycloak-auth.service';
import { Tenant } from '@core/models/domain/identity-tenant';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    NgbNavModule,
    NgbNavOutlet,
    TenantInfo,
    TenantBranding,
    TenantLocalization,
    TenantCompliance,
    TenantHeader
  ],
  templateUrl: './tenant-settings.html',
  styles: ``
})
export class TenantSettings implements OnInit {
  private readonly tenantsService = inject(TenantsService);
  private readonly authService = inject(KeycloakAuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  activeId = 'info';
  tenant: Tenant | null = null;
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadTenantData();
  }

  loadTenantData(): void {
    // Get tenant ID from auth service (stored during login)
    const tenantInfo = this.authService.getTenantInfo();

    if (tenantInfo?.id) {
      this.tenantsService.getTenantById(tenantInfo.id).subscribe({
        next: (tenant) => {
          this.tenant = tenant;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading tenant:', err);
          this.error = 'Failed to load organization data';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.error = 'No organization associated with this account';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onTenantUpdated(updatedTenant: Tenant): void {
    this.tenant = updatedTenant;
  }
}
