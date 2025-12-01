import { computed } from '@angular/core';
import {
  signalStoreFeature,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';

export type SelectionState<TId = string> = {
  selectedId: TId | null;
  selectedIds: TId[];
  isMultiSelectMode: boolean;
};

function initialSelectionState<TId>(): SelectionState<TId> {
  return {
    selectedId: null,
    selectedIds: [],
    isMultiSelectMode: false,
  };
}

/**
 * Feature reutilizável para gerenciamento de seleção (single e multi-select).
 *
 * @example
 * ```typescript
 * export const UsersStore = signalStore(
 *   withSelection<string>(),
 *   withEntities<User>(),
 *   // ...
 * );
 *
 * // No componente:
 * store.select(userId);
 * store.toggleSelection(userId);
 * store.selectAll(userIds);
 * ```
 */
export function withSelection<TId = string>() {
  return signalStoreFeature(
    withState<SelectionState<TId>>(initialSelectionState<TId>()),

    withComputed((store) => ({
      /**
       * Indica se há algum item selecionado
       */
      hasSelection: computed(() =>
        store.selectedId() !== null || store.selectedIds().length > 0
      ),

      /**
       * Retorna a contagem de itens selecionados
       */
      selectionCount: computed(() =>
        store.isMultiSelectMode()
          ? store.selectedIds().length
          : store.selectedId() !== null ? 1 : 0
      ),

      /**
       * Indica se está no modo de seleção múltipla
       */
      isMultiSelect: computed(() => store.isMultiSelectMode()),
    })),

    withMethods((store) => ({
      /**
       * Seleciona um único item (modo single-select)
       */
      select(id: TId): void {
        patchState(store, {
          selectedId: id,
          isMultiSelectMode: false,
          selectedIds: [],
        });
      },

      /**
       * Limpa a seleção
       */
      clearSelection(): void {
        patchState(store, {
          selectedId: null,
          selectedIds: [],
        });
      },

      /**
       * Alterna a seleção de um item (para multi-select)
       */
      toggleSelection(id: TId): void {
        const currentIds = store.selectedIds();
        const isSelected = currentIds.includes(id);

        patchState(store, {
          isMultiSelectMode: true,
          selectedId: null,
          selectedIds: isSelected
            ? currentIds.filter(existingId => existingId !== id)
            : [...currentIds, id],
        });
      },

      /**
       * Seleciona múltiplos itens
       */
      selectMany(ids: TId[]): void {
        patchState(store, {
          isMultiSelectMode: true,
          selectedId: null,
          selectedIds: [...new Set(ids)], // Remove duplicatas
        });
      },

      /**
       * Seleciona todos os itens fornecidos
       */
      selectAll(allIds: TId[]): void {
        patchState(store, {
          isMultiSelectMode: true,
          selectedId: null,
          selectedIds: [...allIds],
        });
      },

      /**
       * Verifica se um item está selecionado
       */
      isSelected(id: TId): boolean {
        if (store.isMultiSelectMode()) {
          return store.selectedIds().includes(id);
        }
        return store.selectedId() === id;
      },

      /**
       * Alterna o modo de seleção múltipla
       */
      setMultiSelectMode(enabled: boolean): void {
        if (enabled) {
          // Ao ativar multi-select, move o item selecionado para o array
          const currentId = store.selectedId();
          patchState(store, {
            isMultiSelectMode: true,
            selectedId: null,
            selectedIds: currentId !== null ? [currentId] : [],
          });
        } else {
          // Ao desativar, pega o primeiro item selecionado
          const firstId = store.selectedIds()[0] ?? null;
          patchState(store, {
            isMultiSelectMode: false,
            selectedId: firstId,
            selectedIds: [],
          });
        }
      },
    }))
  );
}
