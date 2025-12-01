export interface RolePermission {
  id: string;
  tenantId: string;
  roleId: string;
  permissionId: string;
  grantedAt: string;
  grantedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
}
