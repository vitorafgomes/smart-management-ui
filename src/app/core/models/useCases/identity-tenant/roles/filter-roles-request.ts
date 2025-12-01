import { HttpParams } from '@angular/common/http';
import { FilteringOperation } from '../common/filtering-operation';
import { PageFilter, toPageFilterString, DEFAULT_PAGE_FILTER } from '../common/page-filter';

/**
 * Request interface for filtering roles
 * Following backend pattern from UseCases/Identities/Roles/Filters/FilterRolesRequest
 */
export interface FilterRolesRequest {
  tenantId: string;
  name?: string;
  nameFilteringOperation?: FilteringOperation;
  description?: string;
  descriptionFilteringOperation?: FilteringOperation;
  keycloakRoleId?: string;
  keycloakRoleIdFilteringOperation?: FilteringOperation;
  isActive?: boolean;
  isSystemRole?: boolean;
  pageFilter?: PageFilter;
}

/**
 * Converts FilterRolesRequest to HttpParams for API call
 * Ensures all required parameters are included with proper defaults
 */
export function toFilterRolesParams(request: FilterRolesRequest): HttpParams {
  let params = new HttpParams()
    .set('TenantId', request.tenantId)
    .set('NameFilteringOperation', request.nameFilteringOperation || FilteringOperation.None)
    .set('DescriptionFilteringOperation', request.descriptionFilteringOperation || FilteringOperation.None)
    .set('KeycloakRoleIdFilteringOperation', request.keycloakRoleIdFilteringOperation || FilteringOperation.None);

  if (request.name) {
    params = params.set('Name', request.name);
  }
  if (request.description) {
    params = params.set('Description', request.description);
  }
  if (request.keycloakRoleId) {
    params = params.set('KeycloakRoleId', request.keycloakRoleId);
  }
  if (request.isActive !== undefined) {
    params = params.set('IsActive', request.isActive.toString());
  }
  if (request.isSystemRole !== undefined) {
    params = params.set('IsSystemRole', request.isSystemRole.toString());
  }

  const pageFilter = request.pageFilter || DEFAULT_PAGE_FILTER;
  params = params.set('PageFilter', toPageFilterString(pageFilter));

  return params;
}
