import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RolePermissionsService } from '@core/services/api/identity-tenant/role-permissions.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { RolePermission } from '@core/models/domain/identity-tenant';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-role-permissions-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="main-content">
      <div class="container-fluid">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="fs-xl fw-700 mb-1">Role Permissions</h1>
            <p class="text-muted mb-0">Manage permissions assigned to roles</p>
          </div>
          <a routerLink="/role-permissions/create" class="btn btn-primary">
            <svg class="sa-icon me-2">
              <use href="/assets/icons/sprite.svg#plus"></use>
            </svg>
            Assign Permission
          </a>
        </div>

        <!-- Role Permissions Table Card -->
        <div class="card shadow-1">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#key"></use>
              </svg>
              All Role Permissions
            </h5>
            <input type="text" class="form-control form-control-sm" placeholder="Search permissions..." style="width: 250px;">
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-4">Role ID</th>
                    <th>Permission ID</th>
                    <th>Granted At</th>
                    <th>Granted By</th>
                    <th>Created</th>
                    <th class="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @if (isLoading) {
                    <tr>
                      <td colspan="6" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  } @else if (rolePermissions.length === 0) {
                    <tr>
                      <td colspan="6" class="text-center py-5">
                        <svg class="sa-icon text-muted mb-3" style="width: 48px; height: 48px;">
                          <use href="/assets/icons/sprite.svg#key"></use>
                        </svg>
                        <p class="text-muted mb-0">No role permissions found</p>
                        <a routerLink="/role-permissions/create" class="btn btn-sm btn-primary mt-3">Assign First Permission</a>
                      </td>
                    </tr>
                  } @else {
                    @for (rp of rolePermissions; track rp.id) {
                      <tr>
                        <td class="ps-4">
                          <div class="d-flex align-items-center">
                            <div class="rounded-circle p-2 me-3 bg-warning-100 text-warning">
                              <svg class="sa-icon" style="width: 20px; height: 20px;">
                                <use href="/assets/icons/sprite.svg#shield"></use>
                              </svg>
                            </div>
                            <div>
                              <div class="fw-medium text-truncate" style="max-width: 200px;" [title]="rp.roleId">
                                {{ rp.roleId | slice:0:12 }}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="d-flex align-items-center">
                            <svg class="sa-icon me-2 text-info">
                              <use href="/assets/icons/sprite.svg#key"></use>
                            </svg>
                            <span class="text-truncate" style="max-width: 200px;" [title]="rp.permissionId">
                              {{ rp.permissionId | slice:0:12 }}...
                            </span>
                          </div>
                        </td>
                        <td>{{ rp.grantedAt | date:'mediumDate' }}</td>
                        <td>
                          @if (rp.grantedByUserId) {
                            <span class="badge bg-primary-100 text-primary">{{ rp.grantedByUserId | slice:0:8 }}...</span>
                          } @else {
                            <span class="text-muted">-</span>
                          }
                        </td>
                        <td>{{ rp.createdAt | date:'mediumDate' }}</td>
                        <td class="text-end pe-4">
                          <div class="dropdown">
                            <button class="btn btn-sm btn-light" data-bs-toggle="dropdown">
                              <svg class="sa-icon">
                                <use href="/assets/icons/sprite.svg#more-vertical"></use>
                              </svg>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                              <li><a class="dropdown-item" href="#">View Details</a></li>
                              <li><hr class="dropdown-divider"></li>
                              <li><a class="dropdown-item text-danger" href="#">Revoke Permission</a></li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
          @if (rolePermissions.length > 0) {
            <div class="card-footer d-flex justify-content-between align-items-center">
              <small class="text-muted">Showing {{ rolePermissions.length }} of {{ totalCount }} role permissions</small>
              <nav>
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item disabled"><a class="page-link" href="#">Previous</a></li>
                  <li class="page-item active"><a class="page-link" href="#">1</a></li>
                  <li class="page-item"><a class="page-link" href="#">2</a></li>
                  <li class="page-item"><a class="page-link" href="#">3</a></li>
                  <li class="page-item"><a class="page-link" href="#">Next</a></li>
                </ul>
              </nav>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class RolePermissionsList implements OnInit, OnDestroy {
  private readonly rolePermissionsService = inject(RolePermissionsService);
  private readonly tenantStorage = inject(TenantStorageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  rolePermissions: RolePermission[] = [];
  isLoading = true;
  totalCount = 0;
  errorMessage = '';

  ngOnInit(): void {
    this.loadRolePermissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRolePermissions(): void {
    const tenant = this.tenantStorage.getLastTenant();
    if (!tenant) {
      this.errorMessage = 'No tenant selected. Please select a tenant first.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const filters = {
      TenantId: tenant.id,
      PageFilter: 'page=1,pageSize=50'
    };

    this.rolePermissionsService.getRolePermissionsByFilters(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const result = response.pagedResult ?? response;
          this.rolePermissions = result.entries ?? [];
          this.totalCount = result.totalResults ?? 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading role permissions:', err);
          this.errorMessage = 'Failed to load role permissions. Please try again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
