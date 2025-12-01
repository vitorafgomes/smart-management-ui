import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { RolesService } from '@core/services/api/identity-tenant/roles.service';
import { UsersService } from '@core/services/api/identity-tenant/users.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { Role, Permission } from '@core/models/domain/identity-tenant';
import { User } from '@core/models/domain/identity-tenant/identities/user';
import { FilterRolesRequest, FilterUsersRequest } from '@core/models/useCases/identity-tenant';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { PermissionsMatrixComponent } from '../../components/permissions-matrix/permissions-matrix.component';

// Extended Role type with calculated userCount for template binding
interface RoleWithUserCount extends Role {
  calculatedUserCount: number;
}

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgbDropdownModule, NgbModalModule, PermissionsMatrixComponent],
  template: `
    <div class="main-content">
      <div class="container-fluid">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="fs-xl fw-700 mb-1">Roles</h1>
            <p class="text-muted mb-0">Manage roles and permissions in your organization</p>
          </div>
          <a routerLink="/roles/create" class="btn btn-primary">
            <svg class="sa-icon me-2">
              <use href="/assets/icons/sprite.svg#plus"></use>
            </svg>
            Create Role
          </a>
        </div>

        <!-- Roles Grid -->
        <div class="row g-4">
          @if (isLoading) {
            <div class="col-12 text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          } @else {
            @for (role of roles; track role.id) {
              <div class="col-md-6 col-lg-4">
                <div class="card shadow-1 h-100">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                      <div class="d-flex align-items-center">
                        <div class="rounded-circle p-2 me-3" [ngClass]="getRoleColorClass(role.name)">
                          <svg class="sa-icon" style="width: 24px; height: 24px;">
                            <use href="/assets/icons/sprite.svg#shield"></use>
                          </svg>
                        </div>
                        <div>
                          <h5 class="mb-0">{{ role.name }}</h5>
                          <small class="text-muted">{{ role.calculatedUserCount }} users</small>
                        </div>
                      </div>
                      <div ngbDropdown class="dropdown">
                        <button type="button" class="btn btn-sm btn-light no-caret" ngbDropdownToggle>
                          <svg class="sa-icon">
                            <use href="/assets/icons/sprite.svg#more-vertical"></use>
                          </svg>
                        </button>
                        <div ngbDropdownMenu class="dropdown-menu dropdown-menu-end">
                          <a ngbDropdownItem class="dropdown-item" [routerLink]="['/roles', role.id, 'edit']">Edit Role</a>
                          <a ngbDropdownItem class="dropdown-item d-flex align-items-center" href="#" (click)="openPermissionsModal(role, $event)">
                            <svg class="sa-icon me-2" style="width: 14px; height: 14px;">
                              <use href="/assets/icons/sprite.svg#eye"></use>
                            </svg>
                            <span>View Permissions</span>
                          </a>
                          <div class="dropdown-divider"></div>
                          <a ngbDropdownItem class="dropdown-item text-danger" href="#" (click)="confirmDelete(role, $event)">Delete Role</a>
                        </div>
                      </div>
                    </div>
                    <p class="text-muted small mb-3">{{ role.description || 'No description' }}</p>

                    <!-- Permissions Section -->
                    @if (role.permissions && role.permissions.length > 0) {
                      <div class="mb-3">
                        <small class="text-muted d-block mb-2">
                          <svg class="sa-icon me-1" style="width: 14px; height: 14px;">
                            <use href="/assets/icons/sprite.svg#key"></use>
                          </svg>
                          Permissions ({{ role.permissions.length }})
                        </small>
                        <div class="d-flex flex-wrap gap-1">
                          @for (permission of role.permissions.slice(0, 5); track permission.id) {
                            <span class="badge bg-light text-dark border" [title]="permission.description || permission.displayName">
                              {{ permission.displayName }}
                            </span>
                          }
                          @if (role.permissions.length > 5) {
                            <span class="badge bg-primary-100 text-primary" [title]="getExtraPermissionsTooltip(role.permissions)">
                              +{{ role.permissions.length - 5 }} more
                            </span>
                          }
                        </div>
                      </div>
                    } @else {
                      <div class="mb-3">
                        <small class="text-muted">
                          <svg class="sa-icon me-1" style="width: 14px; height: 14px;">
                            <use href="/assets/icons/sprite.svg#key"></use>
                          </svg>
                          No permissions assigned
                        </small>
                      </div>
                    }

                    <div class="d-flex flex-wrap gap-1">
                      @if (role.isComposite) {
                        <span class="badge bg-info-100 text-info">Composite Role</span>
                      }
                      @if (role.isActive) {
                        <span class="badge bg-success-100 text-success">Active</span>
                      } @else {
                        <span class="badge bg-secondary-100 text-secondary">Inactive</span>
                      }
                    </div>
                  </div>
                  <div class="card-footer bg-transparent border-top">
                    <small class="text-muted">
                      @if (role.isSystemRole) {
                        <svg class="sa-icon me-1">
                          <use href="/assets/icons/sprite.svg#lock"></use>
                        </svg>
                        System role
                      } @else {
                        <svg class="sa-icon me-1">
                          <use href="/assets/icons/sprite.svg#edit-3"></use>
                        </svg>
                        Custom role
                      }
                    </small>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- Permissions Modal -->
    <ng-template #permissionsModal let-modal>
      <div class="modal-header">
        <div>
          <h4 class="modal-title mb-1">
            <svg class="sa-icon me-2">
              <use href="/assets/icons/sprite.svg#shield"></use>
            </svg>
            {{ selectedRole?.name }} - Access Levels
          </h4>
          <p class="text-muted small mb-0">View all permissions and access levels for this role</p>
        </div>
        <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        <app-permissions-matrix [permissions]="selectedRole?.permissions || []"></app-permissions-matrix>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" (click)="modal.dismiss()">Close</button>
        <a [routerLink]="['/roles', selectedRole?.id, 'edit']" class="btn btn-primary" (click)="modal.dismiss()">
          <svg class="sa-icon me-2">
            <use href="/assets/icons/sprite.svg#edit-3"></use>
          </svg>
          Edit Role
        </a>
      </div>
    </ng-template>
  `,
  styles: `
    .no-caret::after {
      display: none !important;
    }
  `
})
export class RolesList implements OnInit, OnDestroy {
  private readonly rolesService = inject(RolesService);
  private readonly usersService = inject(UsersService);
  private readonly tenantStorage = inject(TenantStorageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly modalService = inject(NgbModal);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('permissionsModal') permissionsModal!: TemplateRef<any>;

  roles: RoleWithUserCount[] = [];
  users: User[] = [];
  isLoading = true;
  totalCount = 0;
  errorMessage = '';
  selectedRole: RoleWithUserCount | null = null;

  ngOnInit(): void {
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    const tenant = this.tenantStorage.getLastTenant();
    if (!tenant) {
      this.errorMessage = 'No tenant selected. Please select a tenant first.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const rolesRequest: FilterRolesRequest = {
      tenantId: tenant.id,
      pageFilter: { pageNumber: 1, pageSize: 50 }
    };

    const usersRequest: FilterUsersRequest = {
      tenantId: tenant.id,
      pageFilter: { pageNumber: 1, pageSize: 1000 } // Load all users to calculate userCount
    };

    // Load both roles and users in parallel
    forkJoin({
      roles: this.rolesService.getRolesByFilters(rolesRequest),
      users: this.usersService.getUsersByFilters(usersRequest)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses: any) => {
          // Process roles - API returns { pagedResult: { entries, ... } }
          const rolesResult = responses.roles.pagedResult ?? responses.roles;
          const rawRoles: Role[] = rolesResult.entries ?? [];
          this.totalCount = rolesResult.totalResults ?? 0;

          // Process users - API returns { users: { entries, ... } }
          const usersResult = responses.users.users ?? responses.users.pagedResult ?? responses.users;
          this.users = usersResult.entries ?? [];

          // Calculate user counts and assign to roles
          this.roles = this.calculateRoleUserCounts(rawRoles);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading roles:', err);
          this.errorMessage = 'Failed to load roles. Please try again.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Calculate userCount for each role based on users' userRoles
   * Returns roles with calculatedUserCount property to avoid NG0100 error
   */
  private calculateRoleUserCounts(rawRoles: Role[]): RoleWithUserCount[] {
    // Build a map of roleId -> userCount
    const roleUserCounts = new Map<string, number>();

    // Iterate through all users and count how many have each role
    for (const user of this.users) {
      if (user.userRoles && user.userRoles.length > 0) {
        for (const userRole of user.userRoles) {
          const currentCount = roleUserCounts.get(userRole.roleId) || 0;
          roleUserCounts.set(userRole.roleId, currentCount + 1);
        }
      }
    }

    // Map roles to include calculatedUserCount
    return rawRoles.map(role => ({
      ...role,
      calculatedUserCount: roleUserCounts.get(role.id) || 0
    }));
  }

  getRoleColorClass(roleName: string): string {
    const normalizedName = roleName.toLowerCase();
    if (normalizedName.includes('admin')) return 'bg-danger-100 text-danger';
    if (normalizedName.includes('manager')) return 'bg-warning-100 text-warning';
    if (normalizedName.includes('user')) return 'bg-primary-100 text-primary';
    if (normalizedName.includes('viewer') || normalizedName.includes('view')) return 'bg-info-100 text-info';
    return 'bg-secondary-100 text-secondary';
  }

  getExtraPermissionsTooltip(permissions: Permission[]): string {
    return permissions.slice(5).map(p => p.displayName).join(', ');
  }

  openPermissionsModal(role: RoleWithUserCount, event: Event): void {
    event.preventDefault();
    this.selectedRole = role;
    this.modalService.open(this.permissionsModal, {
      size: 'xl',
      centered: true,
      scrollable: true
    });
  }

  confirmDelete(role: Role, event: Event): void {
    event.preventDefault();

    if (role.isSystemRole) {
      alert('System roles cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      this.deleteRole(role);
    }
  }

  private deleteRole(role: Role): void {
    this.rolesService.deleteRole(role.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Remove the role from the list
          this.roles = this.roles.filter(r => r.id !== role.id);
        },
        error: (err) => {
          console.error('Error deleting role:', err);
          alert('Failed to delete role. It may be in use by users.');
        }
      });
  }
}
