import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Tenant } from '@core/models/domain/identity-tenant';
import { TenantsService } from '@core/services/api/identity-tenant/tenants.service';

@Component({
  selector: 'app-tenant-branding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModalModule],
  template: `
    <div class="row g-4">
      <!-- Logo & Identity Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#image"></use>
              </svg>
              Logo & Identity
            </h5>
            <button class="btn btn-sm btn-outline-primary" (click)="openModal(editBrandingModal)">
              <svg class="sa-icon me-1">
                <use href="/assets/icons/sprite.svg#edit-3"></use>
              </svg>
              Edit
            </button>
          </div>
          <div class="card-body">
            <div class="text-center mb-4">
              <div class="border rounded p-4 bg-light">
                <svg class="sa-icon text-muted" style="width: 100px; height: 100px;">
                  <use href="/assets/icons/sprite.svg#image"></use>
                </svg>
                <p class="text-muted mt-2 mb-0">No logo uploaded</p>
              </div>
            </div>
            <div class="row">
              <div class="col-6">
                <button class="btn btn-outline-primary w-100">
                  <svg class="sa-icon me-2">
                    <use href="/assets/icons/sprite.svg#upload"></use>
                  </svg>
                  Upload Logo
                </button>
              </div>
              <div class="col-6">
                <button class="btn btn-outline-secondary w-100">
                  <svg class="sa-icon me-2">
                    <use href="/assets/icons/sprite.svg#upload"></use>
                  </svg>
                  Upload Favicon
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Color Theme Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#droplet"></use>
              </svg>
              Color Theme
            </h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label text-muted">Primary Color</label>
                <div class="d-flex align-items-center">
                  <div class="rounded me-2" style="width: 40px; height: 40px; background-color: #886ab5;"></div>
                  <code>#886ab5</code>
                </div>
              </div>
              <div class="col-6">
                <label class="form-label text-muted">Secondary Color</label>
                <div class="d-flex align-items-center">
                  <div class="rounded me-2" style="width: 40px; height: 40px; background-color: #6c757d;"></div>
                  <code>#6c757d</code>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-6">
                <label class="form-label text-muted">Success Color</label>
                <div class="d-flex align-items-center">
                  <div class="rounded me-2" style="width: 40px; height: 40px; background-color: #1dc9b7;"></div>
                  <code>#1dc9b7</code>
                </div>
              </div>
              <div class="col-6">
                <label class="form-label text-muted">Danger Color</label>
                <div class="d-flex align-items-center">
                  <div class="rounded me-2" style="width: 40px; height: 40px; background-color: #fd3995;"></div>
                  <code>#fd3995</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Email Templates Card -->
      <div class="col-12">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#mail"></use>
              </svg>
              Email Templates
            </h5>
          </div>
          <div class="card-body">
            <div class="alert alert-info mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#info"></use>
              </svg>
              Email template customization is managed through the Keycloak admin console for your realm.
              <a href="#" class="alert-link">Learn more</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Branding Modal -->
    <ng-template #editBrandingModal let-modal>
      <div class="modal-header">
        <h5 class="modal-title">Edit Branding</h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>

      <form [formGroup]="brandingForm" (ngSubmit)="onSubmit(modal)">
        <div class="modal-body">
          <div class="alert alert-warning">
            <svg class="sa-icon me-2">
              <use href="/assets/icons/sprite.svg#alert-triangle"></use>
            </svg>
            Branding customization feature coming soon.
          </div>

          <div class="mb-3">
            <label class="form-label">Primary Color</label>
            <input type="color" class="form-control form-control-color" formControlName="primaryColor">
          </div>

          <div class="mb-3">
            <label class="form-label">Secondary Color</label>
            <input type="color" class="form-control form-control-color" formControlName="secondaryColor">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" (click)="modal.dismiss()">Cancel</button>
          <button type="submit" class="btn btn-primary" disabled>Save Changes</button>
        </div>
      </form>
    </ng-template>
  `,
  styles: ``
})
export class TenantBranding {
  @Input() tenant: Tenant | null = null;
  @Output() tenantUpdated = new EventEmitter<Tenant>();

  private readonly fb = inject(FormBuilder);
  private readonly modalService = inject(NgbModal);

  brandingForm: FormGroup;

  constructor() {
    this.brandingForm = this.fb.group({
      primaryColor: ['#886ab5'],
      secondaryColor: ['#6c757d']
    });
  }

  openModal(content: any): void {
    this.modalService.open(content, { size: 'lg' });
  }

  onSubmit(modal: any): void {
    // Branding update logic will be implemented later
    modal.close();
  }
}
