import { HttpParams } from '@angular/common/http';
import { FilteringOperation } from '../common/filtering-operation';
import { PageFilter, toPageFilterString, DEFAULT_PAGE_FILTER } from '../common/page-filter';

/**
 * Request interface for filtering groups
 * Following backend pattern from UseCases/Identities/Groups/Filters/FilterGroupsRequest
 */
export interface FilterGroupsRequest {
  tenantId: string;
  name?: string;
  nameFilteringOperation?: FilteringOperation;
  description?: string;
  descriptionFilteringOperation?: FilteringOperation;
  keycloakGroupId?: string;
  keycloakGroupIdFilteringOperation?: FilteringOperation;
  parentGroupId?: string;
  parentGroupIdFilteringOperation?: FilteringOperation;
  isSystemGroup?: boolean;
  isActive?: boolean;
  pageFilter?: PageFilter;
}

/**
 * Converts FilterGroupsRequest to HttpParams for API call
 * Ensures all required filtering operation parameters are included
 */
export function toFilterGroupsParams(request: FilterGroupsRequest): HttpParams {
  let params = new HttpParams()
    .set('TenantId', request.tenantId)
    .set('NameFilteringOperation', request.nameFilteringOperation || FilteringOperation.None)
    .set('DescriptionFilteringOperation', request.descriptionFilteringOperation || FilteringOperation.None)
    .set('KeycloakGroupIdFilteringOperation', request.keycloakGroupIdFilteringOperation || FilteringOperation.None)
    .set('ParentGroupIdFilteringOperation', request.parentGroupIdFilteringOperation || FilteringOperation.None);

  if (request.name) {
    params = params.set('Name', request.name);
  }
  if (request.description) {
    params = params.set('Description', request.description);
  }
  if (request.keycloakGroupId) {
    params = params.set('KeycloakGroupId', request.keycloakGroupId);
  }
  if (request.parentGroupId) {
    params = params.set('ParentGroupId', request.parentGroupId);
  }
  if (request.isSystemGroup !== undefined) {
    params = params.set('IsSystemGroup', request.isSystemGroup.toString());
  }
  if (request.isActive !== undefined) {
    params = params.set('IsActive', request.isActive.toString());
  }

  const pageFilter = request.pageFilter || DEFAULT_PAGE_FILTER;
  params = params.set('PageFilter', toPageFilterString(pageFilter));

  return params;
}
