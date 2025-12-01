import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UsersService } from '@core/services/api/identity-tenant/users.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { User } from '@core/models/domain/identity-tenant';
import { FilterUsersRequest } from '@core/models/useCases/identity-tenant';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="main-content">
      <div class="container-fluid">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="fs-xl fw-700 mb-1">Users</h1>
            <p class="text-muted mb-0">Manage users in your organization</p>
          </div>
          <a routerLink="/users/invite" class="btn btn-primary">
            <svg class="sa-icon me-2">
              <use href="/assets/icons/sprite.svg#user-plus"></use>
            </svg>
            Invite User
          </a>
        </div>

        <!-- Users Table Card -->
        <div class="card shadow-1">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#users"></use>
              </svg>
              All Users
            </h5>
            <div class="d-flex gap-2">
              <input type="text" class="form-control form-control-sm" placeholder="Search users..." style="width: 250px;">
              <select class="form-select form-select-sm" style="width: 150px;">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-4">User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
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
                  } @else if (users.length === 0) {
                    <tr>
                      <td colspan="6" class="text-center py-5">
                        <svg class="sa-icon text-muted mb-3" style="width: 48px; height: 48px;">
                          <use href="/assets/icons/sprite.svg#users"></use>
                        </svg>
                        <p class="text-muted mb-0">No users found</p>
                        <a routerLink="/users/invite" class="btn btn-sm btn-primary mt-3">Invite First User</a>
                      </td>
                    </tr>
                  } @else {
                    @for (user of users; track user.id) {
                      <tr>
                        <td class="ps-4">
                          <div class="d-flex align-items-center">
                            <div class="avatar avatar-sm me-3">
                              @if (user.avatarUrl) {
                                <img [src]="user.avatarUrl" class="rounded-circle" alt="Avatar">
                              } @else {
                                <span class="avatar-title rounded-circle bg-primary-100 text-primary">
                                  {{ user.firstName.charAt(0) || '' }}{{ user.lastName.charAt(0) || '' }}
                                </span>
                              }
                            </div>
                            <div>
                              <div class="fw-medium">{{ user.firstName }} {{ user.lastName }}</div>
                              <small class="text-muted">{{ user.userName }}</small>
                            </div>
                          </div>
                        </td>
                        <td>{{ user.email }}</td>
                        <td>
                          @if (user.isAdmin) {
                            <span class="badge bg-danger-100 text-danger">Admin</span>
                          } @else {
                            <span class="badge bg-primary-100 text-primary">User</span>
                          }
                        </td>
                        <td>
                          <span class="badge" [ngClass]="getStatusClass(user.isActive)">
                            {{ user.isActive ? 'Active' : 'Inactive' }}
                          </span>
                        </td>
                        <td>{{ user.lastLoginAt | date:'short' }}</td>
                        <td class="text-end pe-4">
                          <button class="btn btn-sm btn-light" (click)="editUser(user.id)" title="Edit User">
                            <svg class="sa-icon">
                              <use href="/assets/icons/sprite.svg#more-vertical"></use>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
          @if (users.length > 0) {
            <div class="card-footer d-flex justify-content-between align-items-center">
              <small class="text-muted">Showing {{ users.length }} users</small>
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
  styles: `
    .avatar-sm {
      width: 36px;
      height: 36px;
    }
    .avatar-title {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
    }
  `
})
export class UsersList implements OnInit, OnDestroy {
  private readonly usersService = inject(UsersService);
  private readonly tenantStorage = inject(TenantStorageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  users: User[] = [];
  isLoading = true;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;
  errorMessage = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    const tenant = this.tenantStorage.getLastTenant();
    if (!tenant) {
      this.errorMessage = 'No tenant selected. Please select a tenant first.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const usersRequest: FilterUsersRequest = {
      tenantId: tenant.id,
      pageFilter: { pageNumber: this.currentPage, pageSize: this.pageSize }
    };

    this.usersService.getUsersByFilters(usersRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const result = response.users ?? response;
          this.users = result.entries ?? [];
          this.totalCount = result.totalResults ?? 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading users:', err);
          this.errorMessage = 'Failed to load users. Please try again.';
          this.isLoading = false;
        }
      });
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'bg-success-100 text-success' : 'bg-secondary-100 text-secondary';
  }

  editUser(userId: string): void {
    this.router.navigate(['/users', userId, 'edit']);
  }
}
