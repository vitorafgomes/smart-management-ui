import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { UsersFacade } from '../../application/users-facade';

@Component({
  selector: 'app-user-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormPage implements OnInit {
  protected readonly facade = inject(UsersFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  private readonly userId = this.route.snapshot.paramMap.get('id');

  protected readonly isEdit = this.userId !== null;
  protected readonly selectedRoleIds = signal<readonly string[]>([]);
  protected readonly title = computed(() => (this.isEdit ? 'Edit user' : 'New user'));

  protected readonly form = this.formBuilder.nonNullable.group({
    userName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phoneNumber: [''],
    isActive: [true],
    emailVerified: [false],
  });

  async ngOnInit(): Promise<void> {
    if (!this.userId) {
      this.facade.startNew();
      await this.facade.loadRoles();
      return;
    }

    // The record is fetched before anything else: `loadUser` raises the loading flag
    // synchronously, which keeps the form off screen until it holds the real values. Loading the
    // roles first would render an empty form the user could start typing into, only to have the
    // patch overwrite them.
    await this.facade.loadUser(this.userId);
    await this.facade.loadRoles();

    const user = this.facade.selected();
    if (user) {
      this.form.patchValue({
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber ?? '',
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      });
      this.selectedRoleIds.set(user.roleIds);
    }
  }

  protected isInvalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  protected hasRole(roleId: string): boolean {
    return this.selectedRoleIds().includes(roleId);
  }

  protected toggleRole(roleId: string): void {
    this.selectedRoleIds.update((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      userName: value.userName.trim(),
      email: value.email.trim(),
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      phoneNumber: value.phoneNumber.trim() || undefined,
      isActive: value.isActive,
      emailVerified: value.emailVerified,
      roleIds: this.selectedRoleIds(),
    };

    const saved = this.userId
      ? await this.facade.update(this.userId, payload)
      : await this.facade.create(payload);

    if (saved) {
      await this.router.navigate(['../'], { relativeTo: this.route });
      await this.facade.load();
    }
  }
}
