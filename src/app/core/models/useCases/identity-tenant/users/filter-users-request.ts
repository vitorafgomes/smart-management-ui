import { HttpParams } from '@angular/common/http';
import { FilteringOperation } from '../common/filtering-operation';
import { PageFilter, toPageFilterString, DEFAULT_PAGE_FILTER } from '../common/page-filter';

/**
 * Request interface for filtering users
 * Following backend pattern from UseCases/Identities/Users/Filters/FilterUsersRequest
 */
export interface FilterUsersRequest {
  tenantId: string;
  keycloakUserId?: string;
  keycloakUserIdFilteringOperation?: FilteringOperation;
  email?: string;
  emailFilteringOperation?: FilteringOperation;
  username?: string;
  usernameFilteringOperation?: FilteringOperation;
  firstName?: string;
  firstNameFilteringOperation?: FilteringOperation;
  lastName?: string;
  lastNameFilteringOperation?: FilteringOperation;
  displayName?: string;
  displayNameFilteringOperation?: FilteringOperation;
  phone?: string;
  phoneFilteringOperation?: FilteringOperation;
  mobile?: string;
  mobileFilteringOperation?: FilteringOperation;
  preferredLanguage?: string;
  preferredLanguageFilteringOperation?: FilteringOperation;
  preferredTimezone?: string;
  preferredTimezoneFilteringOperation?: FilteringOperation;
  preferredCurrency?: string;
  preferredCurrencyFilteringOperation?: FilteringOperation;
  countryCode?: string;
  countryCodeFilteringOperation?: FilteringOperation;
  city?: string;
  cityFilteringOperation?: FilteringOperation;
  stateProvince?: string;
  stateProvinceFilteringOperation?: FilteringOperation;
  twoFactorMethod?: string;
  twoFactorMethodFilteringOperation?: FilteringOperation;
  lastLoginIp?: string;
  lastLoginIpFilteringOperation?: FilteringOperation;
  lastLoginCountry?: string;
  lastLoginCountryFilteringOperation?: FilteringOperation;
  deactivationReason?: string;
  deactivationReasonFilteringOperation?: FilteringOperation;
  isActive?: boolean;
  isAdmin?: boolean;
  pageFilter?: PageFilter;
}

/**
 * Converts FilterUsersRequest to HttpParams for API call
 * Ensures all required filtering operation parameters are included
 */
export function toFilterUsersParams(request: FilterUsersRequest): HttpParams {
  let params = new HttpParams()
    .set('TenantId', request.tenantId)
    .set('KeycloakUserIdFilteringOperation', request.keycloakUserIdFilteringOperation || FilteringOperation.None)
    .set('EmailFilteringOperation', request.emailFilteringOperation || FilteringOperation.None)
    .set('UsernameFilteringOperation', request.usernameFilteringOperation || FilteringOperation.None)
    .set('FirstNameFilteringOperation', request.firstNameFilteringOperation || FilteringOperation.None)
    .set('LastNameFilteringOperation', request.lastNameFilteringOperation || FilteringOperation.None)
    .set('DisplayNameFilteringOperation', request.displayNameFilteringOperation || FilteringOperation.None)
    .set('PhoneFilteringOperation', request.phoneFilteringOperation || FilteringOperation.None)
    .set('MobileFilteringOperation', request.mobileFilteringOperation || FilteringOperation.None)
    .set('PreferredLanguageFilteringOperation', request.preferredLanguageFilteringOperation || FilteringOperation.None)
    .set('PreferredTimezoneFilteringOperation', request.preferredTimezoneFilteringOperation || FilteringOperation.None)
    .set('PreferredCurrencyFilteringOperation', request.preferredCurrencyFilteringOperation || FilteringOperation.None)
    .set('CountryCodeFilteringOperation', request.countryCodeFilteringOperation || FilteringOperation.None)
    .set('CityFilteringOperation', request.cityFilteringOperation || FilteringOperation.None)
    .set('StateProvinceFilteringOperation', request.stateProvinceFilteringOperation || FilteringOperation.None)
    .set('TwoFactorMethodFilteringOperation', request.twoFactorMethodFilteringOperation || FilteringOperation.None)
    .set('LastLoginIpFilteringOperation', request.lastLoginIpFilteringOperation || FilteringOperation.None)
    .set('LastLoginCountryFilteringOperation', request.lastLoginCountryFilteringOperation || FilteringOperation.None)
    .set('DeactivationReasonFilteringOperation', request.deactivationReasonFilteringOperation || FilteringOperation.None);

  // Add optional filter values
  if (request.keycloakUserId) {
    params = params.set('KeycloakUserId', request.keycloakUserId);
  }
  if (request.email) {
    params = params.set('Email', request.email);
  }
  if (request.username) {
    params = params.set('Username', request.username);
  }
  if (request.firstName) {
    params = params.set('FirstName', request.firstName);
  }
  if (request.lastName) {
    params = params.set('LastName', request.lastName);
  }
  if (request.displayName) {
    params = params.set('DisplayName', request.displayName);
  }
  if (request.phone) {
    params = params.set('Phone', request.phone);
  }
  if (request.mobile) {
    params = params.set('Mobile', request.mobile);
  }
  if (request.preferredLanguage) {
    params = params.set('PreferredLanguage', request.preferredLanguage);
  }
  if (request.preferredTimezone) {
    params = params.set('PreferredTimezone', request.preferredTimezone);
  }
  if (request.preferredCurrency) {
    params = params.set('PreferredCurrency', request.preferredCurrency);
  }
  if (request.countryCode) {
    params = params.set('CountryCode', request.countryCode);
  }
  if (request.city) {
    params = params.set('City', request.city);
  }
  if (request.stateProvince) {
    params = params.set('StateProvince', request.stateProvince);
  }
  if (request.twoFactorMethod) {
    params = params.set('TwoFactorMethod', request.twoFactorMethod);
  }
  if (request.lastLoginIp) {
    params = params.set('LastLoginIp', request.lastLoginIp);
  }
  if (request.lastLoginCountry) {
    params = params.set('LastLoginCountry', request.lastLoginCountry);
  }
  if (request.deactivationReason) {
    params = params.set('DeactivationReason', request.deactivationReason);
  }
  if (request.isActive !== undefined) {
    params = params.set('IsActive', request.isActive.toString());
  }
  if (request.isAdmin !== undefined) {
    params = params.set('IsAdmin', request.isAdmin.toString());
  }

  const pageFilter = request.pageFilter || DEFAULT_PAGE_FILTER;
  params = params.set('PageFilter', toPageFilterString(pageFilter));

  return params;
}
