import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-role-create',
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
                <li class="breadcrumb-item"><a routerLink="/roles">Roles</a></li>
                <li class="breadcrumb-item active">Create Role</li>
              </ol>
            </nav>
            <h1 class="fs-xl fw-700 mb-0">Create New Role</h1>
          </div>
        </div>

        <!-- Create Form -->
        <div class="row">
          <div class="col-lg-8">
            <form [formGroup]="roleForm" (ngSubmit)="onSubmit()">
              <!-- Basic Info Card -->
              <div class="card shadow-1 mb-4">
                <div class="card-header">
                  <h5 class="mb-0">
                    <svg class="sa-icon me-2">
                      <use href="/assets/icons/sprite.svg#shield"></use>
                    </svg>
                    Role Information
                  </h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label class="form-label">Role Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" formControlName="name"
                           [class.is-invalid]="isInvalid('name')"
                           placeholder="e.g., Sales Manager">
                    <div class="invalid-feedback">Role name is required.</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" formControlName="description" rows="3"
                              placeholder="Describe what this role is for..."></textarea>
                  </div>
                </div>
              </div>

              <!-- Permissions Card -->
              <div class="card shadow-1 mb-4">
                <div class="card-header">
                  <h5 class="mb-0">
                    <svg class="sa-icon me-2">
                      <use href="/assets/icons/sprite.svg#key"></use>
                    </svg>
                    Permissions
                  </h5>
                </div>
                <div class="card-body">
                  @for (group of permissionGroups; track group.name) {
                    <div class="mb-4">
                      <h6 class="text-uppercase text-muted small mb-3">{{ group.name }}</h6>
                      <div class="row">
                        @for (permission of group.permissions; track permission.key) {
                          <div class="col-md-6 mb-2">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox"
                                     [id]="permission.key"
                                     [checked]="selectedPermissions.has(permission.key)"
                                     (change)="togglePermission(permission.key)">
                              <label class="form-check-label" [for]="permission.key">
                                {{ permission.label }}
                              </label>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div class="d-flex justify-content-end gap-2">
                <a routerLink="/roles" class="btn btn-default">Cancel</a>
                <button type="submit" class="btn btn-primary" [disabled]="isSaving">
                  @if (isSaving) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  Create Role
                </button>
              </div>
            </form>
          </div>

          <div class="col-lg-4">
            <div class="card shadow-1">
              <div class="card-header">
                <h5 class="mb-0">
                  <svg class="sa-icon me-2">
                    <use href="/assets/icons/sprite.svg#info"></use>
                  </svg>
                  About Permissions
                </h5>
              </div>
              <div class="card-body">
                <p class="text-muted small mb-3">
                  Permissions control what users with this role can do in the system.
                </p>
                <div class="alert alert-warning small mb-0">
                  <svg class="sa-icon me-2">
                    <use href="/assets/icons/sprite.svg#alert-triangle"></use>
                  </svg>
                  Be careful with management permissions - they provide elevated access.
                </div>
              </div>
            </div>

            <div class="card shadow-1 mt-4">
              <div class="card-header">
                <h5 class="mb-0">Selected Permissions</h5>
              </div>
              <div class="card-body">
                @if (selectedPermissions.size === 0) {
                  <p class="text-muted small mb-0">No permissions selected</p>
                } @else {
                  <div class="d-flex flex-wrap gap-1">
                    @for (permission of Array.from(selectedPermissions); track permission) {
                      <span class="badge bg-primary-100 text-primary">{{ permission }}</span>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class RoleCreate {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  roleForm: FormGroup;
  isSaving = false;
  selectedPermissions = new Set<string>();
  Array = Array;

  permissionGroups = [
    {
      name: 'Users',
      permissions: [
        { key: 'users.view', label: 'View Users' },
        { key: 'users.create', label: 'Create Users' },
        { key: 'users.edit', label: 'Edit Users' },
        { key: 'users.delete', label: 'Delete Users' },
      ]
    },
    {
      name: 'Roles & Groups',
      permissions: [
        { key: 'roles.view', label: 'View Roles' },
        { key: 'roles.manage', label: 'Manage Roles' },
        { key: 'groups.view', label: 'View Groups' },
        { key: 'groups.manage', label: 'Manage Groups' },
      ]
    },
    {
      name: 'Reports',
      permissions: [
        { key: 'reports.view', label: 'View Reports' },
        { key: 'reports.export', label: 'Export Reports' },
      ]
    },
    {
      name: 'Settings',
      permissions: [
        { key: 'settings.view', label: 'View Settings' },
        { key: 'settings.manage', label: 'Manage Settings' },
      ]
    },
  ];

  constructor() {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.roleForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  togglePermission(key: string): void {
    if (this.selectedPermissions.has(key)) {
      this.selectedPermissions.delete(key);
    } else {
      this.selectedPermissions.add(key);
    }
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const roleData = {
      ...this.roleForm.value,
      permissions: Array.from(this.selectedPermissions)
    };

    setTimeout(() => {
      console.log('Role created:', roleData);
      this.isSaving = false;
      this.router.navigate(['/roles']);
    }, 1000);
  }
}
