import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { User } from '@core/models/domain/identity-tenant';
import { UsersStore } from '@core/stores/identity-tenant/users/users.store';
import { Subject } from 'rxjs';

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
            <div class="d-flex gap-2 flex-wrap">
              <input type="text" class="form-control form-control-sm" placeholder="Search users..." style="min-width: 150px; max-width: 250px; flex: 1;">
              <select class="form-select form-select-sm" style="min-width: 120px; max-width: 150px;">
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
                    <th class="d-none d-md-table-cell">Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th class="d-none d-lg-table-cell">Last Login</th>
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
                        <td class="d-none d-md-table-cell">{{ user.email }}</td>
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
                        <td class="d-none d-lg-table-cell">{{ user.lastLoginAt | date:'short' }}</td>
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
              <small class="text-muted">Showing {{ users.length }} of {{ totalCount }} users</small>
              @if (totalPages > 1) {
                <nav>
                  <ul class="pagination pagination-sm mb-0">
                    <li class="page-item" [class.disabled]="currentPage === 1">
                      <button class="page-link" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">Previous</button>
                    </li>
                    @for (page of getPageNumbers(); track page) {
                      <li class="page-item" [class.active]="page === currentPage">
                        <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
                      </li>
                    }
                    <li class="page-item" [class.disabled]="currentPage === totalPages">
                      <button class="page-link" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">Next</button>
                    </li>
                  </ul>
                </nav>
              }
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

    /* Mobile responsive fixes */
    @media (max-width: 575.98px) {
      .table-responsive {
        overflow-x: hidden !important;
      }
      .table th,
      .table td {
        padding: 0.5rem 0.25rem !important;
      }
      .table th.ps-4,
      .table td.ps-4 {
        padding-left: 0.5rem !important;
      }
      .table th.pe-4,
      .table td.pe-4 {
        padding-right: 0.5rem !important;
      }
      .avatar-sm {
        width: 28px;
        height: 28px;
      }
      .avatar.me-3 {
        margin-right: 0.5rem !important;
      }
      .fw-medium {
        font-size: 0.875rem;
      }
    }
  `
})
export class UsersList implements OnInit, OnDestroy {
  readonly usersStore = inject(UsersStore);
  private readonly tenantStorage = inject(TenantStorageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Lê dados diretamente da store (reativo via signals)
  get users(): User[] {
    return this.usersStore.entities();
  }

  get isLoading(): boolean {
    return this.usersStore.isLoading();
  }

  get totalCount(): number {
    return this.usersStore.totalResults();
  }

  get currentPage(): number {
    return this.usersStore.currentFilter().pageNumber;
  }

  get pageSize(): number {
    return this.usersStore.currentFilter().pageSize;
  }

  get errorMessage(): string {
    return this.usersStore.error() ?? '';
  }

  constructor() {
    // Effect para reagir a mudanças na store e atualizar a view
    effect(() => {
      // Força detecção de mudanças quando a store atualiza
      const _ = this.usersStore.entities();
      const __ = this.usersStore.isLoading();
      this.cdr.markForCheck();
    });
  }

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
      console.error('No tenant selected');
      return;
    }

    console.log('[CACHE] Loading users via UsersStore (will populate cache)');

    // Usa a store para carregar - isso popula o cache!
    this.usersStore.loadUsers({
      tenantId: tenant.id,
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      const tenant = this.tenantStorage.getLastTenant();
      if (!tenant) return;

      // Usa a store para navegar entre páginas
      this.usersStore.loadUsers({
        tenantId: tenant.id,
        pageNumber: page,
        pageSize: this.pageSize
      });
    }
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'bg-success-100 text-success' : 'bg-secondary-100 text-secondary';
  }

  editUser(userId: string): void {
    this.router.navigate(['/users', userId, 'edit']);
  }
}
