import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permission } from '@core/models/domain/identity-tenant';

interface ResourcePermissions {
  resource: string;
  actions: Map<string, Permission>;
}

interface CategoryGroup {
  category: string;
  resources: ResourcePermissions[];
  totalPermissions: number;
}

@Component({
  selector: 'app-permissions-matrix',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="permissions-matrix">
      <!-- Summary Stats -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-card bg-primary-100 rounded p-3 text-center">
            <div class="fs-lg fw-700 text-primary">{{ totalPermissions }}</div>
            <small class="text-muted">Total Permissions</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card bg-success-100 rounded p-3 text-center">
            <div class="fs-lg fw-700 text-success">{{ totalResources }}</div>
            <small class="text-muted">Resources</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card bg-info-100 rounded p-3 text-center">
            <div class="fs-lg fw-700 text-info">{{ totalCategories }}</div>
            <small class="text-muted">Categories</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card bg-warning-100 rounded p-3 text-center">
            <div class="fs-lg fw-700 text-warning">{{ fullAccessCount }}</div>
            <small class="text-muted">Full Access</small>
          </div>
        </div>
      </div>

      <!-- Access Level Legend -->
      <div class="d-flex flex-wrap gap-3 mb-4 p-3 bg-light rounded">
        <div class="d-flex align-items-center">
          <span class="action-badge action-create me-2">C</span>
          <small>Create</small>
        </div>
        <div class="d-flex align-items-center">
          <span class="action-badge action-read me-2">R</span>
          <small>Read</small>
        </div>
        <div class="d-flex align-items-center">
          <span class="action-badge action-update me-2">U</span>
          <small>Update</small>
        </div>
        <div class="d-flex align-items-center">
          <span class="action-badge action-delete me-2">D</span>
          <small>Delete</small>
        </div>
        <div class="d-flex align-items-center">
          <span class="action-badge action-manage me-2">M</span>
          <small>Manage</small>
        </div>
        <div class="d-flex align-items-center">
          <span class="action-badge action-other me-2">*</span>
          <small>Other</small>
        </div>
      </div>

      @if (categoryGroups.length === 0) {
        <div class="text-center py-5">
          <svg class="sa-icon text-muted mb-3" style="width: 64px; height: 64px;">
            <use href="/assets/icons/sprite.svg#shield-off"></use>
          </svg>
          <p class="text-muted">No permissions assigned to this role</p>
        </div>
      } @else {
        <!-- Categories Accordion -->
        @for (group of categoryGroups; track group.category; let i = $index) {
          <div class="category-section mb-3">
            <div class="category-header d-flex justify-content-between align-items-center p-3 bg-light rounded-top border cursor-pointer"
                 (click)="toggleCategory(group.category)">
              <div class="d-flex align-items-center">
                <svg class="sa-icon me-2 transition-transform"
                     [class.rotate-90]="expandedCategories.has(group.category)"
                     style="width: 16px; height: 16px;">
                  <use href="/assets/icons/sprite.svg#chevron-right"></use>
                </svg>
                <h6 class="mb-0 text-uppercase">{{ group.category }}</h6>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-primary">{{ group.totalPermissions }} permissions</span>
                <span class="badge bg-secondary">{{ group.resources.length }} resources</span>
              </div>
            </div>

            @if (expandedCategories.has(group.category)) {
              <div class="category-content border border-top-0 rounded-bottom">
                <div class="table-responsive">
                  <table class="table table-sm mb-0">
                    <thead>
                      <tr class="bg-light">
                        <th class="ps-3" style="min-width: 200px;">Resource</th>
                        <th class="text-center" style="width: 60px;">Create</th>
                        <th class="text-center" style="width: 60px;">Read</th>
                        <th class="text-center" style="width: 60px;">Update</th>
                        <th class="text-center" style="width: 60px;">Delete</th>
                        <th class="text-center" style="width: 60px;">Manage</th>
                        <th class="text-center" style="width: 80px;">Other</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (resource of group.resources; track resource.resource) {
                        <tr>
                          <td class="ps-3 fw-500">{{ formatResourceName(resource.resource) }}</td>
                          <td class="text-center">
                            @if (hasAction(resource, 'Create')) {
                              <span class="action-badge action-create" [title]="getActionTooltip(resource, 'Create')">✓</span>
                            } @else {
                              <span class="action-badge action-none">-</span>
                            }
                          </td>
                          <td class="text-center">
                            @if (hasAction(resource, 'Read')) {
                              <span class="action-badge action-read" [title]="getActionTooltip(resource, 'Read')">✓</span>
                            } @else {
                              <span class="action-badge action-none">-</span>
                            }
                          </td>
                          <td class="text-center">
                            @if (hasAction(resource, 'Update')) {
                              <span class="action-badge action-update" [title]="getActionTooltip(resource, 'Update')">✓</span>
                            } @else {
                              <span class="action-badge action-none">-</span>
                            }
                          </td>
                          <td class="text-center">
                            @if (hasAction(resource, 'Delete')) {
                              <span class="action-badge action-delete" [title]="getActionTooltip(resource, 'Delete')">✓</span>
                            } @else {
                              <span class="action-badge action-none">-</span>
                            }
                          </td>
                          <td class="text-center">
                            @if (hasAction(resource, 'Manage')) {
                              <span class="action-badge action-manage" [title]="getActionTooltip(resource, 'Manage')">✓</span>
                            } @else {
                              <span class="action-badge action-none">-</span>
                            }
                          </td>
                          <td class="text-center">
                            @if (getOtherActions(resource).length > 0) {
                              <span class="badge bg-secondary-100 text-secondary"
                                    [title]="getOtherActionsTooltip(resource)">
                                {{ getOtherActions(resource).length }}
                              </span>
                            } @else {
                              <span class="action-badge action-none">-</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .permissions-matrix {
      max-height: 70vh;
      overflow-y: auto;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .transition-transform {
      transition: transform 0.2s ease;
    }

    .rotate-90 {
      transform: rotate(90deg);
    }

    .action-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .action-create,
    .action-read,
    .action-update,
    .action-delete,
    .action-manage,
    .action-other {
      background-color: rgba(40, 167, 69, 0.15);
      color: #28a745;
    }

    .action-none {
      background-color: rgba(220, 53, 69, 0.1);
      color: #dc3545;
    }

    .stat-card {
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .category-header:hover {
      background-color: #e9ecef !important;
    }
  `
})
export class PermissionsMatrixComponent implements OnChanges {
  @Input() permissions: Permission[] = [];

  categoryGroups: CategoryGroup[] = [];
  expandedCategories = new Set<string>();

  // Statistics
  totalPermissions = 0;
  totalResources = 0;
  totalCategories = 0;
  fullAccessCount = 0;

  // Standard actions in lowercase for comparison
  private readonly standardActions = ['create', 'read', 'update', 'delete', 'manage'];

  // Normalizes action name to match standard actions
  private normalizeAction(action: string): string {
    const lowerAction = action.toLowerCase();
    // Map common variations
    if (lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('new')) return 'create';
    if (lowerAction.includes('read') || lowerAction.includes('view') || lowerAction.includes('get') || lowerAction.includes('list')) return 'read';
    if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('modify')) return 'update';
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return 'delete';
    if (lowerAction.includes('manage') || lowerAction.includes('admin') || lowerAction.includes('full')) return 'manage';
    return lowerAction;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['permissions']) {
      this.buildMatrix();
    }
  }

  private buildMatrix(): void {
    if (!this.permissions || this.permissions.length === 0) {
      this.categoryGroups = [];
      this.resetStats();
      return;
    }

    // Group by category first, then by resource
    const categoryMap = new Map<string, Map<string, ResourcePermissions>>();

    for (const permission of this.permissions) {
      const category = permission.category || 'Other';
      const resource = permission.resource || 'General';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }

      const resourceMap = categoryMap.get(category)!;

      if (!resourceMap.has(resource)) {
        resourceMap.set(resource, {
          resource,
          actions: new Map()
        });
      }

      // Use normalized action as key for standard matching
      const normalizedAction = this.normalizeAction(permission.action);
      resourceMap.get(resource)!.actions.set(normalizedAction, permission);
    }

    // Convert to array structure
    this.categoryGroups = Array.from(categoryMap.entries())
      .map(([category, resourceMap]) => ({
        category,
        resources: Array.from(resourceMap.values()).sort((a, b) =>
          a.resource.localeCompare(b.resource)
        ),
        totalPermissions: Array.from(resourceMap.values())
          .reduce((sum, r) => sum + r.actions.size, 0)
      }))
      .sort((a, b) => a.category.localeCompare(b.category));

    // Expand all categories by default
    this.categoryGroups.forEach(g => this.expandedCategories.add(g.category));

    // Calculate statistics
    this.calculateStats();
  }

  private resetStats(): void {
    this.totalPermissions = 0;
    this.totalResources = 0;
    this.totalCategories = 0;
    this.fullAccessCount = 0;
  }

  private calculateStats(): void {
    this.totalPermissions = this.permissions.length;
    this.totalCategories = this.categoryGroups.length;
    this.totalResources = this.categoryGroups.reduce((sum, g) => sum + g.resources.length, 0);

    // Count resources with full CRUD access
    this.fullAccessCount = 0;
    for (const group of this.categoryGroups) {
      for (const resource of group.resources) {
        const hasCreate = resource.actions.has('create');
        const hasRead = resource.actions.has('read');
        const hasUpdate = resource.actions.has('update');
        const hasDelete = resource.actions.has('delete');
        if (hasCreate && hasRead && hasUpdate && hasDelete) {
          this.fullAccessCount++;
        }
      }
    }
  }

  toggleCategory(category: string): void {
    if (this.expandedCategories.has(category)) {
      this.expandedCategories.delete(category);
    } else {
      this.expandedCategories.add(category);
    }
  }

  hasAction(resource: ResourcePermissions, action: string): boolean {
    return resource.actions.has(action.toLowerCase());
  }

  getActionTooltip(resource: ResourcePermissions, action: string): string {
    const permission = resource.actions.get(action.toLowerCase());
    if (!permission) return '';
    return `${permission.displayName}\n${permission.description || ''}`;
  }

  getOtherActions(resource: ResourcePermissions): Permission[] {
    const otherPermissions: Permission[] = [];
    resource.actions.forEach((permission, action) => {
      if (!this.standardActions.includes(action.toLowerCase())) {
        otherPermissions.push(permission);
      }
    });
    return otherPermissions;
  }

  getOtherActionsTooltip(resource: ResourcePermissions): string {
    return this.getOtherActions(resource)
      .map(p => `${p.action}: ${p.displayName}`)
      .join('\n');
  }

  formatResourceName(resource: string): string {
    // Convert camelCase or PascalCase to Title Case with spaces
    return resource
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
