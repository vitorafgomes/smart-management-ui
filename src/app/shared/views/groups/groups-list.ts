import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GroupsService } from '@core/services/api/identity-tenant/groups.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { Group } from '@core/models/domain/identity-tenant';
import { FilterGroupsRequest } from '@core/models/useCases/identity-tenant';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="main-content">
      <div class="container-fluid">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="fs-xl fw-700 mb-1">Groups</h1>
            <p class="text-muted mb-0">Organize users into teams and departments</p>
          </div>
          <a routerLink="/groups/create" class="btn btn-primary">
            <svg class="sa-icon me-2">
              <use href="/assets/icons/sprite.svg#plus"></use>
            </svg>
            Create Group
          </a>
        </div>

        <!-- Groups Table Card -->
        <div class="card shadow-1">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <svg class="sa-icon me-2">
                <use href="/assets/icons/sprite.svg#folder"></use>
              </svg>
              All Groups
            </h5>
            <input type="text" class="form-control form-control-sm" placeholder="Search groups..." style="width: 250px;">
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-4">Group Name</th>
                    <th>Description</th>
                    <th>Members</th>
                    <th>Created</th>
                    <th class="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @if (isLoading) {
                    <tr>
                      <td colspan="5" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  } @else if (groups.length === 0) {
                    <tr>
                      <td colspan="5" class="text-center py-5">
                        <svg class="sa-icon text-muted mb-3" style="width: 48px; height: 48px;">
                          <use href="/assets/icons/sprite.svg#folder"></use>
                        </svg>
                        <p class="text-muted mb-0">No groups found</p>
                        <a routerLink="/groups/create" class="btn btn-sm btn-primary mt-3">Create First Group</a>
                      </td>
                    </tr>
                  } @else {
                    @for (group of groups; track group.id) {
                      <tr>
                        <td class="ps-4">
                          <div class="d-flex align-items-center">
                            <div class="rounded-circle p-2 me-3 bg-primary-100 text-primary">
                              <svg class="sa-icon" style="width: 20px; height: 20px;">
                                <use href="/assets/icons/sprite.svg#folder"></use>
                              </svg>
                            </div>
                            <div>
                              <div class="fw-medium">{{ group.name }}</div>
                              @if (group.parentGroupId) {
                                <small class="text-muted">
                                  <svg class="sa-icon me-1" style="width: 12px; height: 12px;">
                                    <use href="/assets/icons/sprite.svg#corner-down-right"></use>
                                  </svg>
                                  Sub-group
                                </small>
                              }
                              @if (group.isSystemGroup) {
                                <span class="badge bg-secondary-100 text-secondary ms-2">System</span>
                              }
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="text-muted">{{ group.description || '-' }}</span>
                        </td>
                        <td>
                          <div class="d-flex align-items-center">
                            <svg class="sa-icon me-2 text-primary">
                              <use href="/assets/icons/sprite.svg#users"></use>
                            </svg>
                            <span class="text-muted small">{{ group.memberCount }} members</span>
                          </div>
                        </td>
                        <td>{{ group.createdAt | date:'mediumDate' }}</td>
                        <td class="text-end pe-4">
                          <div class="dropdown">
                            <button class="btn btn-sm btn-light" data-bs-toggle="dropdown">
                              <svg class="sa-icon">
                                <use href="/assets/icons/sprite.svg#more-vertical"></use>
                              </svg>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                              <li><a class="dropdown-item" href="#">View Details</a></li>
                              <li><a class="dropdown-item" href="#">Edit Group</a></li>
                              <li><a class="dropdown-item" href="#">Manage Members</a></li>
                              <li><hr class="dropdown-divider"></li>
                              <li><a class="dropdown-item text-danger" href="#">Delete Group</a></li>
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
        </div>
      </div>
    </div>
  `,
  styles: `
    .avatar-group {
      display: flex;
    }
    .avatar-group .avatar {
      margin-left: -8px;
      border: 2px solid white;
    }
    .avatar-group .avatar:first-child {
      margin-left: 0;
    }
    .avatar-xs {
      width: 28px;
      height: 28px;
    }
    .avatar-title {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }
  `
})
export class GroupsList implements OnInit, OnDestroy {
  private readonly groupsService = inject(GroupsService);
  private readonly tenantStorage = inject(TenantStorageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  groups: Group[] = [];
  isLoading = true;
  totalCount = 0;
  errorMessage = '';

  ngOnInit(): void {
    this.loadGroups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGroups(): void {
    const tenant = this.tenantStorage.getLastTenant();
    if (!tenant) {
      this.errorMessage = 'No tenant selected. Please select a tenant first.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const groupsRequest: FilterGroupsRequest = {
      tenantId: tenant.id,
      pageFilter: { pageNumber: 1, pageSize: 50 }
    };

    this.groupsService.getGroupsByFilters(groupsRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const result = response.pagedResult ?? response;
          this.groups = result.entries ?? [];
          this.totalCount = result.totalResults ?? 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading groups:', err);
          this.errorMessage = 'Failed to load groups. Please try again.';
          this.isLoading = false;
        }
      });
  }
}
