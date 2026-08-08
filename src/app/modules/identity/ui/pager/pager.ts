import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Page navigation for the three identity listings. Replaces the legacy `ngb-pagination`, which
 * would have meant adding `@ng-bootstrap` for one control - the shell dropped that dependency in
 * Phase 1 and nothing else here needs it.
 */
@Component({
  selector: 'app-identity-pager',
  templateUrl: './pager.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pager {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalResults = input.required<number>();

  readonly pageChange = output<number>();

  protected readonly hasPrevious = computed(() => this.page() > 1);
  protected readonly hasNext = computed(() => this.page() < this.totalPages());

  protected go(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}
