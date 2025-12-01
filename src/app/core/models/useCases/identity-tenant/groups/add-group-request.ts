export interface AddGroupRequest {
  tenantId: string;
  name: string;
  description: string;
  keycloakGroupId: string;
  parentGroupId?: string;
  isSystemGroup: boolean;
  isActive: boolean;
  memberCount: number;
}
