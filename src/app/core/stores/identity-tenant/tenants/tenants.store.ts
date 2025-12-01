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

import { Tenant } from '@core/models/domain/identity-tenant/tenants/tenant';
import { TenantStatus as TenantStatusEnum } from '@core/models/domain/identity-tenant/tenants/tenant-status';
import { AddTenant } from '@core/models/useCases/identity-tenant/tenants/add-tenant';
import { TenantsService } from '@core/services/api/identity-tenant/tenants.service';
import { PageFilter } from '@core/models/common/page-filter';
import { PagedResult } from '@core/models/common/paged-result';

import { withLoading } from '../shared/with-loading.feature';
import { withPagination } from '../shared/with-pagination.feature';
import { withSelection } from '../shared/with-selection.feature';

// ============================================================================
// Types
// ============================================================================

export type TenantStatus = 'Active' | 'Suspended' | 'Pending' | 'Cancelled';

export type TenantsFilter = PageFilter & {
  searchTerm?: string;
  status?: TenantStatus;
  regionCode?: string;
  countryCode?: string;
};

type TenantsState = {
  filter: TenantsFilter;
  currentTenantId: string | null;
  lastUpdated: Date | null;
};

const initialState: TenantsState = {
  filter: {
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
  },
  currentTenantId: null,
  lastUpdated: null,
};

// ============================================================================
// Store
// ============================================================================

