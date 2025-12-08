import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsersService } from '@core/services/api/identity-tenant/users.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { IdentityTenantFacade } from '@core/stores/identity-tenant/identity-tenant.facade';
import { AddUserRequest } from '@core/models/useCases/identity-tenant';

@Component({
  selector: 'app-user-invite',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="main-content">
      <div class="container-fluid">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-1">
                <li class="breadcrumb-item"><a routerLink="/users">Users</a></li>
                <li class="breadcrumb-item active">Invite User</li>
              </ol>
            </nav>
            <h1 class="fs-xl fw-700 mb-0">Invite New User</h1>
          </div>
        </div>

        <!-- Invite Form Card -->
        <div class="row">
          <div class="col-lg-8">
            <div class="card shadow-1">
              <div class="card-header">
                <h5 class="mb-0">
                  <svg class="sa-icon me-2">
                    <use href="/assets/icons/sprite.svg#user-plus"></use>
                  </svg>
                  User Information
                </h5>
              </div>
              <div class="card-body">
                <form [formGroup]="inviteForm" (ngSubmit)="onSubmit()">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">First Name <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" formControlName="firstName"
                             [class.is-invalid]="isInvalid('firstName')">
                      <div class="invalid-feedback">First name is required.</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Last Name <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" formControlName="lastName"
                             [class.is-invalid]="isInvalid('lastName')">
                      <div class="invalid-feedback">Last name is required.</div>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Email Address <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" formControlName="email"
                           [class.is-invalid]="isInvalid('email')"
                           placeholder="user@example.com">
                    <div class="invalid-feedback">Valid email is required.</div>
                    <div class="form-text">An invitation email will be sent to this address.</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Username <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" formControlName="username"
                           [class.is-invalid]="isInvalid('username')"
                           placeholder="Enter username">
                    <div class="invalid-feedback">Username is required.</div>
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Password <span class="text-danger">*</span></label>
                      <input type="password" class="form-control" formControlName="password"
                             [class.is-invalid]="isInvalid('password')"
                             placeholder="Enter password">
                      @if (inviteForm.get('password')?.hasError('required')) {
                        <div class="invalid-feedback">Password is required.</div>
                      } @else if (inviteForm.get('password')?.hasError('minlength')) {
                        <div class="invalid-feedback">Password must be at least 8 characters.</div>
                      } @else if (inviteForm.get('password')?.hasError('pattern')) {
                        <div class="invalid-feedback">Password must contain uppercase, lowercase, number and special character.</div>
                      }
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Confirm Password <span class="text-danger">*</span></label>
                      <input type="password" class="form-control" formControlName="confirmPassword"
                             [class.is-invalid]="isInvalid('confirmPassword') || inviteForm.hasError('passwordMismatch')"
                             placeholder="Confirm password">
                      @if (inviteForm.get('confirmPassword')?.hasError('required')) {
                        <div class="invalid-feedback">Please confirm the password.</div>
                      } @else if (inviteForm.hasError('passwordMismatch')) {
                        <div class="invalid-feedback">Passwords do not match.</div>
                      }
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Role <span class="text-danger">*</span></label>
                      <select class="form-select" formControlName="roleId"
                              [class.is-invalid]="isInvalid('roleId')">
                        <option value="">Select a role...</option>
                        @for (role of roles(); track role.id) {
                          <option [value]="role.id">{{ role.name }}</option>
                        }
                      </select>
                      <div class="invalid-feedback">Please select a role.</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Groups</label>
                      <select class="form-select" formControlName="groupIds" multiple>
                        @for (group of groups(); track group.id) {
                          <option [value]="group.id">{{ group.name }}</option>
                        }
                      </select>
                      <div class="form-text">Hold Ctrl/Cmd to select multiple.</div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" formControlName="sendInvite" id="sendInvite">
                      <label class="form-check-label" for="sendInvite">
                        Send invitation email immediately
                      </label>
                    </div>
                  </div>

                  <hr>

                  <div class="d-flex justify-content-end gap-2">
                    <a routerLink="/users" class="btn btn-default">Cancel</a>
                    <button type="submit" class="btn btn-primary" [disabled]="isSaving">
                      @if (isSaving) {
                        <span class="spinner-border spinner-border-sm me-1"></span>
                      }
                      Send Invitation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card shadow-1">
              <div class="card-header">
                <h5 class="mb-0">
                  <svg class="sa-icon me-2">
                    <use href="/assets/icons/sprite.svg#info"></use>
                  </svg>
                  About Invitations
                </h5>
              </div>
              <div class="card-body">
                <p class="text-muted small mb-3">
                  When you invite a user, they will receive an email with instructions to set up their account.
                </p>
                <ul class="list-unstyled small text-muted">
                  <li class="mb-2">
                    <svg class="sa-icon me-2 text-success">
                      <use href="/assets/icons/sprite.svg#check"></use>
                    </svg>
                    Invitation expires in 7 days
                  </li>
                  <li class="mb-2">
                    <svg class="sa-icon me-2 text-success">
                      <use href="/assets/icons/sprite.svg#check"></use>
                    </svg>
                    User will set their own password
                  </li>
                  <li class="mb-2">
                    <svg class="sa-icon me-2 text-success">
                      <use href="/assets/icons/sprite.svg#check"></use>
                    </svg>
                    You can resend invitations later
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class UserInvite implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly tenantStorage = inject(TenantStorageService);
  private readonly facade = inject(IdentityTenantFacade);

  // Roles and Groups from Store
  readonly roles = this.facade.activeRoles;
  readonly groups = this.facade.activeGroups;

  inviteForm: FormGroup;
  isSaving = false;
  errorMessage = '';

  // Password pattern: at least 1 uppercase, 1 lowercase, 1 number, 1 special char
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

  constructor() {
    this.inviteForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern)
      ]],
      confirmPassword: ['', Validators.required],
      roleId: ['', Validators.required],
      groupIds: [[]],
      sendInvite: [true]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const tenant = this.tenantStorage.getLastTenant();
    if (tenant) {
      // Load roles if not already loaded
      if (this.roles().length === 0) {
        this.facade.loadRoles({
          tenantId: tenant.id,
          isActive: true,
          pageNumber: 1,
          pageSize: 100
        });
      }
      // Load groups if not already loaded
      if (this.groups().length === 0) {
        this.facade.loadGroups({
          tenantId: tenant.id,
          isActive: true,
          pageNumber: 1,
          pageSize: 100
        });
      }
    }
  }

  /**
   * Custom validator to check if password and confirmPassword match
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  isInvalid(controlName: string): boolean {
    const control = this.inviteForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    const tenant = this.tenantStorage.getLastTenant();
    if (!tenant) {
      this.errorMessage = 'No tenant selected. Please select a tenant first.';
      return;
    }

    const formValue = this.inviteForm.value;

    // Determine if selected role is admin
    const selectedRole = this.roles().find(r => r.id === formValue.roleId);
    const isAdminRole = selectedRole?.isSystemRole && selectedRole?.name?.toLowerCase() === 'admin';

    const request: AddUserRequest = {
      tenantId: tenant.id,
      email: formValue.email,
      username: formValue.username,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      roleId: formValue.roleId,
      groupIds: formValue.groupIds?.length > 0 ? formValue.groupIds : undefined,
      isAdmin: isAdminRole ?? false,
      isActive: true
    };

    this.isSaving = true;
    this.errorMessage = '';

    this.usersService.addUser(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/users']);
      },
      error: (err: { error?: { errors?: string[] | Record<string, string[]>; message?: string } }) => {
        console.error('Error creating user:', err);
        this.isSaving = false;
        // Extract error message
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          this.errorMessage = err.error.errors.join(', ');
        } else if (err.error?.errors && typeof err.error.errors === 'object') {
          this.errorMessage = Object.values(err.error.errors).flat().join(', ');
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Failed to create user. Please try again.';
        }
      }
    });
  }
}
