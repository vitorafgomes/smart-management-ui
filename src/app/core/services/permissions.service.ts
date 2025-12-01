import { Injectable, inject } from '@angular/core';
import { CurrentUserStore } from '@core/stores/current-user.store';

export interface PermissionCheck {
  resource: string;
  action: string;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private readonly currentUserStore = inject(CurrentUserStore);

  /**
   * Check if the current user has a specific permission
   * @param resource - The resource name (e.g., 'Users', 'Roles', 'Tenant')
   * @param action - The action name (e.g., 'Create', 'Read', 'Update', 'Delete', 'Manage')
   */
  hasPermission(resource: string, action: string): boolean {
    return this.currentUserStore.hasPermission(resource, action);
  }

  /**
   * Check if the current user has any of the specified permissions
   */
  hasAnyPermission(checks: PermissionCheck[]): boolean {
    return this.currentUserStore.hasAnyPermission(checks);
  }

  /**
   * Check if the current user has all of the specified permissions
   */
  hasAllPermissions(checks: PermissionCheck[]): boolean {
    return this.currentUserStore.hasAllPermissions(checks);
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.currentUserStore.isAdmin();
  }

  /**
   * Check if user can view a specific resource
   */
  canView(resource: string): boolean {
    return this.currentUserStore.canView(resource);
  }

  /**
   * Check if user can create a specific resource
   */
  canCreate(resource: string): boolean {
    return this.currentUserStore.canCreate(resource);
  }

  /**
   * Check if user can edit/update a specific resource
   */
  canEdit(resource: string): boolean {
    return this.currentUserStore.canEdit(resource);
  }

  /**
   * Check if user can delete a specific resource
   */
  canDelete(resource: string): boolean {
    return this.currentUserStore.canDelete(resource);
  }

  /**
   * Check if user can manage (full CRUD) a specific resource
   */
  canManage(resource: string): boolean {
    return this.isAdmin() || this.hasPermission(resource, 'Manage');
  }

  // ===== Specific Resource Checks =====

  /**
   * Check if user can edit tenant settings
   */
  canEditTenant(): boolean {
    return this.currentUserStore.canEditTenant();
  }

  /**
   * Check if user can manage users
   */
  canManageUsers(): boolean {
    return this.currentUserStore.canManageUsers();
  }

  /**
   * Check if user can manage roles
   */
  canManageRoles(): boolean {
    return this.currentUserStore.canManageRoles();
  }

  /**
   * Check if user can manage groups
   */
  canManageGroups(): boolean {
    return this.isAdmin() ||
      this.hasPermission('Groups', 'Manage') ||
      this.hasAnyPermission([
        { resource: 'Groups', action: 'Create' },
        { resource: 'Groups', action: 'Update' },
        { resource: 'Groups', action: 'Delete' }
      ]);
  }

  /**
   * Check if user can view audit logs
   */
  canViewAuditLogs(): boolean {
    return this.isAdmin() ||
      this.hasPermission('AuditLogs', 'Read') ||
      this.hasPermission('AuditLogs', 'View');
  }

  /**
   * Check if user can manage subscriptions/billing
   */
  canManageSubscription(): boolean {
    return this.isAdmin() ||
      this.hasPermission('Subscription', 'Manage') ||
      this.hasPermission('Billing', 'Manage');
  }

  /**
   * Check if user can manage branding/customization
   */
  canManageBranding(): boolean {
    return this.isAdmin() ||
      this.hasPermission('Branding', 'Manage') ||
      this.hasPermission('Branding', 'Update');
  }

  /**
   * Check if user can manage integrations
   */
  canManageIntegrations(): boolean {
    return this.isAdmin() ||
      this.hasPermission('Integrations', 'Manage') ||
      this.hasPermission('Integrations', 'Update');
  }

  /**
   * Check if user can edit their own profile
   * Users can always edit their own profile
   */
  canEditOwnProfile(): boolean {
    return true;
  }

  /**
   * Check if user can edit another user's profile
   */
  canEditUserProfile(userId: string): boolean {
    const currentUser = this.currentUserStore.user();

    // Can always edit own profile
    if (currentUser && currentUser.id === userId) {
      return true;
    }

    // Need permission to edit other users
    return this.canManageUsers() || this.canEdit('Users');
  }
}
