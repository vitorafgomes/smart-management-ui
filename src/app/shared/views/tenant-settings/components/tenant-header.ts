import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tenant } from '@core/models/domain/identity-tenant';
import { TenantStatus } from '@core/models/domain/identity-tenant/tenants/tenant-status';
import { TenantsService } from '@core/services/api/identity-tenant/tenants.service';

@Component({
  selector: 'app-tenant-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-column flex-md-row align-items-center position-relative p-4">
      <div class="profile-page-header-avatar mb-3 mb-md-0">
        <div class="position-relative avatar-container" (click)="triggerFileInput()" role="button" tabindex="0">
          <div class="rounded-circle border border-3 border-white shadow-2 d-flex align-items-center justify-content-center overflow-hidden"
               [ngClass]="{'bg-primary': !tenant?.logoUrl}"
               style="width: 160px; height: 160px; cursor: pointer;">
            @if (previewUrl || tenant?.logoUrl) {
              <img [src]="previewUrl || tenant?.logoUrl"
                   alt="Logo da empresa"
                   class="w-100 h-100 object-fit-cover">
            } @else {
              <svg class="sa-icon text-white" style="width: 80px; height: 80px;">
                <use href="/assets/icons/sprite.svg#briefcase"></use>
              </svg>
            }
          </div>

          <!-- Upload Overlay -->
          <div class="avatar-overlay position-absolute top-0 start-0 w-100 h-100 rounded-circle d-flex align-items-center justify-content-center">
            <div class="text-center text-white">
              <svg class="sa-icon mb-1" style="width: 24px; height: 24px;">
                <use href="/assets/icons/sprite.svg#camera"></use>
              </svg>
              <small class="d-block">Upload Logo</small>
            </div>
          </div>

          <!-- Loading Overlay -->
          @if (isUploading) {
            <div class="position-absolute top-0 start-0 w-100 h-100 rounded-circle d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
              <div class="spinner-border text-white" role="status">
                <span class="visually-hidden">Uploading...</span>
              </div>
            </div>
          }
        </div>

        <!-- Hidden File Input -->
        <input #fileInput
               type="file"
               class="d-none"
               accept="image/png, image/jpeg, image/gif, image/webp"
               (change)="onFileSelected($event)">
      </div>

      <div class="profile-page-header-info ms-md-4 text-center text-md-start">
        <h1 class="fs-xxl fw-700 mb-2">{{ tenant?.companyName || 'Organization' }}</h1>
        <p class="text-muted mb-2">
          <span class="me-3">
            <svg class="sa-icon me-1">
              <use href="/assets/icons/sprite.svg#globe"></use>
            </svg>
            {{ tenant?.keycloakRealmName }}
          </span>
          @if (tenant?.subdomain) {
            <span>
              <svg class="sa-icon me-1">
                <use href="/assets/icons/sprite.svg#link"></use>
              </svg>
              {{ tenant?.subdomain }}
            </span>
          }
        </p>
        <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
          @if (tenant?.status !== undefined) {
            <span class="badge" [ngClass]="getStatusBadgeClass(tenant?.status)">
              {{ getStatusLabel(tenant?.status) }}
            </span>
          }
          @if (tenant?.defaultLanguage) {
            <span class="badge bg-primary-100 text-primary">{{ tenant?.defaultLanguage }}</span>
          }
          @if (tenant?.defaultCurrency) {
            <span class="badge bg-primary-100 text-primary">{{ tenant?.defaultCurrency }}</span>
          }
          @if (tenant?.countryCode) {
            <span class="badge bg-primary-100 text-primary">{{ tenant?.countryCode }}</span>
          }
        </div>
      </div>

      <div class="profile-page-header-actions ms-md-auto mt-3 mt-md-0 d-flex">
        <div class="text-end">
<!--          <small class="text-muted d-block">Tenant ID</small>-->
<!--          <code class="small">{{ tenant?.id }}</code>-->
        </div>
      </div>
    </div>
  `,
  styles: `
    .avatar-container {
      position: relative;
    }

    .avatar-overlay {
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .avatar-container:hover .avatar-overlay {
      opacity: 1;
    }

    .avatar-container:focus .avatar-overlay {
      opacity: 1;
    }

    .object-fit-cover {
      object-fit: cover;
    }
  `
})
export class TenantHeader {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() tenant: Tenant | null = null;
  @Output() logoUploaded = new EventEmitter<{ file: File; previewUrl: string }>();
  @Output() tenantUpdated = new EventEmitter<Tenant>();

  private readonly tenantsService = inject(TenantsService);

  TenantStatus = TenantStatus;
  isUploading = false;
  previewUrl: string | null = null;

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (PNG, JPG, GIF, or WebP)');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
      this.logoUploaded.emit({ file, previewUrl: this.previewUrl });
      this.uploadLogo(file);
    };
    reader.readAsDataURL(file);

    // Reset input
    input.value = '';
  }

  private uploadLogo(file: File): void {
    if (!this.tenant) return;

    this.isUploading = true;

    // Create FormData for upload
    const formData = new FormData();
    formData.append('logo', file);

    this.tenantsService.uploadLogo(this.tenant.id, formData).subscribe({
      next: (response: { logoUrl: string }) => {
        this.isUploading = false;
        // Update tenant with new logo URL
        const updatedTenant = { ...this.tenant!, logoUrl: response.logoUrl };
        this.tenantUpdated.emit(updatedTenant);
      },
      error: (err) => {
        console.error('Error uploading logo:', err);
        this.isUploading = false;
        // Keep the preview even if upload fails for now
        // You could add a retry mechanism or error message here
      }
    });
  }

  /**
   * Normaliza o status para comparação (lida com string ou número)
   */
  private normalizeStatus(status: TenantStatus | string | undefined): string {
    if (status === undefined || status === null) return '';

    // Se for número, converte usando o enum
    if (typeof status === 'number') {
      return TenantStatus[status] || '';
    }

    // Se for string, retorna direto
    return String(status);
  }

  getStatusLabel(status: TenantStatus | string | undefined): string {
    const normalized = this.normalizeStatus(status);

    switch (normalized) {
      case 'Active': return 'Active';
      case 'Provisioning': return 'Provisioning';
      case 'Suspended': return 'Suspended';
      case 'Inactive': return 'Inactive';
      case 'Deleted': return 'Deleted';
      case 'None': return 'None';
      default: return 'Unknown';
    }
  }

  getStatusBadgeClass(status: TenantStatus | string | undefined): string {
    const normalized = this.normalizeStatus(status);

    switch (normalized) {
      case 'Active': return 'bg-success-100 text-success';
      case 'Provisioning': return 'bg-warning-100 text-warning';
      case 'Suspended': return 'bg-danger-100 text-danger';
      case 'Inactive': return 'bg-secondary-100 text-secondary';
      case 'Deleted': return 'bg-dark-100 text-dark';
      default: return 'bg-secondary-100 text-secondary';
    }
  }
}
