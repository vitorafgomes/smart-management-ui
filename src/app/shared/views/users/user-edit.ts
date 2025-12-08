import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsersService } from '@core/services/api/identity-tenant/users.service';
import { RolesService } from '@core/services/api/identity-tenant/roles.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { UsersStore } from '@core/stores/identity-tenant/users/users.store';
import { User, Role } from '@core/models/domain/identity-tenant';
import { PagedResult } from '@core/models/common';
import { FilterRolesRequest } from '@core/models/useCases/identity-tenant';
import { JsonPatchBuilder } from '@core/utils/json-patch.util';
import { Subject, takeUntil, forkJoin, of, catchError } from 'rxjs';

@Component({
  selector: 'app-user-edit',
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
                <li class="breadcrumb-item active">Edit User</li>
              </ol>
            </nav>
            <h1 class="fs-xl fw-700 mb-0">Edit User</h1>
          </div>
        </div>

        @if (isLoading) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        } @else if (errorMessage) {
          <div class="alert alert-danger">{{ errorMessage }}</div>
        } @else {
          <!-- Edit Form Card -->
          <div class="row">
            <div class="col-lg-8">
              <div class="card shadow-1">
                <div class="card-header">
                  <h5 class="mb-0">
                    <svg class="sa-icon me-2">
                      <use href="/assets/icons/sprite.svg#user"></use>
                    </svg>
                    User Information
                  </h5>
                </div>
                <div class="card-body">
                  <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
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

                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <label class="form-label">Middle Name</label>
                        <input type="text" class="form-control" formControlName="middleName">
                      </div>
                      <div class="col-md-6 mb-3">
                        <label class="form-label">Display Name</label>
                        <input type="text" class="form-control" formControlName="displayName">
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label">Email Address <span class="text-danger">*</span></label>
                      <input type="email" class="form-control" formControlName="email"
                             [class.is-invalid]="isInvalid('email')">
                      <div class="invalid-feedback">Valid email is required.</div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label">Username</label>
                      <input type="text" class="form-control" formControlName="userName" readonly>
                      <div class="form-text">Username cannot be changed.</div>
                    </div>

                    <div class="row">
                      <div class="col-md-4 mb-3">
                        <label class="form-label">Phone Country Code</label>
                        <input type="text" class="form-control" formControlName="phoneCountryCode"
                               placeholder="+1">
                      </div>
                      <div class="col-md-8 mb-3">
                        <label class="form-label">Phone</label>
                        <input type="text" class="form-control" formControlName="phone">
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label">Mobile</label>
                      <input type="text" class="form-control" formControlName="mobile">
                    </div>

                    <hr class="my-4">
                    <h6 class="mb-3">Location</h6>

                    <div class="row">
                      <div class="col-md-4 mb-3">
                        <label class="form-label">Country Code</label>
                        <input type="text" class="form-control" formControlName="countryCode"
                               placeholder="US, BR, etc.">
                      </div>
                      <div class="col-md-4 mb-3">
                        <label class="form-label">State/Province</label>
                        <input type="text" class="form-control" formControlName="stateProvince">
                      </div>
                      <div class="col-md-4 mb-3">
                        <label class="form-label">City</label>
                        <input type="text" class="form-control" formControlName="city">
                      </div>
                    </div>

                    <hr class="my-4">
                    <h6 class="mb-3">Preferences</h6>

                    <div class="row">
                      <div class="col-md-4 mb-3">
                        <label class="form-label">Preferred Language</label>
                        <select class="form-select" formControlName="preferredLanguage">
                          <option value="">Select...</option>
                          <option value="en">English</option>
                          <option value="pt">Portuguese</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                      <div class="col-md-4 mb-3">
                        <label class="form-label">Preferred Timezone</label>
                        <select class="form-select" formControlName="preferredTimezone">
                          <option value="">Select...</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">America/New_York</option>
                          <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="Europe/Paris">Europe/Paris</option>
                          <option value="Asia/Tokyo">Asia/Tokyo</option>
                        </select>
                      </div>
                      <div class="col-md-4 mb-3">
                        <label class="form-label">Preferred Currency</label>
                        <select class="form-select" formControlName="preferredCurrency">
                          <option value="">Select...</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="BRL">BRL - Brazilian Real</option>
                          <option value="GBP">GBP - British Pound</option>
                        </select>
                      </div>
                    </div>

                    <hr class="my-4">
                    <h6 class="mb-3">Status</h6>

                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" formControlName="isActive" id="isActive">
                          <label class="form-check-label" for="isActive">Active User</label>
                        </div>
                      </div>
                      <div class="col-md-6 mb-3">
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" formControlName="isAdmin" id="isAdmin">
                          <label class="form-check-label" for="isAdmin">Administrator</label>
                        </div>
                      </div>
                    </div>

                    <hr class="my-4">
                    <h6 class="mb-3">Change Password</h6>
                    <p class="text-muted small mb-3">Leave blank to keep current password.</p>

                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <label class="form-label">New Password</label>
                        <input type="password" class="form-control" formControlName="password"
                               [class.is-invalid]="isInvalid('password')"
                               placeholder="Enter new password">
                        @if (editForm.get('password')?.hasError('minlength')) {
                          <div class="invalid-feedback">Password must be at least 8 characters.</div>
                        } @else if (editForm.get('password')?.hasError('pattern')) {
                          <div class="invalid-feedback">Password must contain uppercase, lowercase, number and special character.</div>
                        }
                      </div>
                      <div class="col-md-6 mb-3">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" class="form-control" formControlName="confirmPassword"
                               [class.is-invalid]="isInvalid('confirmPassword') || editForm.hasError('passwordMismatch')"
                               placeholder="Confirm new password">
                        @if (editForm.get('confirmPassword')?.hasError('required') && editForm.get('password')?.value) {
                          <div class="invalid-feedback">Please confirm the password.</div>
                        } @else if (editForm.hasError('passwordMismatch')) {
                          <div class="invalid-feedback">Passwords do not match.</div>
                        }
                      </div>
                    </div>

                    <hr>

                    <div class="d-flex justify-content-end gap-2">
                      <a routerLink="/users" class="btn btn-default">Cancel</a>
                      <button type="submit" class="btn btn-primary" [disabled]="isSaving">
                        @if (isSaving) {
                          <span class="spinner-border spinner-border-sm me-1"></span>
                        }
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <div class="card shadow-1 mb-4">
                <div class="card-header">
                  <h5 class="mb-0">
                    <svg class="sa-icon me-2">
                      <use href="/assets/icons/sprite.svg#info"></use>
                    </svg>
                    User Details
                  </h5>
                </div>
                <div class="card-body">
                  <ul class="list-unstyled small mb-0">
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-muted">User ID:</span>
                      <span class="text-truncate ms-2" style="max-width: 150px;" title="{{ user?.id }}">{{ user?.id }}</span>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-muted">Created:</span>
                      <span>{{ user?.createdAt | date:'short' }}</span>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-muted">Last Updated:</span>
                      <span>{{ user?.updatedAt | date:'short' }}</span>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-muted">Last Login:</span>
                      <span>{{ user?.lastLoginAt | date:'short' }}</span>
                    </li>
                    <li class="d-flex justify-content-between">
                      <span class="text-muted">Email Verified:</span>
                      <span>
                        @if (user?.isEmailVerified) {
                          <span class="badge bg-success-100 text-success">Yes</span>
                        } @else {
                          <span class="badge bg-warning-100 text-warning">No</span>
                        }
                      </span>
                    </li>
                  </ul>
                  <hr class="my-3">
                  <div class="d-grid">
                    <button type="button" class="btn btn-outline-warning btn-sm"
                            (click)="onResync()" [disabled]="isResyncing">
                      @if (isResyncing) {
                        <span class="spinner-border spinner-border-sm me-1"></span>
                      } @else {
                        <svg class="sa-icon me-1" style="width: 14px; height: 14px;">
                          <use href="/assets/icons/sprite.svg#refresh-cw"></use>
                        </svg>
                      }
                      Resync Event
                    </button>
                    @if (resyncMessage) {
                      <div class="mt-2 small" [class.text-success]="resyncSuccess" [class.text-danger]="!resyncSuccess">
                        {{ resyncMessage }}
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="card shadow-1 mb-4">
                <div class="card-header">
                  <h5 class="mb-0">
                    <svg class="sa-icon me-2">
                      <use href="/assets/icons/sprite.svg#shield"></use>
                    </svg>
                    Security
                  </h5>
                </div>
                <div class="card-body">
                  <ul class="list-unstyled small mb-0">
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-muted">2FA Enabled:</span>
                      <span>
                        @if (user?.twoFactorEnabled) {
                          <span class="badge bg-success-100 text-success">Yes</span>
                        } @else {
                          <span class="badge bg-secondary-100 text-secondary">No</span>
                        }
                      </span>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-muted">Failed Logins:</span>
                      <span>{{ user?.failedLoginAttempts || 0 }}</span>
                    </li>
                    <li class="d-flex justify-content-between">
                      <span class="text-muted">Password Changed:</span>
                      <span>{{ user?.passwordChangedAt | date:'short' }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="card shadow-1">
                <div class="card-header">
                  <h5 class="mb-0">
                    <svg class="sa-icon me-2">
                      <use href="/assets/icons/sprite.svg#users"></use>
                    </svg>
                    Roles
                  </h5>
                </div>
                <div class="card-body">
                  @if (user?.userRoles?.length) {
                    <div class="d-flex flex-wrap gap-2">
                      @for (userRole of user!.userRoles!; track userRole.roleId) {
                        <span class="badge bg-primary-100 text-primary">
                          {{ userRole.roleName }}
                          @if (userRole.isSystemRole) {
                            <span class="badge bg-info-100 text-info ms-1">System</span>
                          }
                        </span>
                      }
                    </div>
                  } @else {
                    <p class="text-muted small mb-0">No roles assigned.</p>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: ``
})
export class UserEdit implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly tenantStorage = inject(TenantStorageService);
  private readonly usersStore = inject(UsersStore);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  editForm!: FormGroup;
  user: User | null = null;
  availableRoles: Role[] = [];
  selectedRoleIds: string[] = [];
  isLoading = true;
  isSaving = false;
  isResyncing = false;
  errorMessage = '';
  resyncMessage = '';
  resyncSuccess = false;
  userId = '';

  // Password pattern: at least 1 uppercase, 1 lowercase, 1 number, 1 special char
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

  ngOnInit(): void {
    this.initForm();
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUser();
    } else {
      this.errorMessage = 'User ID not provided';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      middleName: [''],
      displayName: [''],
      email: ['', [Validators.required, Validators.email]],
      userName: [''],
      phoneCountryCode: [''],
      phone: [''],
      mobile: [''],
      countryCode: [''],
      stateProvince: [''],
      city: [''],
      preferredLanguage: [''],
      preferredTimezone: [''],
      preferredCurrency: [''],
      isActive: [true],
      isAdmin: [false],
      password: ['', [
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern)
      ]],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Custom validator to check if password and confirmPassword match
   * Only validates if password field has a value
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    // Only validate if password has a value
    if (password?.value && confirmPassword?.value !== password.value) {
      return { passwordMismatch: true };
    }
    // If password is filled but confirmPassword is empty
    if (password?.value && !confirmPassword?.value) {
      confirmPassword?.setErrors({ required: true });
    }
    return null;
  }

  private loadUser(): void {
    const tenant = this.tenantStorage.getLastTenant();
    if (!tenant) {
      this.errorMessage = 'No tenant selected. Please select a tenant first.';
      this.isLoading = false;
      return;
    }

    // OTIMIZAÇÃO: Primeiro verifica se o usuário já está na store (cache)
    const cachedUser = this.usersStore.entityMap()[this.userId];

    if (cachedUser) {
      // Usuário já está no cache - usa diretamente sem fazer chamada à API
      console.log('[PERF] User loaded from store cache (no API call):', cachedUser.userName);
      this.user = cachedUser;
      this.selectedRoleIds = cachedUser.userRoles?.map(ur => ur.roleId) || [];
      this.patchForm(cachedUser);
      this.isLoading = false;
      this.cdr.detectChanges();

      // Carrega roles em background (não bloqueia a UI)
      this.loadRolesInBackground(tenant.id);
    } else {
      // Usuário não está no cache - busca da API
      console.log('[PERF] User not in cache, fetching from API');
      this.loadUserFromApi(tenant.id);
    }
  }

  /**
   * Carrega roles em background (não bloqueia a UI)
   */
  private loadRolesInBackground(tenantId: string): void {
    const rolesRequest: FilterRolesRequest = {
      tenantId,
      isActive: true,
      pageFilter: { pageNumber: 1, pageSize: 100 }
    };

    this.rolesService.getRolesByFilters(rolesRequest)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Error loading roles (non-blocking):', err);
          return of({
            entries: [],
            pageNumber: 1,
            pageSize: 100,
            pageSizeLimit: 100,
            totalPages: 0,
            totalResults: 0
          } as PagedResult<Role>);
        })
      )
      .subscribe({
        next: (roles) => {
          this.availableRoles = roles.entries || [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Carrega usuário da API (fallback quando não está no cache)
   */
  private loadUserFromApi(tenantId: string): void {
    const rolesRequest: FilterRolesRequest = {
      tenantId,
      isActive: true,
      pageFilter: { pageNumber: 1, pageSize: 100 }
    };

    forkJoin({
      user: this.usersService.getUserById(this.userId),
      roles: this.rolesService.getRolesByFilters(rolesRequest).pipe(
        catchError(err => {
          console.error('Error loading roles (non-blocking):', err);
          return of({ entries: [], pageNumber: 1, pageSize: 100, pageSizeLimit: 100, totalPages: 0, totalResults: 0 } as PagedResult<Role>);
        })
      )
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ user, roles }) => {
          console.log('[PERF] User loaded from API:', user.userName);
          this.user = user;
          this.availableRoles = roles.entries || [];
          this.selectedRoleIds = user.userRoles?.map(ur => ur.roleId) || [];
          this.patchForm(user);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading user:', err);
          this.errorMessage = 'Failed to load user. Please try again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private patchForm(user: User): void {
    this.editForm.patchValue({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      middleName: user.middleName || '',
      displayName: user.displayName || '',
      email: user.email || '',
      userName: user.userName || '',
      phoneCountryCode: user.phoneCountryCode || '',
      phone: user.phone || '',
      mobile: user.mobile || '',
      countryCode: user.countryCode || '',
      stateProvince: user.stateProvince || '',
      city: user.city || '',
      preferredLanguage: user.preferredLanguage || '',
      preferredTimezone: user.preferredTimezone || '',
      preferredCurrency: user.preferredCurrency || '',
      isActive: user.isActive,
      isAdmin: user.isAdmin
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.editForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRoleIds.includes(roleId);
  }

  /**
   * Resync user event - republish to RabbitMQ
   */
  onResync(): void {
    if (!this.userId) return;

    this.isResyncing = true;
    this.resyncMessage = '';

    this.usersService.resyncUser(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isResyncing = false;
          this.resyncSuccess = response.success;
          this.resyncMessage = response.message;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error resyncing user:', err);
          this.isResyncing = false;
          this.resyncSuccess = false;
          this.resyncMessage = err.error?.message || 'Failed to resync user event.';
          this.cdr.detectChanges();
        }
      });
  }

  toggleRole(roleId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedRoleIds.includes(roleId)) {
        this.selectedRoleIds = [...this.selectedRoleIds, roleId];
      }
    } else {
      this.selectedRoleIds = this.selectedRoleIds.filter(id => id !== roleId);
    }
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.value;
    const patchDocument = this.buildPatchDocument(formValue);

    // DEBUG: Ver o que está sendo enviado
    console.log('Patch Document:', JSON.stringify(patchDocument, null, 2));

    // Se não houver alterações, volta para a lista sem fazer requisição
    if (patchDocument.length === 0) {
      this.router.navigate(['/users']);
      return;
    }

    this.isSaving = true;

    this.usersService.updateUserPatch(this.userId, patchDocument)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/users']);
        },
        error: (err) => {
          console.error('Error updating user:', err);
          console.error('Error body:', JSON.stringify(err.error, null, 2));
          if (err.error?.errors) {
            console.error('Validation errors:', JSON.stringify(err.error.errors, null, 2));
          }
          this.isSaving = false;
          // Extract error message from various API response formats
          let errorMsg = 'Failed to update user. Please try again.';
          if (err.error?.errors && Array.isArray(err.error.errors)) {
            errorMsg = err.error.errors.join(', ');
          } else if (err.error?.errors && typeof err.error.errors === 'object') {
            errorMsg = Object.values(err.error.errors).flat().join(', ');
          } else if (err.error?.message) {
            errorMsg = err.error.message;
          } else if (err.error?.title) {
            errorMsg = err.error.title;
          }
          this.errorMessage = errorMsg;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Campos editáveis do usuário para comparação
   */
  private readonly editableFields: (keyof User)[] = [
    'firstName', 'lastName', 'middleName', 'displayName', 'email',
    'phoneCountryCode', 'phone', 'mobile', 'countryCode', 'stateProvince',
    'city', 'preferredLanguage', 'preferredTimezone', 'preferredCurrency',
    'isActive', 'isAdmin'
  ];

  private buildPatchDocument(formValue: Record<string, unknown>) {
    if (!this.user) {
      return [];
    }

    // Usa o utilitário JsonPatchBuilder para comparar apenas os campos editáveis
    const patchDocument = JsonPatchBuilder.compareFields(
      this.user as unknown as Record<string, unknown>,
      formValue,
      this.editableFields as string[]
    );

    // Add password fields if password was provided (for changing password)
    if (formValue['password'] && formValue['confirmPassword']) {
      patchDocument.push({
        op: 'replace',
        path: '/password',
        value: formValue['password']
      });
      patchDocument.push({
        op: 'replace',
        path: '/confirmPassword',
        value: formValue['confirmPassword']
      });
    }

    return patchDocument;
  }
}
