import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { CurrentUserStore } from '@core/stores/current-user.store';

/**
 * Structural directive that conditionally includes a template based on user permissions.
 *
 * Usage:
 * ```html
 * <!-- Single permission check -->
 * <button *hasPermission="'Users:Create'">Create User</button>
 *
 * <!-- With resource and action separated -->
 * <button *hasPermission="{ resource: 'Users', action: 'Create' }">Create User</button>
 *
 * <!-- Check multiple permissions (ANY) -->
 * <div *hasPermission="['Users:Create', 'Users:Update']">Has create or update</div>
 *
 * <!-- Check if user is admin -->
 * <div *hasPermission="'admin'">Admin only content</div>
 * ```
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly currentUserStore = inject(CurrentUserStore);

  private hasView = false;

  @Input() set hasPermission(permission: string | string[] | { resource: string; action: string }) {
    // Create effect to react to permission changes
    effect(() => {
      const hasAccess = this.checkPermission(permission);
      this.updateView(hasAccess);
    }, { allowSignalWrites: true });
  }

  private checkPermission(permission: string | string[] | { resource: string; action: string }): boolean {
    // Check if user is admin (admins have all permissions)
    if (this.currentUserStore.isAdmin()) {
      return true;
    }

    // Handle 'admin' special case
    if (permission === 'admin') {
      return this.currentUserStore.isAdmin();
    }

    // Handle string format "Resource:Action"
    if (typeof permission === 'string') {
      const [resource, action] = permission.split(':');
      if (resource && action) {
        return this.currentUserStore.hasPermission(resource, action);
      }
      // If no action specified, check for any access to resource
      return this.currentUserStore.canView(resource);
    }

    // Handle array of permissions (OR logic)
    if (Array.isArray(permission)) {
      return permission.some(p => {
        if (typeof p === 'string') {
          const [resource, action] = p.split(':');
          return this.currentUserStore.hasPermission(resource, action);
        }
        return false;
      });
    }

    // Handle object format { resource, action }
    if (permission && typeof permission === 'object') {
      return this.currentUserStore.hasPermission(permission.resource, permission.action);
    }

    return false;
  }

  private updateView(hasAccess: boolean): void {
    if (hasAccess && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Directive that hides content if user does NOT have the permission.
 * Opposite of hasPermission.
 *
 * Usage:
 * ```html
 * <div *hideIfHasPermission="'admin'">Show only to non-admins</div>
 * ```
 */
@Directive({
  selector: '[hideIfHasPermission]',
  standalone: true
})
export class HideIfHasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly currentUserStore = inject(CurrentUserStore);

  private hasView = false;

  @Input() set hideIfHasPermission(permission: string | string[] | { resource: string; action: string }) {
    effect(() => {
      const hasAccess = this.checkPermission(permission);
      this.updateView(!hasAccess); // Note: inverted logic
    }, { allowSignalWrites: true });
  }

  private checkPermission(permission: string | string[] | { resource: string; action: string }): boolean {
    if (this.currentUserStore.isAdmin()) {
      return true;
    }

    if (permission === 'admin') {
      return this.currentUserStore.isAdmin();
    }

    if (typeof permission === 'string') {
      const [resource, action] = permission.split(':');
      if (resource && action) {
        return this.currentUserStore.hasPermission(resource, action);
      }
      return this.currentUserStore.canView(resource);
    }

    if (Array.isArray(permission)) {
      return permission.some(p => {
        if (typeof p === 'string') {
          const [resource, action] = p.split(':');
          return this.currentUserStore.hasPermission(resource, action);
        }
        return false;
      });
    }

    if (permission && typeof permission === 'object') {
      return this.currentUserStore.hasPermission(permission.resource, permission.action);
    }

    return false;
  }

  private updateView(show: boolean): void {
    if (show && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!show && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
