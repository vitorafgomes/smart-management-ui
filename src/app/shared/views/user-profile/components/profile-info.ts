import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CurrentUserStore } from '@core/stores/current-user.store';
import { PermissionsService } from '@core/services/permissions.service';
import { UsersService } from '@core/services/api/identity-tenant/users.service';
import { UpdateUserRequest } from '@core/models/useCases/identity-tenant';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModalModule],
  template: `
    <div class="d-flex flex-column flex-md-row align-items-center position-relative p-4">
      <div class="profile-page-header-avatar mb-3 mb-md-0">
        <div class="position-relative">
          @if (currentUserStore.avatarUrl()) {
            <img [src]="currentUserStore.avatarUrl()"
                 class="rounded-circle border border-3 border-white shadow-2"
                 [alt]="currentUserStore.fullName()"
                 width="160" height="160">
          } @else {
            <span class="profile-avatar-placeholder rounded-circle border border-3 border-white shadow-2 bg-primary d-flex align-items-center justify-content-center text-white fw-500">
              {{ currentUserStore.initials() }}
            </span>
          }
          @if (permissionsService.canEditOwnProfile()) {
            <button class="btn btn-icon position-absolute bottom-0 end-0 bg-white rounded-circle shadow-2"
                    type="button" title="Change Avatar">
              <svg class="sa-icon">
                <use href="/assets/icons/sprite.svg#camera"></use>
              </svg>
            </button>
          }
        </div>
      </div>

      <div class="profile-page-header-info ms-md-4 text-center text-md-start">
        <h1 class="fs-xxl fw-700 mb-2">{{ currentUserStore.fullName() || 'User' }}</h1>
        @if (currentUserStore.user()?.displayName) {
          <p class="text-muted mb-1">&#64;{{ currentUserStore.user()?.userName }}</p>
        }

        <!-- Tenant Info -->
        @if (currentUserStore.tenantName()) {
          <p class="text-muted mb-2">
            <svg class="sa-icon me-1" style="width: 14px; height: 14px;">
              <use href="/assets/icons/sprite.svg#briefcase"></use>
            </svg>
            {{ currentUserStore.tenantName() }}
          </p>
        }

        <!-- Roles badges -->
        @if (currentUserStore.roleNames().length > 0) {
          <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
            @for (roleName of currentUserStore.roleNames(); track roleName) {
              <span class="badge bg-primary-100 text-primary">{{ roleName }}</span>
            }
            @if (currentUserStore.isAdmin()) {
              <span class="badge bg-danger">Admin</span>
            }
          </div>
        }
      </div>

      <div class="profile-page-header-actions ms-md-auto mt-3 mt-md-0 d-flex">
        @if (permissionsService.canEditOwnProfile()) {
          <button class="btn btn-outline-default waves-effect me-2 d-flex" (click)="openModal(editProfileModal)">
            <svg class="sa-icon me-2 inline-text">
              <use href="/assets/icons/sprite.svg#edit-3"></use>
            </svg>
            Edit Profile
          </button>
        }
        <a href="javascript:void(0)" class="btn btn-outline-default d-flex waves-effect">
          <svg class="sa-icon me-2 inline-block">
            <use href="/assets/icons/sprite.svg#share-2"></use>
          </svg>
          Share
        </a>
      </div>
    </div>

    <ng-template #editProfileModal let-modal>
      <div class="modal-header">
        <h5 class="modal-title">Edit Profile</h5>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>

      <form [formGroup]="profileForm" (ngSubmit)="onSubmit(modal)" class="needs-validation" novalidate>
        <div class="modal-body">
          @if (errorMessage) {
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
              {{ errorMessage }}
              <button type="button" class="btn-close" (click)="errorMessage = null"></button>
            </div>
          }

          <div class="row mb-g">
            <div class="col-md-12">
              <h6 class="mb-3 text-muted">Personal Information</h6>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">First Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="firstName"
                         [class.is-invalid]="isInvalid('firstName')" [class.is-valid]="isValid('firstName')">
                  <div class="invalid-feedback">Please provide your first name.</div>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Last Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="lastName"
                         [class.is-invalid]="isInvalid('lastName')" [class.is-valid]="isValid('lastName')">
                  <div class="invalid-feedback">Please provide your last name.</div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Display Name</label>
                <input type="text" class="form-control" formControlName="displayName"
                       placeholder="How you want to be called">
              </div>
            </div>
          </div>

          <h6 class="mb-3 text-muted">Contact Information</h6>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" formControlName="email" readonly
                     [class.is-invalid]="isInvalid('email')">
              <small class="text-muted">Email cannot be changed here</small>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-control" formControlName="phone"
                     [class.is-valid]="isValid('phone')">
            </div>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Mobile</label>
              <input type="tel" class="form-control" formControlName="mobile"
                     [class.is-valid]="isValid('mobile')">
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">City</label>
              <input type="text" class="form-control" formControlName="city"
                     [class.is-valid]="isValid('city')">
            </div>
          </div>

          <h6 class="mb-3 text-muted">Preferences</h6>
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">Language</label>
              <select class="form-select" formControlName="preferredLanguage">
                <option value="">Select language</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Timezone</label>
              <select class="form-select" formControlName="preferredTimezone">
                <option value="">Select timezone</option>
                <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                <option value="America/New_York">New York (UTC-5)</option>
                <option value="America/Los_Angeles">Los Angeles (UTC-8)</option>
                <option value="Europe/London">London (UTC+0)</option>
                <option value="Europe/Paris">Paris (UTC+1)</option>
                <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Currency</label>
              <select class="form-select" formControlName="preferredCurrency">
                <option value="">Select currency</option>
                <option value="BRL">BRL - Brazilian Real</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" (click)="modal.dismiss()" [disabled]="isSaving">Cancel</button>
          <button type="submit" class="btn btn-primary d-flex align-items-center" [disabled]="isSaving">
            @if (isSaving) {
              <span class="spinner-border spinner-border-sm me-2"></span>
            }
            Save Changes
          </button>
        </div>
      </form>
    </ng-template>
  `,
  styles: `
    .profile-avatar-placeholder {
      width: 160px;
      height: 160px;
      font-size: 48px;
    }
  `
})
export class ProfileInfo implements OnInit {
  readonly currentUserStore = inject(CurrentUserStore);
  readonly permissionsService = inject(PermissionsService);
  private readonly fb = inject(FormBuilder);
  private readonly modalService = inject(NgbModal);
  private readonly usersService = inject(UsersService);

