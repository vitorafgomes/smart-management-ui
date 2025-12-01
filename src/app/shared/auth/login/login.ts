import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantAutocompleteComponent } from '../../components/tenant-autocomplete/tenant-autocomplete.component';
import { KeycloakAuthService } from '@core/services/auth/keycloak-auth.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { TenantSuggestion } from '@core/models/domain/identity-tenant/tenants/tenant-suggestion';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TenantAutocompleteComponent
  ],
  template: `
    <div class="row justify-content-center">
      <div class="col-11 col-md-8 col-lg-6 col-xl-4">
        <div class="login-card p-4 p-md-6 bg-dark bg-opacity-50 translucent-dark rounded-4">
          <h2 class="text-center mb-4">Login</h2>
          <p class="text-center text-white opacity-50 mb-4">Keep it all together and you'll be free</p>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <!-- Email/Username Field -->
            <div class="mb-3">
              <label for="username" class="form-label">Email or Username</label>
              <input type="text"
                     class="form-control form-control-lg text-white bg-dark border-light border-opacity-25 bg-opacity-25"
                     [class.is-invalid]="isFieldInvalid('username')"
                     id="username"
                     formControlName="username"
                     placeholder="Enter your email or username"
                     autocomplete="username">
              @if (isFieldInvalid('username')) {
                <div class="invalid-feedback">This field is required</div>
              }
            </div>

            <!-- Password Field -->
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <div class="position-relative">
                <input [type]="showPassword ? 'text' : 'password'"
                       class="form-control form-control-lg text-white bg-dark border-light border-opacity-25 bg-opacity-25 pe-5"
                       [class.is-invalid]="isFieldInvalid('password')"
                       id="password"
                       formControlName="password"
                       placeholder="Enter your password"
                       autocomplete="current-password">
                <svg width="20" height="20"
                     stroke="rgba(255,255,255,0.5)"
                     fill="none"
                     class="position-absolute"
                     style="right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer;"
                     (click)="togglePasswordVisibility()">
                  @if (showPassword) {
                    <use href="/assets/icons/sprite.svg#eye-off"></use>
                  } @else {
                    <use href="/assets/icons/sprite.svg#eye"></use>
                  }
                </svg>
              </div>
              @if (isFieldInvalid('password')) {
                <div class="text-danger small mt-1">This field is required</div>
              }
            </div>

            <!-- Tenant Field with Autocomplete -->
            <div class="mb-4">
              <label for="tenant" class="form-label">Tenant/Organization Code</label>
              <app-tenant-autocomplete
                formControlName="tenant"
                [isInvalid]="isFieldInvalid('tenant')">
              </app-tenant-autocomplete>
              @if (isFieldInvalid('tenant')) {
                <div class="text-danger small mt-1">Please select your organization</div>
              }
              <div class="form-text text-white opacity-50">
                Type at least 3 characters to search for your organization
              </div>
            </div>

            <!-- Login Button -->
            <div class="d-grid mb-3">
              <button type="submit"
                      class="btn btn-primary btn-lg bg-primary bg-opacity-75"
                      [disabled]="isSubmitting">
                @if (isSubmitting) {
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing In...
                } @else {
                  Sign In
                }
              </button>
            </div>

            <!-- Error Message -->
            @if (loginError) {
              <div class="alert alert-danger mb-3">
                <small>{{ loginError }}</small>
              </div>
            }

            <!-- Selected Tenant Info -->
            @if (selectedTenant) {
              <div class="alert alert-info alert-dismissible fade show mb-3" role="alert">
                <small>
                  <strong>Organization:</strong> {{ selectedTenant.companyName }}
                  <br>
                  <span class="opacity-75">Realm: {{ selectedTenant.keycloakRealmName }}</span>
                </small>
              </div>
            }

            <!-- Forgot Password Link -->
            <div class="text-center mb-4">
              <a routerLink="/auth/forgot-password" class="text-decoration-none small text-white">Forgot Password?</a>
            </div>
          </form>

          <!-- Register Link -->
          <div class="opacity-75 text-center mt-3">
            Don't have an account?
            <a routerLink="/auth/register" class="text-decoration-underline text-white fw-500">Register here</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(KeycloakAuthService);
  private readonly tenantStorage = inject(TenantStorageService);

  loginForm!: FormGroup;
  showPassword = false;
  isSubmitting = false;
  loginError: string | null = null;
  selectedTenant: TenantSuggestion | null = null;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      tenant: ['', [Validators.required]]
    });

    // Watch for tenant selection changes
    this.loginForm.get('tenant')?.valueChanges.subscribe(value => {
      this.selectedTenant = value as TenantSuggestion | null;
      this.loginError = null;
    });

    // Load last selected tenant
    const lastTenant = this.tenantStorage.getLastTenant();
    if (lastTenant) {
      this.selectedTenant = lastTenant;
      this.loginForm.patchValue({ tenant: lastTenant });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.selectedTenant) {
      this.loginError = 'Please select your organization';
      return;
    }

    this.isSubmitting = true;
    this.loginError = null;

    try {
      const formValue = this.loginForm.value;

      // Authenticate via Keycloak API
      const success = await this.authService.login({
        username: formValue.username,
        password: formValue.password,
        realm: this.selectedTenant.keycloakRealmName
      });

      if (success) {
        // Get redirect URL or default to dashboard
        const redirectUrl = sessionStorage.getItem('redirectUrl') || '/dashboards/control-center';
        sessionStorage.removeItem('redirectUrl');

        // Navigate to the redirect URL
        this.router.navigateByUrl(redirectUrl);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      this.loginError = error.message || 'Authentication failed. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
