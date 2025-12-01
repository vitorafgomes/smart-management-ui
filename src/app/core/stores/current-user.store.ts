import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, forkJoin, of, catchError, Observable } from 'rxjs';
import { User, Tenant, Role, Permission } from '@core/models/domain/identity-tenant';
import { UsersService } from '@core/services/api/identity-tenant/users.service';
import { TenantsService } from '@core/services/api/identity-tenant/tenants.service';
import { RolesService } from '@core/services/api/identity-tenant/roles.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { FilterUsersRequest, FilterRolesRequest } from '@core/models/useCases/identity-tenant';

export interface CurrentUserState {
  user: User | null;
  tenant: Tenant | null;
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

const initialState: CurrentUserState = {
  user: null,
  tenant: null,
  roles: [],
  permissions: [],
  isLoading: false,
  isLoaded: false,
  error: null
};

export const CurrentUserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => ({
    // User computed properties
    fullName: computed(() => {
      const user = store.user();
      if (!user) return '';
      return user.fullName || `${user.firstName} ${user.lastName}`.trim();
    }),

    initials: computed(() => {
      const user = store.user();
      if (!user) return '';
      const first = user.firstName?.charAt(0) || '';
      const last = user.lastName?.charAt(0) || '';
      return `${first}${last}`.toUpperCase();
    }),

    email: computed(() => store.user()?.email || ''),

    avatarUrl: computed(() => store.user()?.avatarUrl || null),

    isAdmin: computed(() => store.user()?.isAdmin || false),

    // Tenant computed properties
    tenantName: computed(() => store.tenant()?.companyName || ''),

    tenantLogo: computed(() => store.tenant()?.logoUrl || null),

    // Roles computed properties
    roleNames: computed(() => store.roles().map(r => r.name)),

    // Permissions computed - aggregated from all roles
    allPermissions: computed(() => {
      const permissions = store.permissions();
      // Remove duplicates by id
      const uniqueMap = new Map<string, Permission>();
      permissions.forEach(p => uniqueMap.set(p.id, p));
      return Array.from(uniqueMap.values());
    }),

    // Permission check helpers
    permissionsByResource: computed(() => {
      const permissions = store.permissions();
      const map = new Map<string, Permission[]>();
      permissions.forEach(p => {
        const existing = map.get(p.resource) || [];
        existing.push(p);
        map.set(p.resource, existing);
      });
      return map;
    }),

    permissionsByCategory: computed(() => {
      const permissions = store.permissions();
      const map = new Map<string, Permission[]>();
      permissions.forEach(p => {
        const category = p.category || 'Other';
        const existing = map.get(category) || [];
        existing.push(p);
        map.set(category, existing);
      });
      return map;
    })
  })),

  withMethods((store) => {
    const usersService = inject(UsersService);
    const tenantsService = inject(TenantsService);
    const rolesService = inject(RolesService);
    const tenantStorage = inject(TenantStorageService);

    // Helper function to load user roles
    const loadUserRolesInternal = (tenantId: string, user: User): Observable<Role[]> => {
      if (!user.userRoles || user.userRoles.length === 0) {
        return of([]);
      }

      // Get all roles for the tenant and filter by user's roles
      const rolesRequest: FilterRolesRequest = {
        tenantId,
        pageFilter: { pageNumber: 1, pageSize: 100 }
      };

      return rolesService.getRolesByFilters(rolesRequest).pipe(
        switchMap((response: any) => {
          const rolesResult = response.pagedResult ?? response;
          const allRoles: Role[] = rolesResult.entries ?? [];

          // Filter to only user's roles
          const userRoleIds = user.userRoles!.map(ur => ur.roleId);
          const userRoles = allRoles.filter(r => userRoleIds.includes(r.id));

          return of(userRoles);
        }),
        catchError(() => of([]))
      );
    };

    // Helper function to save to storage
    const saveToStorageInternal = (data: { user: User | null; tenant: Tenant | null; roles: Role[]; permissions: Permission[] }): void => {
      try {
        sessionStorage.setItem('current_user_data', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save current user data to storage:', error);
      }
    };

    return {
      /**
       * Load current user data after authentication
       * @param keycloakUserId - The Keycloak user ID from the token
       */
      loadCurrentUserData: rxMethod<{ keycloakUserId: string }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ keycloakUserId }) => {
            const tenantSuggestion = tenantStorage.getLastTenant();
            if (!tenantSuggestion) {
              return of({ error: 'No tenant selected' });
            }

            const tenantId = tenantSuggestion.id;

            // First, get the user by keycloakUserId
            const usersRequest: FilterUsersRequest = {
              tenantId,
              keycloakUserId,
              pageFilter: { pageNumber: 1, pageSize: 1 }
            };

            return usersService.getUsersByFilters(usersRequest).pipe(
              switchMap((response: any) => {
                const usersResult = response.users ?? response.pagedResult ?? response;
                const users = usersResult.entries ?? [];

                if (users.length === 0) {
                  return of({ error: 'User not found' });
                }

                const user: User = users[0];

                // Now load tenant and roles in parallel
                return forkJoin({
                  tenant: tenantsService.getTenantById(tenantId).pipe(
                    catchError(() => of(null))
                  ),
                  roles: loadUserRolesInternal(tenantId, user)
                }).pipe(
                  switchMap(({ tenant, roles }) => {
                    // Aggregate all permissions from roles
                    const allPermissions: Permission[] = [];
                    roles.forEach((role: Role) => {
                      if (role.permissions) {
                        allPermissions.push(...role.permissions);
                      }
                    });

                    return of({
                      user,
                      tenant,
                      roles,
                      permissions: allPermissions
                    });
                  })
                );
              }),
              catchError(err => {
                console.error('Error loading current user data:', err);
                return of({ error: 'Failed to load user data' });
              })
            );
          }),
          tap((result: any) => {
            if (result.error) {
              patchState(store, {
                isLoading: false,
                isLoaded: false,
                error: result.error
              });
            } else {
              patchState(store, {
                user: result.user,
                tenant: result.tenant,
                roles: result.roles,
                permissions: result.permissions,
                isLoading: false,
                isLoaded: true,
                error: null
              });

              // Save to sessionStorage for persistence
              saveToStorageInternal(result);
            }
          })
        )
      ),

      /**
       * Load user roles with their permissions
       */
      loadUserRoles(tenantId: string, user: User): Observable<Role[]> {
        return loadUserRolesInternal(tenantId, user);
      },

      /**
       * Check if user has a specific permission
       */
      hasPermission(resource: string, action: string): boolean {
        const permissions = store.permissions();
        return permissions.some(p =>
          p.resource.toLowerCase() === resource.toLowerCase() &&
          p.action.toLowerCase() === action.toLowerCase()
        );
      },

      /**
       * Check if user has any of the specified permissions
       */
      hasAnyPermission(checks: { resource: string; action: string }[]): boolean {
        return checks.some(check => this.hasPermission(check.resource, check.action));
      },

      /**
       * Check if user has all of the specified permissions
       */
      hasAllPermissions(checks: { resource: string; action: string }[]): boolean {
        return checks.every(check => this.hasPermission(check.resource, check.action));
      },

      /**
       * Check if user can edit tenant settings
       */
      canEditTenant(): boolean {
        return store.isAdmin() ||
          this.hasPermission('Tenant', 'Update') ||
          this.hasPermission('TenantSettings', 'Update') ||
          this.hasPermission('Tenant', 'Manage');
      },

      /**
       * Check if user can manage users
       */
      canManageUsers(): boolean {
        return store.isAdmin() ||
          this.hasPermission('Users', 'Manage') ||
          this.hasAnyPermission([
            { resource: 'Users', action: 'Create' },
            { resource: 'Users', action: 'Update' },
            { resource: 'Users', action: 'Delete' }
          ]);
      },

      /**
       * Check if user can manage roles
       */
      canManageRoles(): boolean {
        return store.isAdmin() ||
          this.hasPermission('Roles', 'Manage') ||
          this.hasAnyPermission([
            { resource: 'Roles', action: 'Create' },
            { resource: 'Roles', action: 'Update' },
            { resource: 'Roles', action: 'Delete' }
          ]);
      },

      /**
       * Check if user can view specific resource
       */
      canView(resource: string): boolean {
        return store.isAdmin() ||
          this.hasPermission(resource, 'Read') ||
          this.hasPermission(resource, 'View') ||
          this.hasPermission(resource, 'Manage');
      },

      /**
       * Check if user can edit specific resource
       */
      canEdit(resource: string): boolean {
        return store.isAdmin() ||
          this.hasPermission(resource, 'Update') ||
          this.hasPermission(resource, 'Edit') ||
          this.hasPermission(resource, 'Manage');
      },

      /**
       * Check if user can create specific resource
       */
      canCreate(resource: string): boolean {
        return store.isAdmin() ||
          this.hasPermission(resource, 'Create') ||
          this.hasPermission(resource, 'Manage');
      },

      /**
       * Check if user can delete specific resource
       */
      canDelete(resource: string): boolean {
        return store.isAdmin() ||
          this.hasPermission(resource, 'Delete') ||
          this.hasPermission(resource, 'Manage');
      },

      /**
       * Update current user profile
       */
      updateUserProfile(updates: Partial<User>): void {
        const currentUser = store.user();
        if (currentUser) {
          patchState(store, {
            user: { ...currentUser, ...updates }
          });
          saveToStorageInternal({
            user: { ...currentUser, ...updates },
            tenant: store.tenant(),
            roles: store.roles(),
            permissions: store.permissions()
          });
        }
      },

      /**
       * Save current user data to sessionStorage
       */
      saveToStorage(data: { user: User | null; tenant: Tenant | null; roles: Role[]; permissions: Permission[] }): void {
        saveToStorageInternal(data);
      },

      /**
       * Restore current user data from sessionStorage
       */
      restoreFromStorage(): boolean {
        try {
          const stored = sessionStorage.getItem('current_user_data');
          if (stored) {
            const data = JSON.parse(stored);
            patchState(store, {
              user: data.user,
              tenant: data.tenant,
              roles: data.roles || [],
              permissions: data.permissions || [],
              isLoading: false,
              isLoaded: true,
              error: null
            });
            return true;
          }
          return false;
        } catch (error) {
          console.warn('Failed to restore current user data from storage:', error);
          return false;
        }
      },

      /**
       * Clear all current user data
       */
      clear(): void {
        sessionStorage.removeItem('current_user_data');
        patchState(store, initialState);
      },

      /**
       * Refresh current user data from API
       */
      refresh(keycloakUserId: string): void {
        this.loadCurrentUserData({ keycloakUserId });
      }
    };
  })
);
