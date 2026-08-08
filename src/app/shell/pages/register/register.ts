import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthStateService } from '@shared-kernel/auth/auth-state.service';

/** Group-level, because a confirmation only means anything next to the password it repeats. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmPassword')?.value;

  return password === confirmation ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected async submit(): Promise<void> {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(this.invalidFormMessage());
      return;
    }

    const { name, email, password } = this.form.getRawValue();

    const result = this.authState.register({ name, email, password });
    if (!result.ok) {
      this.error.set(result.reason);
      return;
    }

    await this.router.navigate(['/']);
  }

  /** Turns the validator that fired into the one sentence worth showing above the form. */
  private invalidFormMessage(): string {
    const { email, password, confirmPassword } = this.form.controls;

    if (email.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (password.hasError('minlength')) {
      return 'Use a password of at least 8 characters.';
    }

    if (this.form.hasError('passwordMismatch') && !confirmPassword.hasError('required')) {
      return 'The two passwords do not match.';
    }

    return 'Fill in every field to create your account.';
  }
}
