import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Tenant } from '@core/models/domain/identity-tenant';
import { TenantStatus } from '@core/models/domain/identity-tenant/tenants/tenant-status';
import { TenantsService } from '@core/services/api/identity-tenant/tenants.service';

@Component({
  selector: 'app-tenant-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModalModule],
  template: `
    <div class="row g-4">
      <!-- Company Information Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#briefcase"></use>
              </svg>
              Company Information
            </h5>
            <button class="btn btn-sm btn-outline-primary" (click)="openModal(editCompanyModal)">
              <svg class="sa-icon me-1">
                <use href="/assets/icons/sprite.svg#edit-3"></use>
              </svg>
              Edit
            </button>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-sm-4 text-muted">Company Name</div>
              <div class="col-sm-8 fw-medium">{{ tenant?.companyName || '-' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-4 text-muted">Subdomain</div>
              <div class="col-sm-8 fw-medium">{{ tenant?.subdomain || '-' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-4 text-muted">Custom Domain</div>
              <div class="col-sm-8 fw-medium">{{ tenant?.customDomain || '-' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-4 text-muted">Status</div>
              <div class="col-sm-8">
                <span class="badge" [ngClass]="getStatusBadgeClass(tenant?.status)">
                  {{ getStatusLabel(tenant?.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Keycloak Realm Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#shield"></use>
              </svg>
              Identity Provider (Keycloak)
            </h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-sm-4 text-muted">Realm Name</div>
              <div class="col-sm-8 fw-medium">{{ tenant?.keycloakRealmName || '-' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-4 text-muted">Realm ID</div>
              <div class="col-sm-8">
                <code class="small">{{ tenant?.keycloakRealmId || '-' }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timestamps Card -->
      <div class="col-12">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#clock"></use>
              </svg>
              Activity Timeline
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-3 mb-md-0">
                <small class="text-muted d-block">Created At</small>
                <span class="fw-medium">{{ tenant?.createdAt | date:'medium' }}</span>
              </div>
              <div class="col-md-3 mb-3 mb-md-0">
                <small class="text-muted d-block">Activated At</small>
                <span class="fw-medium">{{ tenant?.activatedAt | date:'medium' }}</span>
              </div>
              <div class="col-md-3 mb-3 mb-md-0">
                <small class="text-muted d-block">Last Modified</small>
                <span class="fw-medium">{{ tenant?.modifiedAt | date:'medium' }}</span>
              </div>
              <div class="col-md-3">
                <small class="text-muted d-block">Modified By</small>
                <span class="fw-medium">{{ tenant?.modifiedBy || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Company Modal -->
    <ng-template #editCompanyModal let-modal>
      <div class="modal-header">
        <h5 class="modal-title">Edit Company Information</h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>

      <form [formGroup]="companyForm" (ngSubmit)="onSubmit(modal)">
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Company Name <span class="text-danger">*</span></label>
            <input type="text" class="form-control" formControlName="companyName"
                   [class.is-invalid]="isInvalid('companyName')">
            <div class="invalid-feedback">Company name is required.</div>
          </div>

          <div class="mb-3">
            <label class="form-label">Subdomain</label>
            <div class="input-group">
              <input type="text" class="form-control" formControlName="subdomain">
              <span class="input-group-text">.yourdomain.com</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Custom Domain</label>
            <input type="text" class="form-control" formControlName="customDomain"
                   placeholder="e.g., app.yourcompany.com">
            <div class="form-text">Optional: Use your own domain for white-label access.</div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" (click)="modal.dismiss()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="isSaving">
            @if (isSaving) {
              <span class="spinner-border spinner-border-sm me-1"></span>
            }
            Save Changes
          </button>
        </div>
      </form>
    </ng-template>
  `,
  styles: ``
})
export class TenantInfo {
  @Input() tenant: Tenant | null = null;
  @Output() tenantUpdated = new EventEmitter<Tenant>();

  private readonly fb = inject(FormBuilder);
  private readonly modalService = inject(NgbModal);
  private readonly tenantsService = inject(TenantsService);

  companyForm: FormGroup;
  isSaving = false;
  TenantStatus = TenantStatus;

  constructor() {
    this.companyForm = this.fb.group({
      companyName: ['', Validators.required],
      subdomain: [''],
      customDomain: ['']
    });
  }

  openModal(content: any): void {
    // Populate form with current values
    this.companyForm.patchValue({
      companyName: this.tenant?.companyName || '',
      subdomain: this.tenant?.subdomain || '',
      customDomain: this.tenant?.customDomain || ''
    });
    this.modalService.open(content, { size: 'lg' });
  }

  isInvalid(controlName: string): boolean {
    const control = this.companyForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
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
      default: return '-';
    }
  }

  getStatusBadgeClass(status: TenantStatus | string | undefined): string {
    const normalized = this.normalizeStatus(status);

    switch (normalized) {
      case 'Active': return 'bg-success';
      case 'Provisioning': return 'bg-warning';
      case 'Suspended': return 'bg-danger';
      case 'Inactive': return 'bg-secondary';
      case 'Deleted': return 'bg-dark';
      default: return 'bg-secondary';
    }
  }

  onSubmit(modal: any): void {
    if (this.companyForm.invalid || !this.tenant) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.companyForm.value;

    // Create JSON Patch document
    const patchDocument = [];

    if (formValue.companyName !== this.tenant.companyName) {
      patchDocument.push({ op: 'replace', path: '/companyName', value: formValue.companyName });
    }
    if (formValue.subdomain !== this.tenant.subdomain) {
      patchDocument.push({ op: 'replace', path: '/subdomain', value: formValue.subdomain });
    }
    if (formValue.customDomain !== this.tenant.customDomain) {
      patchDocument.push({ op: 'replace', path: '/customDomain', value: formValue.customDomain });
    }

    if (patchDocument.length === 0) {
      modal.close();
      this.isSaving = false;
      return;
    }

    this.tenantsService.updateTenant(this.tenant.id, patchDocument).subscribe({
      next: () => {
        // Update local tenant object
        const updatedTenant = {
          ...this.tenant!,
          ...formValue
        };
        this.tenantUpdated.emit(updatedTenant);
        modal.close();
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error updating tenant:', err);
        this.isSaving = false;
      }
    });
  }
}
