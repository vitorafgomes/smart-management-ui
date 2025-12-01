import { Component, OnInit, OnDestroy, forwardRef, signal, computed, ElementRef, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, catchError, of } from 'rxjs';
import { TenantsService } from '@core/services/api/identity-tenant/tenants.service';
import { TenantStorageService } from '@core/services/storage/tenant-storage.service';
import { TenantSuggestion } from '@core/models/domain/identity-tenant/tenants/tenant-suggestion';

@Component({
  selector: 'app-tenant-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TenantAutocompleteComponent),
      multi: true
    }
  ],
  template: `
    <div class="position-relative">
      <input
        type="text"
        class="form-control form-control-lg text-white bg-dark border-light border-opacity-25 bg-opacity-25"
        [class.is-invalid]="isInvalid"
        [value]="displayValue()"
        (input)="onInputChange($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        [placeholder]="placeholder"
        autocomplete="off"
      />

      @if (isLoading()) {
        <div class="position-absolute" style="right: 12px; top: 50%; transform: translateY(-50%);">
          <span class="spinner-border spinner-border-sm text-light opacity-50" role="status"></span>
        </div>
      }

      @if (showDropdown() && suggestions().length > 0) {
        <div class="dropdown-menu show w-100 mt-1 bg-dark border-light border-opacity-25"
             style="max-height: 200px; overflow-y: auto;">
          @for (suggestion of suggestions(); track suggestion.id) {
            <button
              type="button"
              class="dropdown-item text-white bg-dark"
              (mousedown)="selectTenant(suggestion)"
              style="cursor: pointer;">
              <div class="d-flex align-items-center">
                <span class="me-2 opacity-50">&#127970;</span>
                <div>
                  <div class="fw-medium">{{ suggestion.keycloakRealmName }}</div>
                  @if (suggestion.companyName) {
                    <small class="text-muted">{{ suggestion.companyName }}</small>
                  }
                </div>
              </div>
            </button>
          }
        </div>
      }

      @if (showDropdown() && suggestions().length === 0 && !isLoading() && displayValue().length >= 3) {
        <div class="dropdown-menu show w-100 mt-1 bg-dark border-light border-opacity-25">
          <div class="dropdown-item text-muted">
            No tenants found
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dropdown-item:hover,
    .dropdown-item:focus {
      background-color: rgba(255, 255, 255, 0.1) !important;
    }
  `]
})
export class TenantAutocompleteComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() placeholder = 'Enter your organization code (min. 3 characters)';
  @Input() isInvalid = false;

  displayValue = signal('');
  suggestions = signal<TenantSuggestion[]>([]);
  isLoading = signal(false);
  showDropdown = signal(false);
  selectedTenant = signal<TenantSuggestion | null>(null);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private onChange: (value: TenantSuggestion | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private tenantsService: TenantsService,
    private tenantStorageService: TenantStorageService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadLastTenant();
    this.setupSearchSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }

  private loadLastTenant(): void {
    const lastTenant = this.tenantStorageService.getLastTenant();
    if (lastTenant) {
      this.selectedTenant.set(lastTenant);
      this.displayValue.set(lastTenant.keycloakRealmName);
      this.onChange(lastTenant);
    }
  }

  private setupSearchSubscription(): void {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.length >= 3),
      switchMap(term => {
        this.isLoading.set(true);
        return this.tenantsService.searchTenantsByRealmName(term).pipe(
          catchError(error => {
            console.error('Error searching tenants:', error);
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      this.suggestions.set(results);
      this.isLoading.set(false);
      this.showDropdown.set(true);
    });
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.displayValue.set(value);
    this.selectedTenant.set(null);
    this.onChange(null); // Clear selected tenant when typing

    if (value.length >= 3) {
      this.searchSubject.next(value);
    } else {
      this.suggestions.set([]);
      this.showDropdown.set(false);
    }
  }

  onFocus(): void {
    if (this.displayValue().length >= 3 && this.suggestions().length > 0) {
      this.showDropdown.set(true);
    }
  }

  onBlur(): void {
    this.onTouched();
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }

  selectTenant(tenant: TenantSuggestion): void {
    this.selectedTenant.set(tenant);
    this.displayValue.set(tenant.keycloakRealmName);
    this.onChange(tenant); // Emit the full tenant object
    this.showDropdown.set(false);
    this.tenantStorageService.saveTenant(tenant);
  }

  // ControlValueAccessor implementation
  writeValue(value: TenantSuggestion | string | null): void {
    if (value && typeof value === 'object' && 'keycloakRealmName' in value) {
      // Received a TenantSuggestion object
      this.selectedTenant.set(value);
      this.displayValue.set(value.keycloakRealmName);
    } else if (typeof value === 'string') {
      this.displayValue.set(value);
    } else {
      this.displayValue.set('');
      this.selectedTenant.set(null);
    }
  }

  registerOnChange(fn: (value: TenantSuggestion | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Handle disabled state if needed
  }
}
