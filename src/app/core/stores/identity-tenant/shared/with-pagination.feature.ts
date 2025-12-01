import { computed } from '@angular/core';
import {
  signalStoreFeature,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { PageFilter } from '@core/models/common/page-filter';

export type PaginationState = {
  pageNumber: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  pageSizeLimit: number;
};

const initialPaginationState: PaginationState = {
  pageNumber: 1,
  pageSize: 10,
  totalResults: 0,
  totalPages: 0,
  pageSizeLimit: 100,
};

/**
 * Feature reutilizável para gerenciamento de paginação.
 * Baseada na estrutura PagedResult da API.
 *
 * @example
 * ```typescript
 * export const UsersStore = signalStore(
 *   withPagination(),
 *   withEntities<User>(),
 *   // ...
 * );
 * ```
 */
export function withPagination(initialState?: Partial<PaginationState>) {
  const mergedInitialState: PaginationState = {
    ...initialPaginationState,
    ...initialState,
  };

  return signalStoreFeature(
    withState<PaginationState>(mergedInitialState),

    withComputed((store) => ({
      /**
       * Retorna o filtro de página atual para usar nas requisições
       */
      pageFilter: computed<PageFilter>(() => ({
        pageNumber: store.pageNumber(),
        pageSize: store.pageSize(),
      })),

      /**
       * Indica se há uma página anterior
       */
      hasPreviousPage: computed(() => store.pageNumber() > 1),

      /**
       * Indica se há uma próxima página
       */
      hasNextPage: computed(() => store.pageNumber() < store.totalPages()),

      /**
       * Indica se está na primeira página
       */
      isFirstPage: computed(() => store.pageNumber() === 1),

      /**
       * Indica se está na última página
       */
      isLastPage: computed(() => store.pageNumber() === store.totalPages()),

      /**
       * Indica se há resultados
       */
      hasResults: computed(() => store.totalResults() > 0),

      /**
       * Retorna o índice do primeiro item da página atual (1-based)
       */
      firstItemIndex: computed(() => {
        if (store.totalResults() === 0) return 0;
        return (store.pageNumber() - 1) * store.pageSize() + 1;
      }),

      /**
       * Retorna o índice do último item da página atual
       */
      lastItemIndex: computed(() => {
        const last = store.pageNumber() * store.pageSize();
        return Math.min(last, store.totalResults());
      }),

      /**
       * Retorna array de números de páginas disponíveis (útil para paginadores)
       */
      pageNumbers: computed(() => {
        const total = store.totalPages();
        return Array.from({ length: total }, (_, i) => i + 1);
      }),
    })),

    withMethods((store) => ({
      /**
       * Define a página atual
       */
      setPage(pageNumber: number): void {
        const validPage = Math.max(1, Math.min(pageNumber, store.totalPages() || 1));
        patchState(store, { pageNumber: validPage });
      },

      /**
       * Define o tamanho da página
       */
      setPageSize(pageSize: number): void {
        const validSize = Math.max(1, Math.min(pageSize, store.pageSizeLimit()));
        patchState(store, { pageSize: validSize, pageNumber: 1 });
      },

      /**
       * Vai para a próxima página
       */
      nextPage(): void {
        if (store.pageNumber() < store.totalPages()) {
          patchState(store, { pageNumber: store.pageNumber() + 1 });
        }
      },

      /**
       * Vai para a página anterior
       */
      previousPage(): void {
        if (store.pageNumber() > 1) {
          patchState(store, { pageNumber: store.pageNumber() - 1 });
        }
      },

      /**
       * Vai para a primeira página
       */
      firstPage(): void {
        patchState(store, { pageNumber: 1 });
      },

      /**
       * Vai para a última página
       */
      lastPage(): void {
        patchState(store, { pageNumber: store.totalPages() });
      },

      /**
       * Atualiza os totais da paginação (geralmente após uma resposta da API)
       */
      updatePaginationFromResponse(response: {
        totalResults: number;
        totalPages: number;
        pageNumber: number;
        pageSize: number;
        pageSizeLimit?: number;
      }): void {
        patchState(store, {
          totalResults: response.totalResults,
          totalPages: response.totalPages,
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
          pageSizeLimit: response.pageSizeLimit ?? store.pageSizeLimit(),
        });
      },

      /**
       * Reseta a paginação para o estado inicial
       */
      resetPagination(): void {
        patchState(store, mergedInitialState);
      },
    }))
  );
}
