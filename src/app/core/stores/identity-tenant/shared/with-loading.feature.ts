import { computed } from '@angular/core';
import {
  signalStoreFeature,
  withState,
  withComputed,
  withMethods,
  patchState,
  type,
} from '@ngrx/signals';

export type LoadingState = {
  isLoading: boolean;
  error: string | null;
};

const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
};

/**
 * Feature reutilizável para gerenciamento de estado de loading e erros.
 * Pode ser usada em qualquer SignalStore do domínio.
 *
 * @example
 * ```typescript
 * export const UsersStore = signalStore(
 *   withLoading(),
 *   withEntities<User>(),
 *   // ...
 * );
 * ```
 */
export function withLoading() {
  return signalStoreFeature(
    withState<LoadingState>(initialLoadingState),

    withComputed((store) => ({
      /**
       * Indica se há um erro no estado
       */
      hasError: computed(() => store.error() !== null),

      /**
       * Indica se está em um estado válido (não loading e sem erro)
       */
      isReady: computed(() => !store.isLoading() && store.error() === null),
    })),

    withMethods((store) => ({
      /**
       * Define o estado de loading
       */
      setLoading(isLoading: boolean): void {
        patchState(store, { isLoading });
      },

      /**
       * Define um erro e desativa o loading
       */
      setError(error: string | null): void {
        patchState(store, { error, isLoading: false });
      },

      /**
       * Limpa o estado de erro
       */
      clearError(): void {
        patchState(store, { error: null });
      },

      /**
       * Inicia uma operação (ativa loading e limpa erro)
       */
      startOperation(): void {
        patchState(store, { isLoading: true, error: null });
      },

      /**
       * Finaliza uma operação com sucesso
       */
      finishOperation(): void {
        patchState(store, { isLoading: false, error: null });
      },

      /**
       * Finaliza uma operação com erro
       */
      finishWithError(error: string): void {
        patchState(store, { isLoading: false, error });
      },
    }))
  );
}