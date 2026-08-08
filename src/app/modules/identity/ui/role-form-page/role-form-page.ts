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

import { RolesFacade } from '../../application/roles-facade';
import { PERMISSION_MODULES } from '../../domain/permission';

@Component({
  selector: 'app-role-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './role-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleFormPage implements OnInit {
  protected readonly facade = inject(RolesFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  private readonly roleId = this.route.snapshot.paramMap.get('id');

  protected readonly isEdit = this.roleId !== null;
  protected readonly selectedCodes = signal<readonly string[]>([]);
  protected readonly title = computed(() => (this.isEdit ? 'Edit role' : 'New role'));

  /** The permission picker is grouped by module so a long catalogue stays readable. */
  protected readonly groupedPermissions = computed(() =>
    PERMISSION_MODULES.map((module) => ({
      module,
      permissions: this.facade.permissions().filter((permission) => permission.module === module),
    })).filter((group) => group.permissions.length > 0),
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    isActive: [true],
    isDefault: [false],
  });

  async ngOnInit(): Promise<void> {
    if (!this.roleId) {
      this.facade.startNew();
      await this.facade.loadPermissions();
      return;
    }

    // Same ordering as the user form: the record first, so the loading state hides a form that
    // does not hold its values yet.
    await this.facade.loadRole(this.roleId);
    await this.facade.loadPermissions();

    const role = this.facade.selected();
    if (role) {
      this.form.patchValue({
        name: role.name,
        description: role.description ?? '',
        isActive: role.isActive,
        isDefault: role.isDefault,
      });
      this.selectedCodes.set(role.permissionCodes);
    }
  }

  protected isInvalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  protected hasPermission(code: string): boolean {
    return this.selectedCodes().includes(code);
  }

  protected togglePermission(code: string): void {
    this.selectedCodes.update((current) =>
      current.includes(code) ? current.filter((entry) => entry !== code) : [...current, code],
    );
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      isActive: value.isActive,
      isDefault: value.isDefault,
      permissionCodes: this.selectedCodes(),
    };

    const saved = this.roleId
      ? await this.facade.update(this.roleId, payload)
      : await this.facade.create(payload);

    if (saved) {
      await this.router.navigate(['../'], { relativeTo: this.route });
      await this.facade.load();
    }
  }
}
