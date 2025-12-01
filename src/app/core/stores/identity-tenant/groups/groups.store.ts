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

import { Group } from '@core/models/domain/identity-tenant/identities/group';
import { AddGroupRequest, FilterGroupsRequest, FilteringOperation } from '@core/models/useCases/identity-tenant';
import { GroupsService } from '@core/services/api/identity-tenant/groups.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { PageFilter } from '@core/models/common/page-filter';
import { PagedResult } from '@core/models/common/paged-result';

import { withLoading } from '../shared/with-loading.feature';
import { withPagination } from '../shared/with-pagination.feature';
import { withSelection } from '../shared/with-selection.feature';

// ============================================================================
// Types
// ============================================================================

export type GroupsFilter = PageFilter & {
  searchTerm?: string;
  isActive?: boolean;
  isSystemGroup?: boolean;
  parentGroupId?: string;
  tenantId?: string;
};

type GroupsState = {
  filter: GroupsFilter;
  lastUpdated: Date | null;
};

const initialState: GroupsState = {
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

export const GroupsStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),
  withLoading(),
  withPagination({ pageSize: 10 }),
  withSelection<string>(),
  withEntities<Group>(),

  withComputed((store) => ({
    /**
     * Retorna o grupo selecionado atualmente
     */
    selectedGroup: computed(() => {
      const id = store.selectedId();
      if (!id) return null;
      return store.entityMap()[id] ?? null;
    }),

    /**
     * Retorna apenas grupos ativos
     */
    activeGroups: computed(() =>
      store.entities().filter(group => group.isActive)
    ),

    /**
     * Retorna apenas grupos do sistema
     */
    systemGroups: computed(() =>
      store.entities().filter(group => group.isSystemGroup)
    ),

    /**
     * Retorna apenas grupos customizados
     */
    customGroups: computed(() =>
      store.entities().filter(group => !group.isSystemGroup)
    ),

    /**
     * Retorna grupos raiz (sem parent)
     */
    rootGroups: computed(() =>
      store.entities().filter(group => !group.parentGroupId)
    ),

    /**
     * Retorna grupos filhos de um parent específico
     */
    getChildGroups: computed(() => (parentId: string) =>
      store.entities().filter(group => group.parentGroupId === parentId)
    ),

    /**
     * Contagem de grupos ativos
     */
    activeGroupsCount: computed(() =>
      store.entities().filter(group => group.isActive).length
    ),

    /**
     * Total de membros em todos os grupos
     */
    totalMembers: computed(() =>
      store.entities().reduce((sum, group) => sum + group.memberCount, 0)
    ),

    /**
     * Árvore hierárquica de grupos
     */
    groupsTree: computed(() => {
      const groups = store.entities();
      const rootGroups = groups.filter(g => !g.parentGroupId);

      const buildTree = (parent: Group): GroupTreeNode => ({
        ...parent,
        children: groups
          .filter(g => g.parentGroupId === parent.id)
          .map(buildTree),
      });

      return rootGroups.map(buildTree);
    }),

    /**
     * Retorna o filtro atual combinado com a paginação
     */
    currentFilter: computed<GroupsFilter>(() => ({
      ...store.filter(),
      pageNumber: store.pageNumber(),
      pageSize: store.pageSize(),
    })),

    /**
     * IDs de todos os grupos
     */
    allGroupIds: computed(() => store.ids() as string[]),
  })),

  withMethods((store, groupsService = inject(GroupsService), tenantStorage = inject(TenantStorageService)) => {
    // Helper to convert internal filter to FilterGroupsRequest
    const toFilterRequest = (filter: GroupsFilter): FilterGroupsRequest => {
      const tenant = tenantStorage.getLastTenant();
      if (!tenant) {
        throw new Error('No tenant selected');
      }
      return {
        tenantId: tenant.id,
        name: filter.searchTerm || undefined,
        nameFilteringOperation: filter.searchTerm ? FilteringOperation.Contains : undefined,
        isActive: filter.isActive,
        isSystemGroup: filter.isSystemGroup,
        parentGroupId: filter.parentGroupId,
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
     * Carrega grupos com filtros
     */
    loadGroups: rxMethod<GroupsFilter | void>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((filter) => {
          const currentFilter = filter ?? store.currentFilter();
          const request = toFilterRequest(currentFilter);
          return groupsService.getGroupsByFilters(request).pipe(
            tapResponse({
              next: (result: PagedResult<Group>) => {
                patchState(store, setAllEntities(result.entries));
                store.updatePaginationFromResponse(result);
                store.finishOperation();
                patchState(store, { lastUpdated: new Date() });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao carregar grupos');
              },
            })
          );
        })
      )
    ),

    /**
     * Carrega um grupo específico por ID
     */
    loadGroupById: rxMethod<string>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((id) =>
          groupsService.getGroupById(id).pipe(
            tapResponse({
              next: (group: Group) => {
                const exists = store.entityMap()[group.id];
                if (exists) {
                  patchState(store, updateEntity({ id: group.id, changes: group }));
                } else {
                  patchState(store, addEntity(group));
                }
                store.finishOperation();
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao carregar grupo');
              },
            })
          )
        )
      )
    ),

    /**
     * Busca grupos com debounce
     */
    searchGroups: rxMethod<string>(
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
          return groupsService.getGroupsByFilters(request).pipe(
            tapResponse({
              next: (result: PagedResult<Group>) => {
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
     * Adiciona um novo grupo
     */
    addGroup: rxMethod<AddGroupRequest>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((request) =>
          groupsService.addGroup(request).pipe(
            tapResponse({
              next: () => {
                store.finishOperation();
                const currentFilter = store.currentFilter();
                const request = toFilterRequest(currentFilter);
                groupsService.getGroupsByFilters(request).subscribe({
                  next: (result) => {
                    patchState(store, setAllEntities(result.entries));
                    store.updatePaginationFromResponse(result);
                    patchState(store, { lastUpdated: new Date() });
                  },
                });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao adicionar grupo');
              },
            })
          )
        )
      )
    ),

    /**
     * Atualiza um grupo existente
     */
    updateGroup: rxMethod<{ id: string; patchDocument: any }>(
      pipe(
        tap(() => store.startOperation()),
        switchMap(({ id, patchDocument }) =>
          groupsService.updateGroup(id, patchDocument).pipe(
            tapResponse({
              next: () => {
                groupsService.getGroupById(id).subscribe({
                  next: (group) => {
                    patchState(store, updateEntity({ id, changes: group }));
                    store.finishOperation();
                    patchState(store, { lastUpdated: new Date() });
                  },
                });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao atualizar grupo');
              },
            })
          )
        )
      )
    ),

    /**
     * Remove um grupo
     */
    deleteGroup: rxMethod<string>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((id) =>
          groupsService.deleteGroup(id).pipe(
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
                store.finishWithError(error.message || 'Erro ao remover grupo');
              },
            })
          )
        )
      )
    ),

    /**
     * Remove múltiplos grupos selecionados
     */
    deleteSelectedGroups(): void {
      const selectedIds = store.selectedIds();
      if (selectedIds.length === 0) return;

      // Filtra grupos do sistema
      const deletableIds = selectedIds.filter(id => {
        const group = store.entityMap()[id];
        return group && !group.isSystemGroup;
      });

      if (deletableIds.length === 0) {
        store.setError('Grupos do sistema não podem ser removidos');
        return;
      }

      store.startOperation();

      const deletePromises = deletableIds.map(id =>
        groupsService.deleteGroup(id).toPromise()
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
          store.finishWithError(error.message || 'Erro ao remover grupos');
        });
    },

    // ========================================================================
    // Operações de Filtro
    // ========================================================================

    setFilter(filter: Partial<GroupsFilter>): void {
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

    filterByParentGroup(parentGroupId: string | undefined): void {
      patchState(store, {
        filter: { ...store.filter(), parentGroupId },
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
      groupsService.getGroupsByFilters(request).subscribe({
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

    getGroupById(id: string): Group | undefined {
      return store.entityMap()[id];
    },

    canDeleteGroup(id: string): boolean {
      const group = store.entityMap()[id];
      return group ? !group.isSystemGroup : false;
    },

    /**
     * Obtém o caminho hierárquico de um grupo
     */
    getGroupPath(id: string): Group[] {
      const path: Group[] = [];
      let current: Group | undefined = store.entityMap()[id];

      while (current) {
        path.unshift(current);
        current = current.parentGroupId
          ? store.entityMap()[current.parentGroupId]
          : undefined;
      }

      return path;
    },
  };}),

  withHooks({
    onInit(store) {
      // store.loadGroups();
    },
  })
);

// ============================================================================
// Types Auxiliares
// ============================================================================

export interface GroupTreeNode extends Group {
  children: GroupTreeNode[];
}

export type GroupsStoreType = InstanceType<typeof GroupsStore>;