  profileForm!: FormGroup;
  isSaving = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const user = this.currentUserStore.user();

    this.profileForm = this.fb.group({
      firstName: [user?.firstName || '', Validators.required],
      lastName: [user?.lastName || '', Validators.required],
      displayName: [user?.displayName || ''],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: [user?.phone || ''],
      mobile: [user?.mobile || ''],
      city: [user?.city || ''],
      preferredLanguage: [user?.preferredLanguage || ''],
      preferredTimezone: [user?.preferredTimezone || ''],
      preferredCurrency: [user?.preferredCurrency || '']
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isValid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!(control && control.valid && (control.dirty || control.touched));
  }

  openModal(content: any): void {
    // Refresh form with current user data
    this.initForm();
    this.errorMessage = null;
    this.modalService.open(content, { size: 'lg' });
  }

  async onSubmit(modal: any): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.currentUserStore.user();
    if (!user) {
      this.errorMessage = 'User data not available';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    try {
      const formValue = this.profileForm.value;

      const updateRequest: UpdateUserRequest = {
        id: user.id,
        tenantId: user.tenantId,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        displayName: formValue.displayName || undefined,
        phone: formValue.phone || undefined,
        mobile: formValue.mobile || undefined,
        city: formValue.city || undefined,
        preferredLanguage: formValue.preferredLanguage || undefined,
        preferredTimezone: formValue.preferredTimezone || undefined,
        preferredCurrency: formValue.preferredCurrency || undefined
      };

      await firstValueFrom(this.usersService.updateUser(updateRequest));

      // Update local store
      this.currentUserStore.updateUserProfile({
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        displayName: formValue.displayName,
        phone: formValue.phone,
        mobile: formValue.mobile,
        city: formValue.city,
        preferredLanguage: formValue.preferredLanguage,
        preferredTimezone: formValue.preferredTimezone,
        preferredCurrency: formValue.preferredCurrency,
        fullName: `${formValue.firstName} ${formValue.lastName}`.trim()
      });

      modal.close();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      this.errorMessage = error?.error?.message || 'Failed to update profile. Please try again.';
    } finally {
      this.isSaving = false;
    }
  }
}
