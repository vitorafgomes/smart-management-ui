import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { RolesService } from '@core/services/api/identity-tenant/roles.service';
import { Role, Permission } from '@core/models/domain/identity-tenant';
import { Subject, takeUntil } from 'rxjs';

interface PermissionGroup {
  category: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon],
  template: `
    <div class="main-content">
      <div class="container-fluid">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-1">
                <li class="breadcrumb-item"><a routerLink="/roles">Roles</a></li>
                <li class="breadcrumb-item active">Edit Role</li>
              </ol>
            </nav>
            <h1 class="fs-xl fw-700 mb-0">Edit Role</h1>
          </div>
        </div>

        @if (isLoading) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        } @else if (errorMessage) {
          <div class="alert alert-danger">
            <svg class="sa-icon me-2">
              <use href="/assets/icons/sprite.svg#alert-circle"></use>
            </svg>
            {{ errorMessage }}
          </div>
        } @else {
          <!-- Edit Form -->
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
                             [readonly]="role?.isSystemRole"
                             placeholder="e.g., Sales Manager">
                      <div class="invalid-feedback">Role name is required.</div>
                      @if (role?.isSystemRole) {
                        <small class="text-muted">System role name cannot be modified.</small>
                      }
                    </div>

                    <div class="mb-3">
                      <label class="form-label">Description</label>
                      <textarea class="form-control" formControlName="description" rows="3"
                                placeholder="Describe what this role is for..."></textarea>
                    </div>

                    <div class="row">
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label">Priority</label>
                          <input type="number" class="form-control" formControlName="priority"
                                 min="0" placeholder="0">
                          <small class="text-muted">Higher priority roles take precedence.</small>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label">Status</label>
                          <div class="form-check form-switch mt-2">
                            <input class="form-check-input" type="checkbox" formControlName="isActive"
                                   id="isActiveSwitch">
                            <label class="form-check-label" for="isActiveSwitch">
                              {{ roleForm.get('isActive')?.value ? 'Active' : 'Inactive' }}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Permissions Card -->
                <div class="card shadow-1 mb-4">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                      <svg class="sa-icon me-2">
                        <use href="/assets/icons/sprite.svg#key"></use>
                      </svg>
                      Permissions
                    </h5>
                    <span class="badge bg-primary">{{ role?.permissions?.length || 0 }} permissions</span>
                  </div>
                  <div class="card-body">
                    @if (!role?.permissions?.length) {
                      <div class="text-center py-4">
                        <svg class="sa-icon text-muted mb-2" style="width: 48px; height: 48px;">
                          <use href="/assets/icons/sprite.svg#shield-off"></use>
                        </svg>
                        <p class="text-muted mb-0">No permissions assigned to this role</p>
                      </div>
                    } @else {
                      @for (group of permissionGroups; track group.category) {
                        <div class="mb-4">
                          <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="text-uppercase text-muted small mb-0">{{ group.category }}</h6>
                            <span class="badge bg-secondary-100 text-secondary">{{ group.permissions.length }}</span>
                          </div>
                          <div class="row">
                            @for (permission of group.permissions; track permission.id) {
                              <div class="col-md-6 mb-3">
                                <div class="border rounded p-3 h-100">
                                  <div class="d-flex align-items-start">
                                    <div class="form-check">
                                      <input class="form-check-input" type="checkbox"
                                             [id]="permission.id"
                                             [checked]="true"
                                             disabled>
                                    </div>
                                    <div class="ms-2">
                                      <label class="form-check-label fw-500" [for]="permission.id">
                                        {{ permission.displayName }}
                                      </label>
                                      <p class="text-muted small mb-1">{{ permission.description }}</p>
                                      <code class="small text-primary">{{ permission.resource }}:{{ permission.action }}</code>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="d-flex justify-content-between">
                  <button type="button" class="btn btn-outline-danger" (click)="confirmDelete()"
                          [disabled]="role?.isSystemRole || isDeleting">
                    @if (isDeleting) {
                      <span class="spinner-border spinner-border-sm me-1"></span>
                    } @else {
                      <svg class="sa-icon me-1">
                        <use href="/assets/icons/sprite.svg#trash-2"></use>
                      </svg>
                    }
                    Delete Role
                  </button>
                  <div class="d-flex gap-2">
                    <a routerLink="/roles" class="btn btn-default d-flex align-items-center">
                      <svg class="sa-icon me-1">
                        <use href="/assets/icons/sprite.svg#x"></use>
                      </svg>
                      Cancel
                    </a>
                    <button type="submit" class="btn btn-primary d-flex align-items-center" [disabled]="isSaving || !hasChanges()">
                      @if (isSaving) {
                        <span class="spinner-border spinner-border-sm me-1"></span>
                      } @else {
                        <ng-icon name="faSolidFloppyDisk" size="16" class="me-1"></ng-icon>
                      }
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div class="col-lg-4">
              <!-- Role Info Card -->
              <div class="card shadow-1 mb-4">
                <div class="card-header">
                  <h5 class="mb-0">
                    <svg class="sa-icon me-2">
                      <use href="/assets/icons/sprite.svg#info"></use>
                    </svg>
                    Role Details
                  </h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <small class="text-muted d-block">Role ID</small>
                    <code class="small">{{ role?.id }}</code>
                  </div>
                  <div class="mb-3">
                    <small class="text-muted d-block">Users with this role</small>
                    <span class="fw-500">{{ role?.userCount || 0 }} users</span>
                  </div>
                  <div class="mb-3">
                    <small class="text-muted d-block">Created</small>
                    <span>{{ role?.createdAt | date:'medium' }}</span>
                  </div>
                  @if (role?.updatedAt) {
                    <div class="mb-0">
                      <small class="text-muted d-block">Last Updated</small>
                      <span>{{ role?.updatedAt | date:'medium' }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Status Badges -->
              <div class="card shadow-1 mb-4">
                <div class="card-header">
                  <h5 class="mb-0">Status</h5>
                </div>
                <div class="card-body">
                  <div class="d-flex flex-wrap gap-2">
                    @if (role?.isSystemRole) {
                      <span class="badge bg-warning-100 text-warning">
                        <svg class="sa-icon me-1" style="width: 12px; height: 12px;">
                          <use href="/assets/icons/sprite.svg#lock"></use>
                        </svg>
                        System Role
                      </span>
                    }
                    @if (role?.isComposite) {
                      <span class="badge bg-info-100 text-info">Composite Role</span>
                    }
                    @if (role?.isActive) {
                      <span class="badge bg-success-100 text-success">Active</span>
                    } @else {
                      <span class="badge bg-secondary-100 text-secondary">Inactive</span>
                    }
                  </div>
                  @if (role?.isSystemRole) {
                    <div class="alert alert-warning small mt-3 mb-0">
                      <svg class="sa-icon me-2">
                        <use href="/assets/icons/sprite.svg#alert-triangle"></use>
                      </svg>
                      System roles have limited editing capabilities.
                    </div>
                  }
                </div>
              </div>

              <!-- Permissions Summary Card -->
              <div class="card shadow-1">
                <div class="card-header">
                  <h5 class="mb-0">Permissions Summary</h5>
                </div>
                <div class="card-body">
                  @if (!role?.permissions?.length) {
                    <p class="text-muted small mb-0">No permissions assigned</p>
                  } @else {
                    <div class="d-flex flex-wrap gap-1">
                      @for (permission of role?.permissions; track permission.id) {
                        <span class="badge bg-primary-100 text-primary" [title]="permission.description">
                          {{ permission.displayName }}
                        </span>
                      }
                    </div>
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
export class RoleEdit implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly rolesService = inject(RolesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  roleForm!: FormGroup;
  role: Role | null = null;
  originalRole: Role | null = null;
  isLoading = true;
  isSaving = false;
  isDeleting = false;
  errorMessage = '';
  selectedPermissions = new Set<string>();
  originalPermissions = new Set<string>();
  Array = Array;

  // Permission groups organized by category from API
  permissionGroups: PermissionGroup[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadRole();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      priority: [0],
      isActive: [true]
    });
  }

  private loadRole(): void {
    const roleId = this.route.snapshot.paramMap.get('id');
    if (!roleId) {
      this.errorMessage = 'Role ID not provided.';
      this.isLoading = false;
      return;
    }

    this.rolesService.getRoleById(roleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (role) => {
          this.role = role;
          this.originalRole = { ...role };
          this.populateForm(role);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading role:', err);
          this.errorMessage = 'Failed to load role. It may not exist or you may not have permission to view it.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private populateForm(role: Role): void {
    this.roleForm.patchValue({
      name: role.name,
      description: role.description || '',
      priority: role.priority || 0,
      isActive: role.isActive
    });

    // Organize permissions by category
    this.buildPermissionGroups(role.permissions || []);
  }

  /**
   * Groups permissions by their category for display
   */
  private buildPermissionGroups(permissions: Permission[]): void {
    const groupMap = new Map<string, Permission[]>();

    // Group permissions by category
    for (const permission of permissions) {
      const category = permission.category || 'Other';
      if (!groupMap.has(category)) {
        groupMap.set(category, []);
      }
      groupMap.get(category)!.push(permission);
    }

    // Convert map to array and sort by category name
    this.permissionGroups = Array.from(groupMap.entries())
      .map(([category, perms]) => ({
        category,
        permissions: perms.sort((a, b) => a.displayName.localeCompare(b.displayName))
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
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

  hasChanges(): boolean {
    if (!this.originalRole) return false;

    const formValue = this.roleForm.value;
    const nameChanged = formValue.name !== this.originalRole.name;
    const descriptionChanged = formValue.description !== (this.originalRole.description || '');
    const priorityChanged = formValue.priority !== (this.originalRole.priority || 0);
    const isActiveChanged = formValue.isActive !== this.originalRole.isActive;

    // Check permissions changes
    const permissionsChanged =
      this.selectedPermissions.size !== this.originalPermissions.size ||
      [...this.selectedPermissions].some(p => !this.originalPermissions.has(p));

    return nameChanged || descriptionChanged || priorityChanged || isActiveChanged || permissionsChanged;
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    if (!this.role || !this.hasChanges()) {
      return;
    }

    this.isSaving = true;

    // Build JSON Patch document
    const patchDocument: any[] = [];
    const formValue = this.roleForm.value;

    if (formValue.name !== this.originalRole?.name && !this.role.isSystemRole) {
      patchDocument.push({ op: 'replace', path: '/Name', value: formValue.name });
    }

    if (formValue.description !== (this.originalRole?.description || '')) {
      patchDocument.push({ op: 'replace', path: '/Description', value: formValue.description });
    }

    if (formValue.priority !== (this.originalRole?.priority || 0)) {
      patchDocument.push({ op: 'replace', path: '/Priority', value: formValue.priority });
    }

    if (formValue.isActive !== this.originalRole?.isActive) {
      patchDocument.push({ op: 'replace', path: '/IsActive', value: formValue.isActive });
    }

    if (patchDocument.length === 0) {
      this.isSaving = false;
      return;
    }

    this.rolesService.updateRole(this.role.id, patchDocument)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.isSaving = false;
          this.errorMessage = 'Failed to update role. Please try again.';
        }
      });
  }

  confirmDelete(): void {
    if (!this.role || this.role.isSystemRole) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the role "${this.role.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      this.deleteRole();
    }
  }

  private deleteRole(): void {
    if (!this.role) return;

    this.isDeleting = true;

    this.rolesService.deleteRole(this.role.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Error deleting role:', err);
          this.isDeleting = false;
          this.errorMessage = 'Failed to delete role. It may be in use by users.';
        }
      });
  }
}
