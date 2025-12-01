import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { SignupService } from '@core/services/api/identity-tenant';
import { SignUpRequest } from '@core/models/useCases/identity-tenant';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface RegistrationStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  registerForm!: FormGroup;
  showTenantField = false;
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  showLoadingOverlay = false;
  registrationError: string | null = null;

  registrationSteps: RegistrationStep[] = [
    { id: 'tenant', label: 'Creating organization...', status: 'pending' },
    { id: 'roles', label: 'Configuring permissions...', status: 'pending' },
    { id: 'user', label: 'Creating user account...', status: 'pending' }
  ];

  countries: Country[] = [
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱' },
    { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  ];

  constructor(
    private fb: FormBuilder,
    private signupService: SignupService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      tenant: [''],
      countryCode: [''],
      terms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
    return valid ? null : { passwordStrength: true };
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleTenantField(): void {
    this.showTenantField = !this.showTenantField;
    if (!this.showTenantField) {
      this.registerForm.get('tenant')?.setValue('');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private apiResponseReceived = false;

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.showLoadingOverlay = true;
    this.registrationError = null;
    this.apiResponseReceived = false;
    this.resetSteps();

    const formValue = this.registerForm.value;
    const request: SignUpRequest = {
      userName: formValue.userName,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      tenant: formValue.tenant || undefined,
      countryCode: formValue.countryCode || undefined
    };

    // Start the visual progress with 4 seconds per step
    this.runStepsSequence();

    this.signupService.signUp(request).subscribe({
      next: () => {
        this.apiResponseReceived = true;
        // Will be handled by runStepsSequence when it reaches the last step
      },
      error: (error) => {
        this.apiResponseReceived = true;
        this.handleRegistrationError(error);
      }
    });
  }

  private resetSteps(): void {
    this.registrationSteps = [
      { id: 'tenant', label: 'Creating organization...', status: 'pending' },
      { id: 'roles', label: 'Configuring permissions...', status: 'pending' },
      { id: 'user', label: 'Creating user account...', status: 'pending' }
    ];
  }

  private runStepsSequence(): void {
    // Step 1: Creating organization (4 seconds)
    this.updateStepStatus('tenant', 'in_progress');

    setTimeout(() => {
      // Check for error - if error occurred during this step, mark it and stop
      if (this.registrationError) {
        this.updateStepStatus('tenant', 'error');
        return;
      }

      this.updateStepStatus('tenant', 'completed');
      // Step 2: Configuring permissions (4 seconds)
      this.updateStepStatus('roles', 'in_progress');

      setTimeout(() => {
        // Check for error - if error occurred during this step, mark it and stop
        if (this.registrationError) {
          this.updateStepStatus('roles', 'error');
          return;
        }

        this.updateStepStatus('roles', 'completed');
        // Step 3: Creating user account (waits for API response)
        this.updateStepStatus('user', 'in_progress');

        // Check if API already responded, otherwise wait
        this.waitForApiAndComplete();
      }, 4000);
    }, 4000);
  }

  private waitForApiAndComplete(): void {
    // Check for error
    if (this.registrationError) {
      this.updateStepStatus('user', 'error');
      return;
    }

    if (this.apiResponseReceived) {
      // API already responded successfully
      this.updateStepStatus('user', 'completed');
      setTimeout(() => {
        this.isSubmitting = false;
        this.showLoadingOverlay = false;
        this.router.navigate(['/auth/login']);
      }, 500);
    } else {
      // Wait a bit and check again
      setTimeout(() => this.waitForApiAndComplete(), 200);
    }
  }

  private updateStepStatus(stepId: string, status: 'pending' | 'in_progress' | 'completed' | 'error'): void {
    // Create new array reference to trigger Angular change detection
    this.registrationSteps = this.registrationSteps.map(step =>
      step.id === stepId ? { ...step, status } : step
    );
    // Force change detection for setTimeout callbacks
    this.cdr.detectChanges();
  }

  private completeAllSteps(): void {
    this.registrationSteps.forEach(step => {
      step.status = 'completed';
    });
  }

  private handleRegistrationError(error: any): void {
    console.error('Registration failed:', error);
    this.registrationError = error?.error?.message || 'Registration failed. Please try again.';
    this.isSubmitting = false;
    this.cdr.detectChanges();
  }

  closeLoadingOverlay(): void {
    this.showLoadingOverlay = false;
    this.registrationError = null;
    this.resetSteps();
  }

  get f() {
    return this.registerForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['email']) return 'Please enter a valid email';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    if (field.errors['passwordStrength']) return 'Password must contain uppercase, lowercase, number and special character';

    return '';
  }
}
