import { Injectable, inject, computed } from '@angular/core';

// Stores
import { UsersStore, UsersFilter } from './users/users.store';
import { RolesStore, RolesFilter } from './roles/roles.store';
import { GroupsStore, GroupsFilter } from './groups/groups.store';
import { TenantsStore, TenantsFilter, TenantStatus, TenantLocaleSettings } from './tenants/tenants.store';

// Models
import { User } from '@core/models/domain/identity-tenant/identities/user';
import { Role } from '@core/models/domain/identity-tenant/identities/role';
import { Group } from '@core/models/domain/identity-tenant/identities/group';
import { Tenant } from '@core/models/domain/identity-tenant/tenants/tenant';

// DTOs
import { AddUserRequest } from '@core/models/useCases/identity-tenant/users/add-user-request';
import { AddRoleRequest } from '@core/models/useCases/identity-tenant/roles/add-role-request';
import { AddGroupRequest } from '@core/models/useCases/identity-tenant/groups/add-group-request';
import { AddTenant } from '@core/models/useCases/identity-tenant/tenants/add-tenant';

/**
 * Facade para o domínio Identity-Tenant.
 *
 * Centraliza o acesso aos stores do domínio, fornecendo uma API unificada
 * para os componentes consumirem.
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     @for (user of facade.users(); track user.id) {
 *       <app-user-card [user]="user" />
 *     }
 *   `
 * })
 * export class UsersPageComponent {
 *   readonly facade = inject(IdentityTenantFacade);
 *
 *   ngOnInit() {
 *     this.facade.loadUsers();
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class IdentityTenantFacade {
  // ==========================================================================
  // Store Injections
  // ==========================================================================

  private readonly usersStore = inject(UsersStore);
  private readonly rolesStore = inject(RolesStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly tenantsStore = inject(TenantsStore);

  // ==========================================================================
  // USERS - Signals
  // ==========================================================================

  readonly users = this.usersStore.entities;
  readonly usersMap = this.usersStore.entityMap;
  readonly selectedUser = this.usersStore.selectedUser;
  readonly selectedUserIds = this.usersStore.selectedIds;
  readonly activeUsers = this.usersStore.activeUsers;
  readonly adminUsers = this.usersStore.adminUsers;
  readonly activeUsersCount = this.usersStore.activeUsersCount;

  // ==========================================================================
  // ROLES - Signals
  // ==========================================================================

  readonly roles = this.rolesStore.entities;
  readonly rolesMap = this.rolesStore.entityMap;
  readonly selectedRole = this.rolesStore.selectedRole;
  readonly selectedRoleIds = this.rolesStore.selectedIds;
  readonly activeRoles = this.rolesStore.activeRoles;
  readonly systemRoles = this.rolesStore.systemRoles;
  readonly customRoles = this.rolesStore.customRoles;
  readonly rolesByPriority = this.rolesStore.rolesByPriority;
  readonly activeRolesCount = this.rolesStore.activeRolesCount;

  // ==========================================================================
  // GROUPS - Signals
  // ==========================================================================

  readonly groups = this.groupsStore.entities;
  readonly groupsMap = this.groupsStore.entityMap;
  readonly selectedGroup = this.groupsStore.selectedGroup;
  readonly selectedGroupIds = this.groupsStore.selectedIds;
  readonly activeGroups = this.groupsStore.activeGroups;
  readonly systemGroups = this.groupsStore.systemGroups;
  readonly rootGroups = this.groupsStore.rootGroups;
  readonly groupsTree = this.groupsStore.groupsTree;
  readonly activeGroupsCount = this.groupsStore.activeGroupsCount;
  readonly totalGroupMembers = this.groupsStore.totalMembers;

  // ==========================================================================
  // TENANTS - Signals
  // ==========================================================================

  readonly tenants = this.tenantsStore.entities;
  readonly tenantsMap = this.tenantsStore.entityMap;
  readonly selectedTenant = this.tenantsStore.selectedTenant;
  readonly currentTenant = this.tenantsStore.currentTenant;
  readonly selectedTenantIds = this.tenantsStore.selectedIds;
  readonly activeTenants = this.tenantsStore.activeTenants;
  readonly suspendedTenants = this.tenantsStore.suspendedTenants;
  readonly pendingTenants = this.tenantsStore.pendingTenants;
  readonly tenantStatusCounts = this.tenantsStore.statusCounts;
  readonly tenantsByRegion = this.tenantsStore.tenantsByRegion;
  readonly tenantsByCountry = this.tenantsStore.tenantsByCountry;
  readonly availableRegions = this.tenantsStore.availableRegions;
  readonly availableCountries = this.tenantsStore.availableCountries;

  // ==========================================================================
  // Estado Global - Loading
  // ==========================================================================

  readonly usersLoading = this.usersStore.isLoading;
  readonly rolesLoading = this.rolesStore.isLoading;
  readonly groupsLoading = this.groupsStore.isLoading;
  readonly tenantsLoading = this.tenantsStore.isLoading;

  readonly isAnyLoading = computed(() =>
    this.usersLoading() ||
    this.rolesLoading() ||
    this.groupsLoading() ||
    this.tenantsLoading()
  );

  // ==========================================================================
  // Estado Global - Errors
  // ==========================================================================

  readonly usersError = this.usersStore.error;
  readonly rolesError = this.rolesStore.error;
  readonly groupsError = this.groupsStore.error;
  readonly tenantsError = this.tenantsStore.error;

  readonly hasAnyError = computed(() =>
    this.usersStore.hasError() ||
    this.rolesStore.hasError() ||
    this.groupsStore.hasError() ||
    this.tenantsStore.hasError()
  );

  readonly allErrors = computed(() => {
    const errors: string[] = [];
    if (this.usersError()) errors.push(`Users: ${this.usersError()}`);
    if (this.rolesError()) errors.push(`Roles: ${this.rolesError()}`);
    if (this.groupsError()) errors.push(`Groups: ${this.groupsError()}`);
    if (this.tenantsError()) errors.push(`Tenants: ${this.tenantsError()}`);
    return errors;
  });

  // ==========================================================================
  // Paginação - Users
  // ==========================================================================

  readonly usersPageNumber = this.usersStore.pageNumber;
  readonly usersPageSize = this.usersStore.pageSize;
  readonly usersTotalResults = this.usersStore.totalResults;
  readonly usersTotalPages = this.usersStore.totalPages;
  readonly usersHasNextPage = this.usersStore.hasNextPage;
  readonly usersHasPreviousPage = this.usersStore.hasPreviousPage;

  // ==========================================================================
  // Computed - Estatísticas do Domínio
  // ==========================================================================

  readonly domainSummary = computed(() => ({
    users: {
      total: this.users().length,
      active: this.activeUsersCount(),
      admins: this.adminUsers().length,
    },
    roles: {
      total: this.roles().length,
      active: this.activeRolesCount(),
      system: this.systemRoles().length,
      custom: this.customRoles().length,
    },
    groups: {
      total: this.groups().length,
      active: this.activeGroupsCount(),
      totalMembers: this.totalGroupMembers(),
    },
    tenants: {
      total: this.tenants().length,
      ...this.tenantStatusCounts(),
    },
  }));

  readonly isReady = computed(() =>
    !this.isAnyLoading() && !this.hasAnyError()
  );

  // ==========================================================================
  // USERS - Métodos
  // ==========================================================================

  loadUsers(filter?: UsersFilter): void {
    this.usersStore.loadUsers(filter);
  }

  loadUserById(id: string): void {
    this.usersStore.loadUserById(id);
  }

  searchUsers(term: string): void {
    this.usersStore.searchUsers(term);
  }

  addUser(request: AddUserRequest): void {
    this.usersStore.addUser(request);
  }

  updateUser(id: string, patchDocument: any): void {
    this.usersStore.updateUser({ id, patchDocument });
  }

  deleteUser(id: string): void {
    this.usersStore.deleteUser(id);
  }

  deleteSelectedUsers(): void {
    this.usersStore.deleteSelectedUsers();
  }

  selectUser(id: string): void {
    this.usersStore.select(id);
  }

  toggleUserSelection(id: string): void {
    this.usersStore.toggleSelection(id);
  }

  selectAllUsers(): void {
    this.usersStore.selectAll(this.usersStore.allUserIds());
  }

  clearUserSelection(): void {
    this.usersStore.clearSelection();
  }

  refreshUsers(): void {
    this.usersStore.refresh();
  }

  // ==========================================================================
  // ROLES - Métodos
  // ==========================================================================

  loadRoles(filter?: RolesFilter): void {
    this.rolesStore.loadRoles(filter);
  }

  loadRoleById(id: string): void {
    this.rolesStore.loadRoleById(id);
  }

  searchRoles(term: string): void {
    this.rolesStore.searchRoles(term);
  }

  addRole(request: AddRoleRequest): void {
    this.rolesStore.addRole(request);
  }

  updateRole(id: string, patchDocument: any): void {
    this.rolesStore.updateRole({ id, patchDocument });
  }

  deleteRole(id: string): void {
    this.rolesStore.deleteRole(id);
  }

  deleteSelectedRoles(): void {
    this.rolesStore.deleteSelectedRoles();
  }

  selectRole(id: string): void {
    this.rolesStore.select(id);
  }

  toggleRoleSelection(id: string): void {
    this.rolesStore.toggleSelection(id);
  }

  selectAllRoles(): void {
    this.rolesStore.selectAll(this.rolesStore.allRoleIds());
  }

  clearRoleSelection(): void {
    this.rolesStore.clearSelection();
  }

  refreshRoles(): void {
    this.rolesStore.refresh();
  }

  canDeleteRole(id: string): boolean {
    return this.rolesStore.canDeleteRole(id);
  }

  // ==========================================================================
  // GROUPS - Métodos
  // ==========================================================================

  loadGroups(filter?: GroupsFilter): void {
    this.groupsStore.loadGroups(filter);
  }

  loadGroupById(id: string): void {
    this.groupsStore.loadGroupById(id);
  }

  searchGroups(term: string): void {
    this.groupsStore.searchGroups(term);
  }

  addGroup(request: AddGroupRequest): void {
    this.groupsStore.addGroup(request);
  }

  updateGroup(id: string, patchDocument: any): void {
    this.groupsStore.updateGroup({ id, patchDocument });
  }

  deleteGroup(id: string): void {
    this.groupsStore.deleteGroup(id);
  }

  deleteSelectedGroups(): void {
    this.groupsStore.deleteSelectedGroups();
  }

  selectGroup(id: string): void {
    this.groupsStore.select(id);
  }

  toggleGroupSelection(id: string): void {
    this.groupsStore.toggleSelection(id);
  }

  selectAllGroups(): void {
    this.groupsStore.selectAll(this.groupsStore.allGroupIds());
  }

  clearGroupSelection(): void {
    this.groupsStore.clearSelection();
  }

  refreshGroups(): void {
    this.groupsStore.refresh();
  }

  canDeleteGroup(id: string): boolean {
    return this.groupsStore.canDeleteGroup(id);
  }

  getGroupPath(id: string): Group[] {
    return this.groupsStore.getGroupPath(id);
  }

  getChildGroups(parentId: string): Group[] {
    return this.groupsStore.getChildGroups()(parentId);
  }

  // ==========================================================================
  // TENANTS - Métodos
  // ==========================================================================

  loadTenants(filter?: TenantsFilter): void {
    this.tenantsStore.loadTenants(filter);
  }

  loadTenantById(id: string): void {
    this.tenantsStore.loadTenantById(id);
  }

  searchTenants(term: string): void {
    this.tenantsStore.searchTenants(term);
  }

  addTenant(request: AddTenant): void {
    this.tenantsStore.addTenant(request);
  }

  updateTenant(id: string, patchDocument: any): void {
    this.tenantsStore.updateTenant({ id, patchDocument });
  }

  deleteTenant(id: string): void {
    this.tenantsStore.deleteTenant(id);
  }

  deleteSelectedTenants(): void {
    this.tenantsStore.deleteSelectedTenants();
  }

  selectTenant(id: string): void {
    this.tenantsStore.select(id);
  }

  toggleTenantSelection(id: string): void {
    this.tenantsStore.toggleSelection(id);
  }

  selectAllTenants(): void {
    this.tenantsStore.selectAll(this.tenantsStore.allTenantIds());
  }

  clearTenantSelection(): void {
    this.tenantsStore.clearSelection();
  }

  refreshTenants(): void {
    this.tenantsStore.refresh();
  }

  setCurrentTenant(tenantId: string | null): void {
    this.tenantsStore.setCurrentTenant(tenantId);
  }

  loadAndSetCurrentTenant(tenantId: string): void {
    this.tenantsStore.loadAndSetCurrentTenant(tenantId);
  }

  filterTenantsByStatus(status: TenantStatus | undefined): void {
    this.tenantsStore.filterByStatus(status);
    this.tenantsStore.loadTenants();
  }

  filterTenantsByRegion(regionCode: string | undefined): void {
    this.tenantsStore.filterByRegion(regionCode);
    this.tenantsStore.loadTenants();
  }

  getTenantLocaleSettings(id: string): TenantLocaleSettings | null {
    return this.tenantsStore.getTenantLocaleSettings(id);
  }

  // ==========================================================================
  // Paginação - Métodos Genéricos
  // ==========================================================================

  goToUsersPage(page: number): void {
    this.usersStore.setPage(page);
    this.usersStore.loadUsers();
  }

  nextUsersPage(): void {
    this.usersStore.nextPage();
    this.usersStore.loadUsers();
  }

  previousUsersPage(): void {
    this.usersStore.previousPage();
    this.usersStore.loadUsers();
  }

  setUsersPageSize(size: number): void {
    this.usersStore.setPageSize(size);
    this.usersStore.loadUsers();
  }

  // ==========================================================================
  // Utilitários Globais
  // ==========================================================================

  clearAllErrors(): void {
    this.usersStore.clearError();
    this.rolesStore.clearError();
    this.groupsStore.clearError();
    this.tenantsStore.clearError();
  }

  clearAllSelections(): void {
    this.usersStore.clearSelection();
    this.rolesStore.clearSelection();
    this.groupsStore.clearSelection();
    this.tenantsStore.clearSelection();
  }

  refreshAll(): void {
    this.usersStore.refresh();
    this.rolesStore.refresh();
    this.groupsStore.refresh();
    this.tenantsStore.refresh();
  }

  /**
   * Carrega dados iniciais do domínio
   */
  loadInitialData(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadGroups();
    this.loadTenants();
  }

  // ==========================================================================
  // Workflows Compostos
  // ==========================================================================

  /**
   * Carrega dados relacionados a um usuário específico
   */
  loadUserWithRelations(userId: string): void {
    this.loadUserById(userId);
    // Aqui você pode adicionar lógica para carregar roles/groups do usuário
  }

  /**
   * Obtém entidade por ID do cache
   */
  getUserById(id: string): User | undefined {
    return this.usersMap()[id];
  }

  getRoleById(id: string): Role | undefined {
    return this.rolesMap()[id];
  }

  getGroupById(id: string): Group | undefined {
    return this.groupsMap()[id];
  }

  getTenantById(id: string): Tenant | undefined {
    return this.tenantsMap()[id];
  }
}
