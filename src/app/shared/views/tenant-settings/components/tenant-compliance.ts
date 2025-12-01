import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Tenant } from '@core/models/domain/identity-tenant';
import { TenantsService } from '@core/services/api/identity-tenant/tenants.service';

@Component({
  selector: 'app-tenant-compliance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModalModule],
  template: `
    <div class="row g-4">
      <!-- Data Protection Regulations Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#shield"></use>
              </svg>
              Data Protection Regulations
            </h5>
            <button class="btn btn-sm btn-outline-primary" (click)="openModal(editComplianceModal)">
              <svg class="sa-icon me-1">
                <use href="/assets/icons/sprite.svg#edit-3"></use>
              </svg>
              Edit
            </button>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
              <div>
                <h6 class="mb-1">GDPR Compliant</h6>
                <small class="text-muted">General Data Protection Regulation (EU)</small>
              </div>
              <span class="badge" [ngClass]="tenant?.gdprCompliant ? 'bg-success' : 'bg-secondary'">
                {{ tenant?.gdprCompliant ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
              <div>
                <h6 class="mb-1">LGPD Compliant</h6>
                <small class="text-muted">Lei Geral de Protecao de Dados (Brazil)</small>
              </div>
              <span class="badge" [ngClass]="tenant?.lgpdCompliant ? 'bg-success' : 'bg-secondary'">
                {{ tenant?.lgpdCompliant ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h6 class="mb-1">CCPA Compliant</h6>
                <small class="text-muted">California Consumer Privacy Act (US)</small>
              </div>
              <span class="badge" [ngClass]="tenant?.ccpaCompliant ? 'bg-success' : 'bg-secondary'">
                {{ tenant?.ccpaCompliant ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Residency Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#database"></use>
              </svg>
              Data Residency
            </h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Data Region</div>
              <div class="col-sm-7 fw-medium">
                @if (tenant?.dataResidencyRegion) {
                  <span class="badge bg-info">{{ tenant?.dataResidencyRegion }}</span>
                } @else {
                  <span class="text-muted">Not specified</span>
                }
              </div>
            </div>
            <div class="row">
              <div class="col-sm-5 text-muted">Allow Data Transfer</div>
              <div class="col-sm-7">
                <span class="badge" [ngClass]="tenant?.allowDataTransfer ? 'bg-success' : 'bg-warning'">
                  {{ tenant?.allowDataTransfer ? 'Allowed' : 'Restricted' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Compliance Status Card -->
      <div class="col-12">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#check-circle"></use>
              </svg>
              Compliance Overview
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4 mb-3 mb-md-0">
                <div class="d-flex align-items-center">
                  @if (tenant?.gdprCompliant || tenant?.lgpdCompliant || tenant?.ccpaCompliant) {
                    <div class="rounded-circle bg-success-100 p-3 me-3">
                      <svg class="sa-icon text-success">
                        <use href="/assets/icons/sprite.svg#check"></use>
                      </svg>
                    </div>
                    <div>
                      <h6 class="mb-0">Privacy Regulations</h6>
                      <small class="text-success">At least one regulation enabled</small>
                    </div>
                  } @else {
                    <div class="rounded-circle bg-warning-100 p-3 me-3">
                      <svg class="sa-icon text-warning">
                        <use href="/assets/icons/sprite.svg#alert-triangle"></use>
                      </svg>
                    </div>
                    <div>
                      <h6 class="mb-0">Privacy Regulations</h6>
                      <small class="text-warning">No regulations enabled</small>
                    </div>
                  }
                </div>
              </div>
              <div class="col-md-4 mb-3 mb-md-0">
                <div class="d-flex align-items-center">
                  @if (tenant?.dataResidencyRegion) {
                    <div class="rounded-circle bg-success-100 p-3 me-3">
                      <svg class="sa-icon text-success">
                        <use href="/assets/icons/sprite.svg#check"></use>
                      </svg>
                    </div>
                    <div>
                      <h6 class="mb-0">Data Residency</h6>
                      <small class="text-success">Region configured</small>
                    </div>
                  } @else {
                    <div class="rounded-circle bg-secondary-100 p-3 me-3">
                      <svg class="sa-icon text-secondary">
                        <use href="/assets/icons/sprite.svg#minus"></use>
                      </svg>
                    </div>
                    <div>
                      <h6 class="mb-0">Data Residency</h6>
                      <small class="text-muted">Not configured</small>
                    </div>
                  }
                </div>
              </div>
              <div class="col-md-4">
                <div class="d-flex align-items-center">
                  <div class="rounded-circle bg-info-100 p-3 me-3">
                    <svg class="sa-icon text-info">
                      <use href="/assets/icons/sprite.svg#info"></use>
                    </svg>
                  </div>
                  <div>
                    <h6 class="mb-0">Audit Logs</h6>
                    <small class="text-info">Available in Audit section</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Information Card -->
      <div class="col-12">
        <div class="alert alert-info mb-0">
          <div class="d-flex">
            <svg class="sa-icon me-3 flex-shrink-0">
              <use href="/assets/icons/sprite.svg#info"></use>
            </svg>
            <div>
              <h6 class="alert-heading">About Compliance Settings</h6>
              <p class="mb-0">
                Enabling compliance regulations will affect how user data is collected, stored, and processed.
                Make sure to review your organization's legal requirements before making changes.
                For detailed compliance reports and data processing agreements, please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Compliance Modal -->
    <ng-template #editComplianceModal let-modal>
      <div class="modal-header">
        <h5 class="modal-title">Edit Compliance Settings</h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>

      <form [formGroup]="complianceForm" (ngSubmit)="onSubmit(modal)">
        <div class="modal-body">
          <h6 class="mb-3 text-muted">Data Protection Regulations</h6>

          <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" id="gdprCompliant" formControlName="gdprCompliant">
            <label class="form-check-label" for="gdprCompliant">
              <strong>GDPR Compliant</strong>
              <br><small class="text-muted">Enable General Data Protection Regulation compliance (EU)</small>
            </label>
          </div>

          <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" id="lgpdCompliant" formControlName="lgpdCompliant">
            <label class="form-check-label" for="lgpdCompliant">
              <strong>LGPD Compliant</strong>
              <br><small class="text-muted">Enable Lei Geral de Protecao de Dados compliance (Brazil)</small>
            </label>
          </div>

          <div class="form-check form-switch mb-4">
            <input class="form-check-input" type="checkbox" id="ccpaCompliant" formControlName="ccpaCompliant">
            <label class="form-check-label" for="ccpaCompliant">
              <strong>CCPA Compliant</strong>
              <br><small class="text-muted">Enable California Consumer Privacy Act compliance (US)</small>
            </label>
          </div>

          <h6 class="mb-3 text-muted">Data Residency</h6>

          <div class="mb-3">
            <label class="form-label">Data Residency Region</label>
            <select class="form-select" formControlName="dataResidencyRegion">
              <option value="">Not specified</option>
              <option value="us-east">US East</option>
              <option value="us-west">US West</option>
              <option value="eu-west">EU West (Ireland)</option>
              <option value="eu-central">EU Central (Frankfurt)</option>
              <option value="sa-east">South America (Sao Paulo)</option>
              <option value="ap-southeast">Asia Pacific (Singapore)</option>
            </select>
          </div>

          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="allowDataTransfer" formControlName="allowDataTransfer">
            <label class="form-check-label" for="allowDataTransfer">
              <strong>Allow Cross-Border Data Transfer</strong>
              <br><small class="text-muted">Allow data to be transferred outside the residency region</small>
            </label>
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
export class TenantCompliance {
  @Input() tenant: Tenant | null = null;
  @Output() tenantUpdated = new EventEmitter<Tenant>();

  private readonly fb = inject(FormBuilder);
  private readonly modalService = inject(NgbModal);
  private readonly tenantsService = inject(TenantsService);

  complianceForm: FormGroup;
  isSaving = false;

  constructor() {
    this.complianceForm = this.fb.group({
      gdprCompliant: [false],
      lgpdCompliant: [false],
      ccpaCompliant: [false],
      dataResidencyRegion: [''],
      allowDataTransfer: [true]
    });
  }

  openModal(content: any): void {
    // Populate form with current values
    this.complianceForm.patchValue({
      gdprCompliant: this.tenant?.gdprCompliant || false,
      lgpdCompliant: this.tenant?.lgpdCompliant || false,
      ccpaCompliant: this.tenant?.ccpaCompliant || false,
      dataResidencyRegion: this.tenant?.dataResidencyRegion || '',
      allowDataTransfer: this.tenant?.allowDataTransfer ?? true
    });
    this.modalService.open(content, { size: 'lg' });
  }

  onSubmit(modal: any): void {
    if (!this.tenant) return;

    this.isSaving = true;
    const formValue = this.complianceForm.value;

    // Create JSON Patch document
    const patchDocument: any[] = [];
    const fields = ['gdprCompliant', 'lgpdCompliant', 'ccpaCompliant', 'dataResidencyRegion', 'allowDataTransfer'];

    fields.forEach(field => {
      if (formValue[field] !== (this.tenant as any)[field]) {
        patchDocument.push({ op: 'replace', path: `/${field}`, value: formValue[field] });
      }
    });

    if (patchDocument.length === 0) {
      modal.close();
      this.isSaving = false;
      return;
    }

    this.tenantsService.updateTenant(this.tenant.id, patchDocument).subscribe({
      next: () => {
        const updatedTenant = { ...this.tenant!, ...formValue };
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
