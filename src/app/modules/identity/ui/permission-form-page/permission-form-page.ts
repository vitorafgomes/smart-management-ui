import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PermissionsFacade } from '../../application/permissions-facade';
import {
  isPermissionModule,
  PERMISSION_CODE_PATTERN,
  PERMISSION_MODULES,
  PermissionModule,
} from '../../domain/permission';

@Component({
  selector: 'app-permission-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './permission-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionFormPage implements OnInit {
  protected readonly facade = inject(PermissionsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  private readonly permissionId = this.route.snapshot.paramMap.get('id');

  protected readonly isEdit = this.permissionId !== null;
  protected readonly modules = PERMISSION_MODULES;
  protected readonly title = computed(() => (this.isEdit ? 'Edit permission' : 'New permission'));

  protected readonly form = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(PERMISSION_CODE_PATTERN)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    module: ['', Validators.required],
    description: [''],
    isActive: [true],
  });

  async ngOnInit(): Promise<void> {
    if (!this.permissionId) {
      this.facade.startNew();
      return;
    }

    await this.facade.loadPermission(this.permissionId);

    const permission = this.facade.selected();
    if (permission) {
      this.form.patchValue({
        code: permission.code,
        name: permission.name,
        module: permission.module,
        description: permission.description ?? '',
        isActive: permission.isActive,
      });
    }
  }

  protected isInvalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    if (!isPermissionModule(value.module)) {
      return;
    }

    const payload = {
      code: value.code.trim(),
      name: value.name.trim(),
      module: value.module as PermissionModule,
      description: value.description.trim() || undefined,
      isActive: value.isActive,
    };

    const saved = this.permissionId
      ? await this.facade.update(this.permissionId, payload)
      : await this.facade.create(payload);

    if (saved) {
      await this.router.navigate(['../'], { relativeTo: this.route });
      await this.facade.load();
    }
  }
}
