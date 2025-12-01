import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
  withHooks,
} from '@ngrx/signals';
import {
  withEntities,
  addEntity,
  updateEntity,
  removeEntity,
  setAllEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, debounceTime, distinctUntilChanged } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

import { Role } from '@core/models/domain/identity-tenant/identities/role';
import { AddRoleRequest, FilterRolesRequest, FilteringOperation } from '@core/models/useCases/identity-tenant';
import { RolesService } from '@core/services/api/identity-tenant/roles.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { PageFilter } from '@core/models/common/page-filter';
import { PagedResult } from '@core/models/common/paged-result';

import { withLoading } from '../shared/with-loading.feature';
import { withPagination } from '../shared/with-pagination.feature';
import { withSelection } from '../shared/with-selection.feature';

// ============================================================================
// Types
// ============================================================================

export type RolesFilter = PageFilter & {
  searchTerm?: string;
  isActive?: boolean;
  isSystemRole?: boolean;
  tenantId?: string;
};

type RolesState = {
  filter: RolesFilter;
  lastUpdated: Date | null;
};

const initialState: RolesState = {
  filter: {
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
  },
  lastUpdated: null,
};

// ============================================================================
// Store
// ============================================================================

export const RolesStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),
  withLoading(),
  withPagination({ pageSize: 10 }),
  withSelection<string>(),
  withEntities<Role>(),

  withComputed((store) => ({
    /**
     * Retorna a role selecionada atualmente
     */
    selectedRole: computed(() => {
      const id = store.selectedId();
      if (!id) return null;
      return store.entityMap()[id] ?? null;
    }),

    /**
     * Retorna apenas roles ativas
     */
    activeRoles: computed(() =>
      store.entities().filter(role => role.isActive)
    ),

    /**
     * Retorna apenas roles do sistema
     */
    systemRoles: computed(() =>
      store.entities().filter(role => role.isSystemRole)
    ),

    /**
     * Retorna apenas roles customizadas (não do sistema)
     */
    customRoles: computed(() =>
      store.entities().filter(role => !role.isSystemRole)
    ),

    /**
     * Retorna roles compostas
     */
    compositeRoles: computed(() =>
      store.entities().filter(role => role.isComposite)
    ),

    /**
     * Roles ordenadas por prioridade
     */
    rolesByPriority: computed(() =>
      [...store.entities()].sort((a, b) => a.priority - b.priority)
    ),

    /**
     * Contagem de roles ativas
     */
    activeRolesCount: computed(() =>
      store.entities().filter(role => role.isActive).length
    ),

    /**
     * Total de usuários em todas as roles
     */
    totalUsersInRoles: computed(() =>
      store.entities().reduce((sum, role) => sum + role.userCount, 0)
    ),

    /**
     * Retorna o filtro atual combinado com a paginação
     */
    currentFilter: computed<RolesFilter>(() => ({
      ...store.filter(),
      pageNumber: store.pageNumber(),
      pageSize: store.pageSize(),
    })),

    /**
     * IDs de todas as roles
     */
    allRoleIds: computed(() => store.ids() as string[]),
  })),

  withMethods((store, rolesService = inject(RolesService), tenantStorage = inject(TenantStorageService)) => {
    // Helper to convert internal filter to FilterRolesRequest
    const toFilterRequest = (filter: RolesFilter): FilterRolesRequest => {
      const tenant = tenantStorage.getLastTenant();
      if (!tenant) {
        throw new Error('No tenant selected');
      }
      return {
        tenantId: tenant.id,
        name: filter.searchTerm || undefined,
        nameFilteringOperation: filter.searchTerm ? FilteringOperation.Contains : undefined,
        isActive: filter.isActive,
        isSystemRole: filter.isSystemRole,
        pageFilter: {
          pageNumber: filter.pageNumber,
          pageSize: filter.pageSize,
        },
      };
    };

    return {
    // ========================================================================
    // Operações de Leitura
    // ========================================================================

    /**
     * Carrega roles com filtros
     */
    loadRoles: rxMethod<RolesFilter | void>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((filter) => {
          const currentFilter = filter ?? store.currentFilter();
          const request = toFilterRequest(currentFilter);
          return rolesService.getRolesByFilters(request).pipe(
            tapResponse({
              next: (result: PagedResult<Role>) => {
                patchState(store, setAllEntities(result.entries));
                store.updatePaginationFromResponse(result);
                store.finishOperation();
                patchState(store, { lastUpdated: new Date() });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao carregar roles');
              },
            })
          );
        })
      )
    ),

    /**
     * Carrega uma role específica por ID
     */
    loadRoleById: rxMethod<string>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((id) =>
          rolesService.getRoleById(id).pipe(
            tapResponse({
              next: (role: Role) => {
                const exists = store.entityMap()[role.id];
                if (exists) {
                  patchState(store, updateEntity({ id: role.id, changes: role }));
                } else {
                  patchState(store, addEntity(role));
                }
                store.finishOperation();
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao carregar role');
              },
            })
          )
        )
      )
    ),

    /**
     * Busca roles com debounce
     */
    searchRoles: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((searchTerm) => {
          patchState(store, {
            filter: { ...store.filter(), searchTerm },
          });
          store.setPage(1);
        }),
        switchMap((searchTerm) => {
          store.startOperation();
          const filter = { ...store.currentFilter(), searchTerm };
          const request = toFilterRequest(filter);
          return rolesService.getRolesByFilters(request).pipe(
            tapResponse({
              next: (result: PagedResult<Role>) => {
                patchState(store, setAllEntities(result.entries));
                store.updatePaginationFromResponse(result);
                store.finishOperation();
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro na busca');
              },
            })
          );
        })
      )
    ),

    // ========================================================================
    // Operações de Escrita
    // ========================================================================

    /**
     * Adiciona uma nova role
     */
    addRole: rxMethod<AddRoleRequest>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((request) =>
          rolesService.addRole(request).pipe(
            tapResponse({
              next: () => {
                store.finishOperation();
                const currentFilter = store.currentFilter();
                const request = toFilterRequest(currentFilter);
                rolesService.getRolesByFilters(request).subscribe({
                  next: (result) => {
                    patchState(store, setAllEntities(result.entries));
                    store.updatePaginationFromResponse(result);
                    patchState(store, { lastUpdated: new Date() });
                  },
                });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao adicionar role');
              },
            })
          )
        )
      )
    ),

    /**
     * Atualiza uma role existente
     */
    updateRole: rxMethod<{ id: string; patchDocument: any }>(
      pipe(
        tap(() => store.startOperation()),
        switchMap(({ id, patchDocument }) =>
          rolesService.updateRole(id, patchDocument).pipe(
            tapResponse({
              next: () => {
                rolesService.getRoleById(id).subscribe({
                  next: (role) => {
                    patchState(store, updateEntity({ id, changes: role }));
                    store.finishOperation();
                    patchState(store, { lastUpdated: new Date() });
                  },
                });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao atualizar role');
              },
            })
          )
        )
      )
    ),

    /**
     * Remove uma role
     */
    deleteRole: rxMethod<string>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((id) =>
          rolesService.deleteRole(id).pipe(
            tapResponse({
              next: () => {
                patchState(store, removeEntity(id));
                if (store.selectedId() === id) {
                  store.clearSelection();
                }
                store.finishOperation();
                patchState(store, { lastUpdated: new Date() });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao remover role');
              },
            })
          )
        )
      )
    ),

    /**
     * Remove múltiplas roles selecionadas
     */
    deleteSelectedRoles(): void {
      const selectedIds = store.selectedIds();
      if (selectedIds.length === 0) return;

      // Filtra roles do sistema que não podem ser deletadas
      const deletableIds = selectedIds.filter(id => {
        const role = store.entityMap()[id];
        return role && !role.isSystemRole;
      });

      if (deletableIds.length === 0) {
        store.setError('Roles do sistema não podem ser removidas');
        return;
      }

      store.startOperation();

      const deletePromises = deletableIds.map(id =>
        rolesService.deleteRole(id).toPromise()
      );

      Promise.all(deletePromises)
        .then(() => {
          deletableIds.forEach(id => {
            patchState(store, removeEntity(id));
          });
          store.clearSelection();
          store.finishOperation();
          patchState(store, { lastUpdated: new Date() });
        })
        .catch((error) => {
          store.finishWithError(error.message || 'Erro ao remover roles');
        });
    },

    // ========================================================================
    // Operações de Filtro
    // ========================================================================

    setFilter(filter: Partial<RolesFilter>): void {
      patchState(store, {
        filter: { ...store.filter(), ...filter },
      });
    },

    filterByActiveStatus(isActive: boolean | undefined): void {
      patchState(store, {
        filter: { ...store.filter(), isActive },
      });
      store.setPage(1);
    },

    filterBySystemRole(isSystemRole: boolean | undefined): void {
      patchState(store, {
        filter: { ...store.filter(), isSystemRole },
      });
      store.setPage(1);
    },

    clearFilters(): void {
      patchState(store, {
        filter: initialState.filter,
      });
      store.resetPagination();
    },

    refresh(): void {
      const filter = store.currentFilter();
      const request = toFilterRequest(filter);
      store.startOperation();
      rolesService.getRolesByFilters(request).subscribe({
        next: (result) => {
          patchState(store, setAllEntities(result.entries));
          store.updatePaginationFromResponse(result);
          store.finishOperation();
          patchState(store, { lastUpdated: new Date() });
        },
        error: (error) => {
          store.finishWithError(error.message || 'Erro ao atualizar');
        },
      });
    },

    // ========================================================================
    // Utilitários
    // ========================================================================

    /**
     * Obtém role por ID do cache
     */
    getRoleById(id: string): Role | undefined {
      return store.entityMap()[id];
    },

    /**
     * Verifica se uma role pode ser deletada
     */
    canDeleteRole(id: string): boolean {
      const role = store.entityMap()[id];
      return role ? !role.isSystemRole : false;
    },
  };}),

  withHooks({
    onInit(store) {
      // store.loadRoles();
    },
  })
);

export type RolesStoreType = InstanceType<typeof RolesStore>;