export const TenantsStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),
  withLoading(),
  withPagination({ pageSize: 10 }),
  withSelection<string>(),
  withEntities<Tenant>(),

  withComputed((store) => ({
    /**
     * Retorna o tenant selecionado atualmente
     */
    selectedTenant: computed(() => {
      const id = store.selectedId();
      if (!id) return null;
      return store.entityMap()[id] ?? null;
    }),

    /**
     * Retorna o tenant atual do contexto
     */
    currentTenant: computed(() => {
      const id = store.currentTenantId();
      if (!id) return null;
      return store.entityMap()[id] ?? null;
    }),

    /**
     * Tenants ativos
     */
    activeTenants: computed(() =>
      store.entities().filter(t => t.status === TenantStatusEnum.Active)
    ),

    /**
     * Tenants suspensos
     */
    suspendedTenants: computed(() =>
      store.entities().filter(t => t.status === TenantStatusEnum.Suspended)
    ),

    /**
     * Tenants pendentes
     */
    pendingTenants: computed(() =>
      store.entities().filter(t => t.status === TenantStatusEnum.Provisioning)
    ),

    /**
     * Tenants por região
     */
    tenantsByRegion: computed(() => {
      const grouped = new Map<string, Tenant[]>();
      store.entities().forEach(tenant => {
        const region = tenant.regionCode || 'Unknown';
        if (!grouped.has(region)) {
          grouped.set(region, []);
        }
        grouped.get(region)!.push(tenant);
      });
      return grouped;
    }),

    /**
     * Tenants por país
     */
    tenantsByCountry: computed(() => {
      const grouped = new Map<string, Tenant[]>();
      store.entities().forEach(tenant => {
        const country = tenant.countryCode || 'Unknown';
        if (!grouped.has(country)) {
          grouped.set(country, []);
        }
        grouped.get(country)!.push(tenant);
      });
      return grouped;
    }),

    /**
     * Contagem por status
     */
    statusCounts: computed(() => ({
      active: store.entities().filter(t => t.status === TenantStatusEnum.Active).length,
      suspended: store.entities().filter(t => t.status === TenantStatusEnum.Suspended).length,
      pending: store.entities().filter(t => t.status === TenantStatusEnum.Provisioning).length,
      cancelled: store.entities().filter(t => t.status === TenantStatusEnum.Inactive).length,
    })),

    /**
     * Tenants com GDPR compliance
     */
    gdprCompliantTenants: computed(() =>
      store.entities().filter(t => t.gdprCompliant)
    ),

    /**
     * Tenants com LGPD compliance
     */
    lgpdCompliantTenants: computed(() =>
      store.entities().filter(t => t.lgpdCompliant)
    ),

    /**
     * Filtro atual
     */
    currentFilter: computed<TenantsFilter>(() => ({
      ...store.filter(),
      pageNumber: store.pageNumber(),
      pageSize: store.pageSize(),
    })),

    /**
     * IDs de todos os tenants
     */
    allTenantIds: computed(() => store.ids() as string[]),

    /**
     * Regiões disponíveis (para filtros)
     */
    availableRegions: computed(() => {
      const regions = new Set<string>();
      store.entities().forEach(t => {
        if (t.regionCode) regions.add(t.regionCode);
      });
      return Array.from(regions).sort();
    }),

    /**
     * Países disponíveis (para filtros)
     */
    availableCountries: computed(() => {
      const countries = new Set<string>();
      store.entities().forEach(t => {
        if (t.countryCode) countries.add(t.countryCode);
      });
      return Array.from(countries).sort();
    }),
  })),

  withMethods((store, tenantsService = inject(TenantsService)) => ({
    // ========================================================================
    // Operações de Leitura
    // ========================================================================

    /**
     * Carrega tenants com filtros
     */
    loadTenants: rxMethod<TenantsFilter | void>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((filter) => {
          const currentFilter = filter ?? store.currentFilter();
          return tenantsService.getTenantsByFilters(currentFilter).pipe(
            tapResponse({
              next: (result: PagedResult<Tenant>) => {
                patchState(store, setAllEntities(result.entries));
                store.updatePaginationFromResponse(result);
                store.finishOperation();
                patchState(store, { lastUpdated: new Date() });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao carregar tenants');
              },
            })
          );
        })
      )
    ),

    /**
     * Carrega um tenant específico por ID
     */
    loadTenantById: rxMethod<string>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((id) =>
          tenantsService.getTenantById(id).pipe(
            tapResponse({
              next: (tenant: Tenant) => {
                const exists = store.entityMap()[tenant.id];
                if (exists) {
                  patchState(store, updateEntity({ id: tenant.id, changes: tenant }));
                } else {
                  patchState(store, addEntity(tenant));
                }
                store.finishOperation();
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao carregar tenant');
              },
            })
          )
        )
      )
    ),

    /**
     * Busca tenants com debounce
     */
    searchTenants: rxMethod<string>(
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
          return tenantsService.getTenantsByFilters(filter).pipe(
            tapResponse({
              next: (result: PagedResult<Tenant>) => {
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
     * Adiciona um novo tenant
     */
    addTenant: rxMethod<AddTenant>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((request) =>
          tenantsService.addTenant(request).pipe(
            tapResponse({
              next: () => {
                store.finishOperation();
                const currentFilter = store.currentFilter();
                tenantsService.getTenantsByFilters(currentFilter).subscribe({
                  next: (result) => {
                    patchState(store, setAllEntities(result.entries));
                    store.updatePaginationFromResponse(result);
                    patchState(store, { lastUpdated: new Date() });
                  },
                });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao adicionar tenant');
              },
            })
          )
        )
      )
    ),

    /**
     * Atualiza um tenant existente
     */
    updateTenant: rxMethod<{ id: string; patchDocument: any }>(
      pipe(
        tap(() => store.startOperation()),
        switchMap(({ id, patchDocument }) =>
          tenantsService.updateTenant(id, patchDocument).pipe(
            tapResponse({
              next: () => {
                tenantsService.getTenantById(id).subscribe({
                  next: (tenant) => {
                    patchState(store, updateEntity({ id, changes: tenant }));
                    store.finishOperation();
                    patchState(store, { lastUpdated: new Date() });
                  },
                });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao atualizar tenant');
              },
            })
          )
        )
      )
    ),

    /**
     * Remove um tenant
     */
    deleteTenant: rxMethod<string>(
      pipe(
        tap(() => store.startOperation()),
        switchMap((id) =>
          tenantsService.deleteTenant(id).pipe(
            tapResponse({
              next: () => {
                patchState(store, removeEntity(id));
                if (store.selectedId() === id) {
                  store.clearSelection();
                }
                if (store.currentTenantId() === id) {
                  patchState(store, { currentTenantId: null });
                }
                store.finishOperation();
                patchState(store, { lastUpdated: new Date() });
              },
              error: (error: Error) => {
                store.finishWithError(error.message || 'Erro ao remover tenant');
              },
            })
          )
        )
      )
    ),

    /**
     * Remove múltiplos tenants selecionados
     */
    deleteSelectedTenants(): void {
      const selectedIds = store.selectedIds();
      if (selectedIds.length === 0) return;

      store.startOperation();

      const deletePromises = selectedIds.map(id =>
        tenantsService.deleteTenant(id).toPromise()
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
          store.finishWithError(error.message || 'Erro ao remover tenants');
        });
    },

    // ========================================================================
    // Gerenciamento de Tenant Atual
    // ========================================================================

    /**
     * Define o tenant atual do contexto
     */
    setCurrentTenant(tenantId: string | null): void {
      patchState(store, { currentTenantId: tenantId });
    },

    /**
     * Carrega e define o tenant atual
     */
    loadAndSetCurrentTenant: rxMethod<string>(
      pipe(
        tap((id) => patchState(store, { currentTenantId: id })),
        tap(() => store.startOperation()),
        switchMap((id) =>
          tenantsService.getTenantById(id).pipe(
            tapResponse({
              next: (tenant: Tenant) => {
                const exists = store.entityMap()[tenant.id];
                if (exists) {
                  patchState(store, updateEntity({ id: tenant.id, changes: tenant }));
                } else {
                  patchState(store, addEntity(tenant));
                }
                store.finishOperation();
              },
              error: (error: Error) => {
                patchState(store, { currentTenantId: null });
                store.finishWithError(error.message || 'Erro ao carregar tenant');
              },
            })
          )
        )
      )
    ),

    // ========================================================================
    // Operações de Filtro
    // ========================================================================

    setFilter(filter: Partial<TenantsFilter>): void {
      patchState(store, {
        filter: { ...store.filter(), ...filter },
      });
    },

    filterByStatus(status: TenantStatus | undefined): void {
      patchState(store, {
        filter: { ...store.filter(), status },
      });
      store.setPage(1);
    },

    filterByRegion(regionCode: string | undefined): void {
      patchState(store, {
        filter: { ...store.filter(), regionCode },
      });
      store.setPage(1);
    },

    filterByCountry(countryCode: string | undefined): void {
      patchState(store, {
        filter: { ...store.filter(), countryCode },
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
      store.startOperation();
      tenantsService.getTenantsByFilters(filter).subscribe({
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

    getTenantById(id: string): Tenant | undefined {
      return store.entityMap()[id];
    },

    /**
     * Verifica se o tenant atual está ativo
     */
    isCurrentTenantActive(): boolean {
      const current = store.currentTenant();
      return current?.status === TenantStatusEnum.Active;
    },

    /**
     * Obtém configurações regionais do tenant
     */
    getTenantLocaleSettings(id: string): TenantLocaleSettings | null {
      const tenant = store.entityMap()[id];
      if (!tenant) return null;

      return {
        language: tenant.defaultLanguage,
        currency: tenant.defaultCurrency,
        timezone: tenant.defaultTimezone,
        dateFormat: tenant.dateFormat,
        timeFormat: tenant.timeFormat,
        decimalSeparator: tenant.decimalSeparator,
        thousandsSeparator: tenant.thousandsSeparator,
        measurementSystem: tenant.measurementSystem,
      };
    },
  })),

  withHooks({
    onInit(store) {
      // store.loadTenants();
    },
  })
);

// ============================================================================
// Types Auxiliares
// ============================================================================

export interface TenantLocaleSettings {
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  measurementSystem: string;
}

export type TenantsStoreType = InstanceType<typeof TenantsStore>;
