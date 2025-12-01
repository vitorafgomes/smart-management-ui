export interface AddRolePermissionRequest {
  tenantId: string;
  roleId: string;
  permissionId: string;
  grantedByUserId?: string;
}
