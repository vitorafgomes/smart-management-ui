import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthStateService } from '@shared-kernel/auth/auth-state.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected async submit(): Promise<void> {
    this.error.set(null);

    const result = this.authState.login(this.form.getRawValue());
    if (!result.ok) {
      this.error.set(result.reason);
      return;
    }

    await this.router.navigate(['/']);
  }
}
