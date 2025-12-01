export interface AddRoleRequest {
  tenantId: string;
  name: string;
  description: string;
  keycloakRoleId: string;
  isSystemRole: boolean;
  isActive: boolean;
}
