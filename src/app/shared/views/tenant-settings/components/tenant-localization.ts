import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Tenant } from '@core/models/domain/identity-tenant';
import { TenantsService } from '@core/services/api/identity-tenant/tenants.service';

@Component({
  selector: 'app-tenant-localization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModalModule],
  template: `
    <div class="row g-4">
      <!-- Language & Region Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#globe"></use>
              </svg>
              Language & Region
            </h5>
            <button class="btn btn-sm btn-outline-primary" (click)="openModal(editLocalizationModal)">
              <svg class="sa-icon me-1">
                <use href="/assets/icons/sprite.svg#edit-3"></use>
              </svg>
              Edit
            </button>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Default Language</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.defaultLanguage || '-' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Country</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.countryCode || '-' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Region</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.regionCode || '-' }}</div>
            </div>
            <div class="row">
              <div class="col-sm-5 text-muted">Timezone</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.defaultTimezone || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Currency & Numbers Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#dollar-sign"></use>
              </svg>
              Currency & Numbers
            </h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Default Currency</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.defaultCurrency || '-' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Decimal Separator</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.decimalSeparator || '.' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Thousands Separator</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.thousandsSeparator || ',' }}</div>
            </div>
            <div class="row">
              <div class="col-sm-5 text-muted">Measurement System</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.measurementSystem || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Date & Time Format Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#calendar"></use>
              </svg>
              Date & Time Format
            </h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Date Format</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.dateFormat || '-' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Time Format</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.timeFormat || '-' }}</div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Week Start Day</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.weekStartDay || '-' }}</div>
            </div>
            <div class="row">
              <div class="col-sm-5 text-muted">Fiscal Year Start</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.fiscalYearStart || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Format Card -->
      <div class="col-lg-6">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#phone"></use>
              </svg>
              Contact Formats
            </h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-sm-5 text-muted">Phone Country Code</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.phoneCountryCode || '-' }}</div>
            </div>
            <div class="row">
              <div class="col-sm-5 text-muted">Postal Code Format</div>
              <div class="col-sm-7 fw-medium">{{ tenant?.postalCodeFormat || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Supported Languages Card -->
      <div class="col-12">
        <div class="card shadow-1">
          <div class="card-header">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#list"></use>
              </svg>
              Supported Languages & Currencies
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3 mb-md-0">
                <label class="form-label text-muted">Supported Languages</label>
                <div class="d-flex flex-wrap gap-2">
                  @if (tenant?.supportedLanguages) {
                    @for (lang of getSupportedLanguages(); track lang) {
                      <span class="badge bg-primary-100 text-primary">{{ lang }}</span>
                    }
                  } @else {
                    <span class="text-muted">No additional languages configured</span>
                  }
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted">Supported Currencies</label>
                <div class="d-flex flex-wrap gap-2">
                  @if (tenant?.supportedCurrencies) {
                    @for (currency of getSupportedCurrencies(); track currency) {
                      <span class="badge bg-success-100 text-success">{{ currency }}</span>
                    }
                  } @else {
                    <span class="text-muted">No additional currencies configured</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Localization Modal -->
    <ng-template #editLocalizationModal let-modal>
      <div class="modal-header">
        <h5 class="modal-title">Edit Localization Settings</h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>

      <form [formGroup]="localizationForm" (ngSubmit)="onSubmit(modal)">
        <div class="modal-body">
          <h6 class="mb-3 text-muted">Language & Region</h6>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Default Language <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="defaultLanguage">
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="pt-BR">Portuguese (Brazil)</option>
                <option value="es-ES">Spanish (Spain)</option>
                <option value="fr-FR">French (France)</option>
                <option value="de-DE">German (Germany)</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Default Timezone <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="defaultTimezone">
                <option value="America/New_York">Eastern Time (US)</option>
                <option value="America/Chicago">Central Time (US)</option>
                <option value="America/Denver">Mountain Time (US)</option>
                <option value="America/Los_Angeles">Pacific Time (US)</option>
                <option value="America/Sao_Paulo">Brasilia Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Country Code</label>
              <input type="text" class="form-control" formControlName="countryCode" placeholder="e.g., US, BR, GB">
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Region Code</label>
              <input type="text" class="form-control" formControlName="regionCode" placeholder="e.g., CA, SP">
            </div>
          </div>

          <h6 class="mb-3 text-muted">Currency</h6>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Default Currency <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="defaultCurrency">
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="BRL">Brazilian Real (BRL)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
              </select>
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label">Decimal Separator</label>
              <select class="form-select" formControlName="decimalSeparator">
                <option value=".">Period (.)</option>
                <option value=",">Comma (,)</option>
              </select>
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label">Thousands Separator</label>
              <select class="form-select" formControlName="thousandsSeparator">
                <option value=",">Comma (,)</option>
                <option value=".">Period (.)</option>
                <option value=" ">Space</option>
              </select>
            </div>
          </div>

          <h6 class="mb-3 text-muted">Date & Time</h6>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Date Format</label>
              <select class="form-select" formControlName="dateFormat">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Time Format</label>
              <select class="form-select" formControlName="timeFormat">
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
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
export class TenantLocalization {
  @Input() tenant: Tenant | null = null;
  @Output() tenantUpdated = new EventEmitter<Tenant>();

  private readonly fb = inject(FormBuilder);
  private readonly modalService = inject(NgbModal);
  private readonly tenantsService = inject(TenantsService);

  localizationForm: FormGroup;
  isSaving = false;

  constructor() {
    this.localizationForm = this.fb.group({
      defaultLanguage: ['en-US', Validators.required],
      defaultTimezone: ['UTC', Validators.required],
      countryCode: [''],
      regionCode: [''],
      defaultCurrency: ['USD', Validators.required],
      decimalSeparator: ['.'],
      thousandsSeparator: [','],
      dateFormat: ['MM/DD/YYYY'],
      timeFormat: ['12h']
    });
  }

  getSupportedLanguages(): string[] {
    if (!this.tenant?.supportedLanguages) return [];
    if (Array.isArray(this.tenant.supportedLanguages)) {
      return this.tenant.supportedLanguages;
    }
    return this.tenant.supportedLanguages.split(',').map(s => s.trim()).filter(s => s);
  }

  getSupportedCurrencies(): string[] {
    if (!this.tenant?.supportedCurrencies) return [];
    if (Array.isArray(this.tenant.supportedCurrencies)) {
      return this.tenant.supportedCurrencies;
    }
    return this.tenant.supportedCurrencies.split(',').map(s => s.trim()).filter(s => s);
  }

  openModal(content: any): void {
    // Populate form with current values
    this.localizationForm.patchValue({
      defaultLanguage: this.tenant?.defaultLanguage || 'en-US',
      defaultTimezone: this.tenant?.defaultTimezone || 'UTC',
      countryCode: this.tenant?.countryCode || '',
      regionCode: this.tenant?.regionCode || '',
      defaultCurrency: this.tenant?.defaultCurrency || 'USD',
      decimalSeparator: this.tenant?.decimalSeparator || '.',
      thousandsSeparator: this.tenant?.thousandsSeparator || ',',
      dateFormat: this.tenant?.dateFormat || 'MM/DD/YYYY',
      timeFormat: this.tenant?.timeFormat || '12h'
    });
    this.modalService.open(content, { size: 'lg' });
  }

  onSubmit(modal: any): void {
    if (this.localizationForm.invalid || !this.tenant) {
      this.localizationForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.localizationForm.value;

    // Create JSON Patch document
    const patchDocument: any[] = [];
    const fields = [
      'defaultLanguage', 'defaultTimezone', 'countryCode', 'regionCode',
      'defaultCurrency', 'decimalSeparator', 'thousandsSeparator',
      'dateFormat', 'timeFormat'
    ];

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
