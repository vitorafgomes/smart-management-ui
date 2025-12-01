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

import { User } from '@core/models/domain/identity-tenant/identities/user';
import { AddUserRequest, FilterUsersRequest, FilteringOperation } from '@core/models/useCases/identity-tenant';
import { UsersService } from '@core/services/api/identity-tenant/users.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { PageFilter } from '@core/models/common/page-filter';
import { PagedResult } from '@core/models/common/paged-result';

import { withLoading } from '../shared/with-loading.feature';
import { withPagination } from '../shared/with-pagination.feature';
import { withSelection } from '../shared/with-selection.feature';

// ============================================================================
// Types
// ============================================================================

export type UsersFilter = PageFilter & {
  searchTerm?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  tenantId?: string;
};

type UsersState = {
  filter: UsersFilter;
  lastUpdated: Date | null;
};

const initialState: UsersState = {
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

export const UsersStore = signalStore(
  { providedIn: 'root' },

  // Estado inicial
  withState(initialState),

  // Features reutilizáveis
  withLoading(),
  withPagination({ pageSize: 10 }),
  withSelection<string>(),

  // Gerenciamento de entidades
  withEntities<User>(),

  // Computed properties
  withComputed((store) => ({
    /**
     * Retorna o usuário selecionado atualmente
     */
    selectedUser: computed(() => {
      const id = store.selectedId();
      if (!id) return null;
      return store.entityMap()[id] ?? null;
    }),

    /**
     * Retorna apenas usuários ativos
     */
    activeUsers: computed(() =>
      store.entities().filter(user => user.isActive)
    ),

    /**
     * Retorna apenas usuários inativos
     */
    inactiveUsers: computed(() =>
      store.entities().filter(user => !user.isActive)
    ),

    /**
     * Retorna apenas administradores
     */
    adminUsers: computed(() =>
      store.entities().filter(user => user.isAdmin)
    ),

    /**
     * Contagem de usuários ativos
     */
    activeUsersCount: computed(() =>
      store.entities().filter(user => user.isActive).length
    ),

    /**
     * Retorna o filtro atual combinado com a paginação
     */
    currentFilter: computed<UsersFilter>(() => ({
      ...store.filter(),
      pageNumber: store.pageNumber(),
      pageSize: store.pageSize(),
    })),

    /**
     * Indica se há dados carregados
     */
    hasData: computed(() => store.entities().length > 0),

    /**
     * IDs de todos os usuários (útil para selectAll)
     */
    allUserIds: computed(() => store.ids() as string[]),
  })),

  // Métodos
  withMethods((store, usersService = inject(UsersService), tenantStorage = inject(TenantStorageService)) => {
    // Helper to convert internal filter to FilterUsersRequest
    const toFilterRequest = (filter: UsersFilter): FilterUsersRequest => {
      const tenant = tenantStorage.getLastTenant();
      if (!tenant) {
        throw new Error('No tenant selected');
      }
      return {
        tenantId: tenant.id,
        username: filter.searchTerm || undefined,
        usernameFilteringOperation: filter.searchTerm ? FilteringOperation.Contains : undefined,
        isActive: filter.isActive,
        isAdmin: filter.isAdmin,
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
     * Carrega usuários com filtros (método reativo)
     */
    loadUsers: rxMethod<UsersFilter | void>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((filter) => {
          const currentFilter = filter ?? store.currentFilter();
          const request = toFilterRequest(currentFilter);
          return usersService.getUsersByFilters(request).pipe(
            tapResponse({
              next: (result: PagedResult<User>) => {
                patchState(store, setAllEntities(result.entries));
                store.updatePaginationFromResponse(result);
                store.finishOperation();
                patchState(store, { lastUpdated: new Date() });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao carregar usuários');
              },
            })
          );
        })
      )
    ),

    /**
     * Carrega um usuário específico por ID
     */
    loadUserById: rxMethod<string>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((id) =>
          usersService.getUserById(id).pipe(
            tapResponse({
              next: (user: User) => {
                // Atualiza ou adiciona a entidade
                const exists = store.entityMap()[user.id];
                if (exists) {
                  patchState(store, updateEntity({ id: user.id, changes: user }));
                } else {
                  patchState(store, addEntity(user));
                }
                store.finishOperation();
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao carregar usuário');
              },
            })
          )
        )
      )
    ),

    /**
     * Busca usuários com debounce (para campos de pesquisa)
     */
    searchUsers: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((searchTerm) => {
          patchState(store, {
            filter: { ...store.filter(), searchTerm },
          });
          store.setPage(1); // Reset para primeira página
        }),
        switchMap((searchTerm) => {
          store.startOperation();
          const filter = { ...store.currentFilter(), searchTerm };
          const request = toFilterRequest(filter);
          return usersService.getUsersByFilters(request).pipe(
            tapResponse({
              next: (result: PagedResult<User>) => {
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
     * Adiciona um novo usuário
     */
    addUser: rxMethod<AddUserRequest>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((request) =>
          usersService.addUser(request).pipe(
            tapResponse({
              next: () => {
                // Recarrega a lista após adicionar
                store.finishOperation();
                // Dispara reload da lista
                const currentFilter = store.currentFilter();
                const request = toFilterRequest(currentFilter);
                usersService.getUsersByFilters(request).subscribe({
                  next: (result) => {
                    patchState(store, setAllEntities(result.entries));
                    store.updatePaginationFromResponse(result);
                    patchState(store, { lastUpdated: new Date() });
                  },
                });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao adicionar usuário');
              },
            })
          )
        )
      )
    ),

    /**
     * Atualiza um usuário existente
     */
    updateUser: rxMethod<{ id: string; patchDocument: any }>(
      pipe(
        tap(() => store.startOperation()),
        switchMap(({ id, patchDocument }) =>
          usersService.updateUserPatch(id, patchDocument).pipe(
            tapResponse({
              next: () => {
                // Recarrega o usuário atualizado
                usersService.getUserById(id).subscribe({
                  next: (user) => {
                    patchState(store, updateEntity({ id, changes: user }));
                    store.finishOperation();
                    patchState(store, { lastUpdated: new Date() });
                  },
                });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao atualizar usuário');
              },
            })
          )
        )
      )
    ),

    /**
     * Remove um usuário
     */
    deleteUser: rxMethod<string>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((id) =>
          usersService.deleteUser(id).pipe(
            tapResponse({
              next: () => {
                patchState(store, removeEntity(id));
                // Limpa seleção se era o usuário selecionado
                if (store.selectedId() === id) {
                  store.clearSelection();
                }
                store.finishOperation();
                patchState(store, { lastUpdated: new Date() });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao remover usuário');
              },
            })
          )
        )
      )
    ),

    /**
     * Remove múltiplos usuários selecionados
     */
    deleteSelectedUsers(): void {
      const selectedIds = store.selectedIds();
      if (selectedIds.length === 0) return;

      store.startOperation();

      // Processa em sequência para evitar problemas de concorrência
      const deletePromises = selectedIds.map(id =>
        usersService.deleteUser(id).toPromise()
      );

      Promise.all(deletePromises)
        .then(() => {
          selectedIds.forEach(id => {
            patchState(store, removeEntity(id));
          });
          store.clearSelection();
          store.finishOperation();
          patchState(store, { lastUpdated: new Date() });
        })
        .catch((error) => {
          store.finishWithError(error.message || 'Erro ao remover usuários');
        });
    },

    // ========================================================================
    // Operações de Filtro
    // ========================================================================

    /**
     * Atualiza os filtros
     */
    setFilter(filter: Partial<UsersFilter>): void {
      patchState(store, {
        filter: { ...store.filter(), ...filter },
      });
    },

    /**
     * Filtra por status ativo/inativo
     */
    filterByActiveStatus(isActive: boolean | undefined): void {
      patchState(store, {
        filter: { ...store.filter(), isActive },
      });
      store.setPage(1);
    },

    /**
     * Limpa todos os filtros
     */
    clearFilters(): void {
      patchState(store, {
        filter: initialState.filter,
      });
      store.resetPagination();
    },

    /**
     * Recarrega os dados com os filtros atuais
     */
    refresh(): void {
      const filter = store.currentFilter();
      const request = toFilterRequest(filter);
      store.startOperation();
      usersService.getUsersByFilters(request).subscribe({
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
  };}),

  // Hooks do ciclo de vida
  withHooks({
    onInit(store) {
      // Carrega usuários iniciais automaticamente
      // Descomente se quiser carregar automaticamente:
      // store.loadUsers();
    },
    onDestroy(store) {
      // Cleanup se necessário
    },
  })
);

// ============================================================================
// Type Export
// ============================================================================

export type UsersStoreType = InstanceType<typeof UsersStore>;
